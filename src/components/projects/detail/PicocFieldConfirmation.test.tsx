import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PicocFieldConfirmation from './PicocFieldConfirmation';
import { picocWizardService } from '../../../services/picocWizardService';

const mockProjectMember = vi.hoisted(() => vi.fn(() => ({ member: { isLeader: true, roleText: 'OWNER' } })));

vi.mock('../../../hooks/useProjectMember', () => ({
  useProjectMember: mockProjectMember,
}));

vi.mock('../../../services/picocWizardService', () => ({
  picocWizardService: { browseTaxonomy: vi.fn(), classify: vi.fn(), getConfirmation: vi.fn() },
}));

describe('PicocFieldConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProjectMember.mockReturnValue({ member: { isLeader: true, roleText: 'OWNER' } });
    vi.mocked(picocWizardService.getConfirmation).mockResolvedValue({ state: 'noCurrentConfirmedResult', confirmation: null });
  });

  it('browses hierarchy, keeps manual topic selection unconfirmed, and makes no persistence request', async () => {
    vi.mocked(picocWizardService.browseTaxonomy)
      .mockResolvedValueOnce({ items: [{ id: 'https://openalex.org/domains/1', label: 'Life Sciences', level: 'domain' }], nextCursor: null })
      .mockResolvedValueOnce({ items: [{ id: 'https://openalex.org/fields/11', label: 'Medicine', level: 'field', parent: { id: 'https://openalex.org/domains/1', label: 'Life Sciences', level: 'domain' } }], nextCursor: null })
      .mockResolvedValueOnce({ items: [{ id: 'https://openalex.org/subfields/1101', label: 'Clinical Medicine', level: 'subfield' }], nextCursor: null })
      .mockResolvedValueOnce({ items: [{ id: 'https://openalex.org/T123', label: 'Clinical research methods', level: 'topic' }], nextCursor: null });

    render(<PicocFieldConfirmation projectId="project-1" projectTitle="Explicit title" />);
    fireEvent.click(screen.getByRole('button', { name: 'Browse' }));
    fireEvent.click(await screen.findByRole('button', { name: /Life Sciences/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Medicine/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Clinical Medicine/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Clinical research methods/ }));

    expect(await screen.findByText('Manual selection · unconfirmed')).toBeTruthy();
    expect(screen.getByText('This choice has not been saved or confirmed.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Get suggestions' }) as HTMLButtonElement).disabled).toBe(true);
    expect(picocWizardService.browseTaxonomy).toHaveBeenCalledTimes(4);
    expect(picocWizardService.classify).not.toHaveBeenCalled();
  });

  it('requires fresh consent to classify and renders editable OpenAlex keyword chips as suggestions', async () => {
    vi.mocked(picocWizardService.classify).mockResolvedValue({
      classifierVersion: '2',
      primaryTopic: { id: 'https://openalex.org/T123', label: 'Clinical research methods' },
      alternatives: [{ id: 'https://openalex.org/T124', label: 'Evidence synthesis' }],
      keywords: [{ id: 'edge-computing', label: 'Edge computing', provenance: 'openalex' }],
      providerNote: null,
      consentId: 'consent-1',
    });
    render(<PicocFieldConfirmation projectId="project-1" />);
    fireEvent.change(screen.getByLabelText(/Project title/), { target: { value: 'Clinical evidence synthesis' } });
    fireEvent.change(screen.getByLabelText(/Abstract/), { target: { value: 'A sufficiently long abstract for topic classification.' } });

    const submit = screen.getByRole('button', { name: 'Get suggestions' }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/confirm that I entered or reviewed and confirmed both/i));
    expect(submit.disabled).toBe(true);
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);

    await screen.findByText('Primary topic suggestion · unconfirmed');
    expect(picocWizardService.classify).toHaveBeenCalledWith('project-1', {
      title: 'Clinical evidence synthesis',
      abstract: 'A sufficiently long abstract for topic classification.',
      consent: { accepted: true, disclosureVersion: 'openalex-2026-10' },
    });
    expect(screen.getByText('Alternative suggestions · unconfirmed')).toBeTruthy();
    expect(screen.getByLabelText('Edit OpenAlex keyword edge-computing')).toBeTruthy();
    expect((screen.getAllByRole('checkbox')[1] as HTMLInputElement).checked).toBe(false);
  });

  it('shows an explicit empty taxonomy result and a retryable error', async () => {
    vi.mocked(picocWizardService.browseTaxonomy)
      .mockResolvedValueOnce({ items: [], nextCursor: null })
      .mockRejectedValueOnce({ response: { status: 504 } })
      .mockResolvedValueOnce({ items: [], nextCursor: null });

    render(<PicocFieldConfirmation projectId="project-1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Browse' }));
    expect(await screen.findByText('No taxonomy entries found for this query.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect((await screen.findByRole('alert')).textContent).toContain('timed out');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    await waitFor(() => expect(picocWizardService.browseTaxonomy).toHaveBeenCalledTimes(3));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows members only the explicit empty confirmed-result state', async () => {
    mockProjectMember.mockReturnValue({ member: { isLeader: false, roleText: 'REVIEWER' } });
    render(<PicocFieldConfirmation projectId="project-1" projectTitle="Must not be exposed" />);
    expect(await screen.findByText('There is no current confirmed research field.')).toBeTruthy();
    expect(screen.queryByText('Must not be exposed')).toBeNull();
    expect(screen.queryByLabelText(/Project title/)).toBeNull();
    expect(picocWizardService.getConfirmation).toHaveBeenCalledWith('project-1');
    expect(picocWizardService.browseTaxonomy).not.toHaveBeenCalled();
    expect(picocWizardService.classify).not.toHaveBeenCalled();
  });
});
