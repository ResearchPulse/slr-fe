import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FiInfo } from "react-icons/fi";
import { QUERY_KEYS } from "../../../../constants/queryKeys";
import { useProjectMember } from "../../../../hooks/useProjectMember";
import { useSearchSources } from "../../../../hooks/useSearchSources";
import prismaReportService from "../../../../services/prismaReportService";
import Button from "../../../../components/ui/Button";

interface PrismaSourceClassificationProps {
  projectId: string;
}

export default function PrismaSourceClassification({ projectId }: PrismaSourceClassificationProps) {
  const queryClient = useQueryClient();
  const { member } = useProjectMember(projectId);
  const {
    searchSources,
    isLoadingSources,
    searchSourcesError,
    refetchSearchSources,
  } = useSearchSources(projectId);
  const classify = useMutation({
    mutationFn: ({ sourceId, group }: { sourceId: string; group: "DATABASES_AND_REGISTERS" | "OTHER_METHODS" | null }) =>
      prismaReportService.classifySearchSource(projectId, sourceId, group),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.searchSources.byProject(projectId) }),
  });

  if (isLoadingSources) return null;
  if (searchSourcesError) {
    return (
      <section aria-labelledby="prisma-source-groups" className="rounded-xl border border-border bg-surface-white p-4 sm:p-5">
        <h2 id="prisma-source-groups" className="text-base font-semibold text-text-primary">PRISMA identification sources</h2>
        <p role="alert" className="mt-2 text-sm text-error">Could not load search sources. Try again.</p>
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={() => void refetchSearchSources()}
          className="mt-3"
        >
          Retry
        </Button>
      </section>
    );
  }
  if (searchSources.length === 0) return null;
  const canEdit = member?.isLeader ?? false;

  return (
    <section aria-labelledby="prisma-source-groups" className="rounded-xl border border-border bg-surface-white p-4 sm:p-5">
      <h2 id="prisma-source-groups" className="text-base font-semibold text-text-primary">PRISMA identification sources</h2>
      <p className="mt-1 flex items-start gap-2 text-xs leading-5 text-text-secondary">
        <FiInfo aria-hidden className="mt-0.5 shrink-0" /> Choose how each search source was found. The writing export keeps uncategorized sources visible instead of guessing.
      </p>
      <ul className="mt-3 divide-y divide-border">
        {searchSources.map((source) => (
          <li key={source.sourceId ?? source.name} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <span className="min-w-0 text-sm font-medium text-text-primary">{source.name}</span>
            {canEdit ? (
              <select
                aria-label={`PRISMA source group for ${source.name}`}
                value={source.prismaSourceGroup ?? ""}
                disabled={!source.sourceId || classify.isPending}
                onChange={(event) => {
                  const group = event.target.value as "DATABASES_AND_REGISTERS" | "OTHER_METHODS" | "";
                  if (source.sourceId) classify.mutate({ sourceId: source.sourceId, group: group || null });
                }}
                className="min-h-11 rounded-lg border border-border bg-surface-white px-3 text-xs text-text-primary transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 motion-reduce:transition-none disabled:opacity-60"
              >
                <option value="">Unclassified</option>
                <option value="DATABASES_AND_REGISTERS">Databases and registers</option>
                <option value="OTHER_METHODS">Other methods</option>
              </select>
            ) : (
              <span className="text-xs text-text-secondary">
                {source.prismaSourceGroup === "DATABASES_AND_REGISTERS" ? "Databases and registers" : source.prismaSourceGroup === "OTHER_METHODS" ? "Other methods" : "Unclassified"}
              </span>
            )}
          </li>
        ))}
      </ul>
      {classify.isError ? <p role="alert" className="mt-3 text-xs text-error">Could not update the PRISMA source group. Try again.</p> : null}
    </section>
  );
}
