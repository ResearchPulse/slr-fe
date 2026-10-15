import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PaperViewerModal from "../PaperViewerModal";
import type { PaperResponse } from "../../../../types/paper";

const { capturePaperViewerProps } = vi.hoisted(() => ({
  capturePaperViewerProps: vi.fn(),
}));

vi.mock("../../../shared/paper/PaperViewer", () => ({
  default: (props: Record<string, unknown>) => {
    capturePaperViewerProps(props);
    return <div data-testid="paper-viewer" />;
  },
}));

vi.mock("../../../../hooks/useStudySelection", () => ({
  usePaperDetails: () => ({ paper: null, isLoading: false }),
}));

describe("leader PaperViewerModal", () => {
  it("forwards hideActions to the shared viewer for read-only details", () => {
    render(
      <PaperViewerModal
        paper={{ id: "paper-1", title: "Paper 1" } as PaperResponse}
        isOpen
        onClose={vi.fn()}
        hideActions
      />,
    );

    expect(capturePaperViewerProps).toHaveBeenCalledWith(
      expect.objectContaining({ hideActions: true }),
    );
  });
});
