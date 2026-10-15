import { useEffect, useMemo, useRef, useState } from 'react';
import { FiAlertCircle, FiChevronRight, FiLoader, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import { useProjectMember } from '../../../hooks/useProjectMember';
import { picocWizardService, type OpenAlexClassification, type TaxonomyItem, type TaxonomyLevel } from '../../../services/picocWizardService';

const hierarchy: TaxonomyLevel[] = ['domain', 'field', 'subfield', 'topic'];
const labels: Record<TaxonomyLevel, string> = {
  domain: 'Domain',
  field: 'Field',
  subfield: 'Subfield',
  topic: 'Topic',
};
const DISCLOSURE_VERSION = 'openalex-2026-10';

type KeywordChip = { id: string; label: string; provenance: 'openalex' | 'manual' };

export default function PicocFieldConfirmation({
  projectId,
  projectTitle,
}: {
  projectId: string;
  projectTitle?: string;
}) {
  const { member, isLoading: isLoadingMembership } = useProjectMember(projectId);
  const isOwner = member?.isLeader ?? false;
  const [title, setTitle] = useState(projectTitle ?? '');
  const [abstract, setAbstract] = useState('');
  const [inputsConfirmed, setInputsConfirmed] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [activeLevel, setActiveLevel] = useState<TaxonomyLevel>('domain');
  const [selectedPath, setSelectedPath] = useState<Partial<Record<TaxonomyLevel, TaxonomyItem>>>({});
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classification, setClassification] = useState<OpenAlexClassification | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationError, setClassificationError] = useState<string | null>(null);
  const [manualKeyword, setManualKeyword] = useState('');
  const [keywordChips, setKeywordChips] = useState<KeywordChip[]>([]);
  const [memberConfirmationState, setMemberConfirmationState] = useState<'loading' | 'empty' | 'error'>('loading');
  const [memberConfirmationError, setMemberConfirmationError] = useState(false);
  const [memberConfirmationRetry, setMemberConfirmationRetry] = useState(0);
  const memberRole = member?.roleText;
  const requestSequence = useRef(0);

  const parentId = useMemo(() => {
    const index = hierarchy.indexOf(activeLevel);
    return index > 0 ? selectedPath[hierarchy[index - 1]]?.id : undefined;
  }, [activeLevel, selectedPath]);

  useEffect(() => {
    if (isLoadingMembership || isOwner || !memberRole) return;
    let current = true;
    setMemberConfirmationState('loading');
    setMemberConfirmationError(false);
    picocWizardService.getConfirmation(projectId).then((result) => {
      if (current) setMemberConfirmationState(result.state === 'noCurrentConfirmedResult' ? 'empty' : 'error');
    }).catch(() => {
      if (current) {
        setMemberConfirmationError(true);
        setMemberConfirmationState('error');
      }
    });
    return () => { current = false; };
  }, [isLoadingMembership, isOwner, memberRole, memberConfirmationRetry, projectId]);

  if (isLoadingMembership) return <p className="mt-8 rounded-lg border border-border bg-surface-white p-4 text-sm text-text-secondary" role="status" aria-live="polite">Checking project permissions…</p>;
  if (!isOwner) {
    if (!member) return <p className="mt-8 rounded-lg border border-border bg-surface-white p-4 text-sm text-text-secondary" role="status">Field confirmation is unavailable for this account.</p>;
    return <section aria-labelledby="picoc-field-confirmation-title" className="mt-8 rounded-xl border border-border bg-surface-white p-5 shadow-sm sm:p-7">
      <h2 id="picoc-field-confirmation-title" className="text-xl font-semibold text-text-primary">Confirmed research field</h2>
      {memberConfirmationState === 'loading' && <p className="mt-3 text-sm text-text-secondary" role="status" aria-live="polite">Loading the current confirmed result…</p>}
      {memberConfirmationState === 'empty' && <p className="mt-3 text-sm text-text-secondary" role="status">There is no current confirmed research field.</p>}
      {memberConfirmationError && <p className="mt-3 text-sm text-red-700" role="alert">Could not load the confirmed result. <button type="button" className="underline" onClick={() => setMemberConfirmationRetry((count) => count + 1)}>Retry</button></p>}
    </section>;
  }

  const loadPage = async (options: { level?: TaxonomyLevel; parentId?: string; search?: string; cursor?: string } = {}) => {
    const level = options.level ?? activeLevel;
    const sequence = ++requestSequence.current;
    setIsLoading(true);
    setError(null);
    try {
      const page = await picocWizardService.browseTaxonomy(projectId, {
        level,
        ...(options.parentId ? { parentId: options.parentId } : {}),
        ...(options.search?.trim() ? { search: options.search.trim() } : {}),
        ...(options.cursor ? { cursor: options.cursor } : {}),
        limit: 25,
      });
      if (sequence !== requestSequence.current) return;
      setItems((current) => {
        const combined = options.cursor ? [...current, ...page.items] : page.items;
        const seen = new Set<string>();
        return combined.filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      });
      setNextCursor(page.nextCursor);
    } catch (requestError) {
      if (sequence !== requestSequence.current) return;
      const status = (requestError as { response?: { status?: number } })?.response?.status;
      setError(status === 504
        ? 'OpenAlex taxonomy search timed out. Retry the request.'
        : status === 429
          ? 'OpenAlex is rate limiting taxonomy requests. Retry shortly.'
          : 'Could not load the OpenAlex taxonomy. Retry the request.');
    } finally {
      if (sequence === requestSequence.current) setIsLoading(false);
    }
  };

  const openLevel = (level: TaxonomyLevel, path = selectedPath) => {
    setActiveLevel(level);
    setSearch('');
    const index = hierarchy.indexOf(level);
    const parent = index > 0 ? path[hierarchy[index - 1]] : undefined;
    void loadPage({ level, parentId: parent?.id });
  };

  const selectItem = (item: TaxonomyItem) => {
    const index = hierarchy.indexOf(item.level);
    const nextPath = { ...selectedPath };
    for (const level of hierarchy.slice(index)) delete nextPath[level];
    nextPath[item.level] = item;
    setSelectedPath(nextPath);
    setConsentAccepted(false);
    if (item.level !== 'topic') {
      const childLevel = hierarchy[index + 1];
      setActiveLevel(childLevel);
      setSearch('');
      void loadPage({ level: childLevel, parentId: item.id });
      return;
    }
    setActiveLevel('topic');
  };

  const addManualKeyword = () => {
    const label = manualKeyword.trim();
    if (!label || keywordChips.some((chip) => chip.label.toLocaleLowerCase() === label.toLocaleLowerCase())) return;
    setKeywordChips((current) => [...current, { id: `manual-${crypto.randomUUID()}`, label, provenance: 'manual' }]);
    setManualKeyword('');
  };

  const selectedTopic = selectedPath.topic;
  const combinedLength = Array.from(`${title.trim().replace(/\s+/g, ' ')}${abstract.trim().replace(/\s+/g, ' ')}`).length;
  const inputsValid = Boolean(title.trim() && abstract.trim()) && combinedLength >= 20 && combinedLength <= 2000 && title.length <= 4000 && abstract.length <= 4000;
  const submitDisabled = !inputsValid || !inputsConfirmed || !consentAccepted || isClassifying;

  const classify = async () => {
    if (submitDisabled) return;
    setIsClassifying(true);
    setClassificationError(null);
    setClassification(null);
    setConsentAccepted(false);
    try {
      const result = await picocWizardService.classify(projectId, {
        title,
        abstract,
        consent: { accepted: true, disclosureVersion: DISCLOSURE_VERSION },
      });
      setClassification(result);
    } catch (requestError) {
      const status = (requestError as { response?: { status?: number; data?: { error?: { code?: string } } } })?.response?.status;
      const code = (requestError as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code;
      setClassificationError(status === 504 || code === 'OPENALEX_TIMEOUT'
        ? 'OpenAlex classification timed out. You can retry or browse the taxonomy manually.'
        : status === 429 || code === 'OPENALEX_RATE_LIMITED'
          ? 'OpenAlex is rate limiting requests. You can retry shortly or browse manually.'
          : 'OpenAlex could not classify this text. You can retry or browse the taxonomy manually.');
    } finally {
      setIsClassifying(false);
    }
  };

  const selectSuggestion = (suggestion: NonNullable<OpenAlexClassification['primaryTopic']>) => {
    setSelectedPath((current) => ({ ...current, topic: { id: suggestion.id, label: suggestion.label, level: 'topic' } }));
  };

  return (
    <section aria-labelledby="picoc-field-confirmation-title" className="mt-8 rounded-xl border border-border bg-surface-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">PICOC Wizard · T-04</p>
          <h2 id="picoc-field-confirmation-title" className="mt-1 text-xl font-semibold text-text-primary">Research field confirmation</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">Review the primary topic suggestion or browse Domain → Field → Subfield → Topic. A manual selection remains unconfirmed until the OWNER confirms it.</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">Owner workspace</span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-text-primary">
          Project title <span aria-hidden="true" className="text-red-600">*</span>
          <input value={title} onChange={(event) => { setTitle(event.target.value); setInputsConfirmed(false); setConsentAccepted(false); setClassification(null); }} maxLength={4000} required className="mt-1 block w-full rounded-lg border border-border px-3 py-2.5 text-sm" />
        </label>
        <label className="text-sm font-medium text-text-primary md:col-span-2">
          Abstract <span aria-hidden="true" className="text-red-600">*</span>
          <textarea value={abstract} onChange={(event) => { setAbstract(event.target.value); setInputsConfirmed(false); setConsentAccepted(false); setClassification(null); }} maxLength={4000} required rows={4} className="mt-1 block w-full resize-y rounded-lg border border-border px-3 py-2.5 text-sm" />
        </label>
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm text-text-secondary">
        <input type="checkbox" checked={inputsConfirmed} onChange={(event) => { setInputsConfirmed(event.target.checked); setConsentAccepted(false); }} className="mt-1" />
        <span>I confirm that I entered or reviewed and confirmed both the title and abstract for this classification request.</span>
      </label>

      <label className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-slate-50 p-3 text-sm text-text-secondary">
        <input type="checkbox" checked={consentAccepted} onChange={(event) => setConsentAccepted(event.target.checked)} className="mt-1" />
        <span>This sends this exact title and abstract to OpenAlex for topic and keyword suggestions. The server stores only a hash-based consent record for 90 days; this increment does not save a title/abstract snapshot or confirmation history. OpenAlex suggestions are not confirmed automatically. I consent to this request; consent is required again for every classification.</span>
      </label>
      <p className="mt-2 text-xs text-text-secondary">Disclosure version: {DISCLOSURE_VERSION}. Editing either input clears consent and any prior suggestions.</p>

      <div className="mt-6 rounded-lg border border-dashed border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-text-primary">OpenAlex suggestions</h3>
            <p className="text-sm text-text-secondary">Classification returns suggestions only. No title/abstract snapshot or confirmation history is saved while the organization's retention policy is pending.</p>
          </div>
          <button type="button" onClick={() => void classify()} disabled={submitDisabled} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{isClassifying ? 'Classifying…' : 'Get suggestions'}</button>
        </div>
        {!inputsValid && <p className="mt-3 text-xs text-amber-800" role="status">Enter both title and abstract; their normalized combined length must be 20–2,000 characters.</p>}
        {classificationError && <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert"><FiAlertCircle className="mt-0.5 shrink-0" />{classificationError}</div>}
        {isClassifying && <p className="mt-3 text-sm text-text-secondary" role="status" aria-live="polite">Requesting OpenAlex suggestions…</p>}
        {classification && <div className="mt-4 space-y-4 rounded-lg bg-white p-4" aria-live="polite">
          {classification.primaryTopic ? <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Primary topic suggestion · unconfirmed</p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-text-primary">{classification.primaryTopic.label}</span>
              <button type="button" onClick={() => selectSuggestion(classification.primaryTopic!)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">Select suggestion</button>
            </div>
          </div> : <p className="text-sm text-text-secondary">No topic was returned. {classification.providerNote ?? 'Browse the taxonomy to select a topic manually.'}</p>}
          {classification.alternatives.length > 0 && <div>
            <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">Alternative suggestions · unconfirmed</p>
            <ul className="mt-2 space-y-2">{classification.alternatives.map((topic) => <li key={topic.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <span>{topic.label}</span><button type="button" onClick={() => selectSuggestion(topic)} className="rounded border border-border px-2 py-1 text-xs">Select</button>
            </li>)}</ul>
          </div>}
          {classification.providerNote && classification.primaryTopic && <p className="text-sm text-text-secondary">Provider note: {classification.providerNote}</p>}
          {classification.primaryTopic && <p className="text-xs text-text-secondary">The primary topic is not confirmed until a separate explicit OWNER confirmation step.</p>}
        </div>}
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-text-primary">OpenAlex keywords</h4>
          {!classification?.keywords.length && <p className="mt-1 text-xs text-text-secondary">No OpenAlex keywords are available before classification. Manually added keywords below are labeled as manual.</p>}
          <ul className="mt-2 flex flex-wrap gap-2" aria-label="OpenAlex keyword chips">{classification?.keywords.map((keyword) => <li key={keyword.id} className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-900">
            <input aria-label={`Edit OpenAlex keyword ${keyword.id}`} value={keyword.label} maxLength={100} onChange={(event) => setClassification((current) => current ? { ...current, keywords: current.keywords.map((item) => item.id === keyword.id ? { ...item, label: event.target.value } : item) } : current)} className="w-40 bg-transparent outline-none" />
            <span className="text-blue-700">({keyword.provenance})</span><button type="button" aria-label={`Remove OpenAlex keyword ${keyword.label}`} onClick={() => setClassification((current) => current ? { ...current, keywords: current.keywords.filter((item) => item.id !== keyword.id) } : current)}><FiX aria-hidden="true" /></button>
          </li>)}</ul>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap gap-2" aria-label="Taxonomy hierarchy">
          {hierarchy.map((level, index) => (
            <button key={level} type="button" onClick={() => openLevel(level)} disabled={index > 0 && !selectedPath[hierarchy[index - 1]]} className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${activeLevel === level ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'} disabled:cursor-not-allowed disabled:opacity-40`}>
              {selectedPath[level]?.label ?? labels[level]}{index < hierarchy.length - 1 && <FiChevronRight aria-hidden="true" />}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="taxonomy-search" className="sr-only">Search {labels[activeLevel].toLowerCase()} names</label>
          <input id="taxonomy-search" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={200} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void loadPage({ search, level: activeLevel, parentId }); } }} placeholder={`Search ${labels[activeLevel].toLowerCase()} names`} className="min-h-10 flex-1 rounded-lg border border-border px-3 text-sm" />
          <button type="button" onClick={() => void loadPage({ search, level: activeLevel, parentId })} disabled={isLoading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text-primary disabled:opacity-60">
            {isLoading ? <FiLoader className="animate-spin" aria-hidden="true" /> : <FiSearch aria-hidden="true" />} Search
          </button>
          {!items.length && !isLoading && <button type="button" onClick={() => void loadPage({ level: activeLevel, parentId })} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">Browse</button>}
        </div>

        {error && <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert"><FiAlertCircle className="mt-0.5 shrink-0" /> <span>{error} <button type="button" onClick={() => void loadPage({ level: activeLevel, parentId, search })} className="ml-1 underline">Retry</button></span></div>}
        {isLoading && <p className="mt-3 text-sm text-text-secondary" role="status" aria-live="polite">Loading OpenAlex taxonomy…</p>}
        {!isLoading && !error && items.length === 0 && <p className="mt-3 text-sm text-text-secondary">No taxonomy entries found for this query.</p>}
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
          {items.map((item) => (
            <li key={item.id}>
              <button type="button" onClick={() => selectItem(item)} className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                <span><span className="block text-sm font-medium text-text-primary">{item.label}</span>{item.description && <span className="mt-1 block text-xs text-text-secondary">{item.description}</span>}</span>
                <span className="text-xs text-primary">{item.level === 'topic' ? 'Select topic' : `Choose ${labels[hierarchy[hierarchy.indexOf(item.level) + 1]].toLowerCase()}`} <FiChevronRight className="inline" aria-hidden="true" /></span>
              </button>
            </li>
          ))}
        </ul>
        {nextCursor && <button type="button" onClick={() => void loadPage({ level: activeLevel, parentId, search, cursor: nextCursor })} disabled={isLoading} className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60">Load more</button>}
      </div>

      {selectedTopic && <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4" role="status" aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Manual selection · unconfirmed</p>
        <p className="mt-1 font-semibold text-blue-950">{selectedTopic.label}</p>
        <p className="mt-1 text-sm text-blue-800">This choice has not been saved or confirmed.</p>
        <button type="button" disabled title="Saving is paused until the organization's snapshot retention policy is approved" className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Confirm and save</button>
        <p className="mt-2 text-xs text-blue-800">Saving is paused until the organization approves the snapshot/history retention policy.</p>
      </div>}

      <div className="mt-5">
        <label htmlFor="manual-keyword" className="text-sm font-semibold text-text-primary">Manual keyword notes</label>
        <div className="mt-2 flex gap-2">
          <input id="manual-keyword" value={manualKeyword} onChange={(event) => setManualKeyword(event.target.value)} maxLength={100} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addManualKeyword(); } }} className="min-h-10 flex-1 rounded-lg border border-border px-3 text-sm" placeholder="Add a keyword" />
          <button type="button" onClick={addManualKeyword} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 text-sm font-semibold"><FiPlus aria-hidden="true" /> Add</button>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Keyword chips">
          {keywordChips.map((keyword) => <li key={keyword.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
            {keyword.label}<span className="text-slate-500">({keyword.provenance})</span><button type="button" aria-label={`Remove ${keyword.label}`} onClick={() => setKeywordChips((current) => current.filter((chip) => chip.id !== keyword.id))}><FiX aria-hidden="true" /></button>
          </li>)}
        </ul>
      </div>
    </section>
  );
}
