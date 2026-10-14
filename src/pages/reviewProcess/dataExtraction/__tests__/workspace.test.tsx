import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FieldTypeEnum, SectionTypeEnum } from "../../../../types/dataExtraction";
import { CustomToast } from "../../../../components/ui/toast/CustomToast";
import type { Toast } from "react-hot-toast";
import ReviewerFormPane from "../components/reviewerWorkspace/ReviewerFormPane";
import type { ExtractionFieldDto, ExtractionSectionDto } from "../../../../types/dataExtraction";
import {
  applyAiProposalToDraft,
  canFinalizeConsensus,
  findMissingRequiredFields,
  getReviewerWorkspaceState,
  hasTwoIndependentSubmissions,
} from "../workflowRules";

describe("canonical extraction workflow rules", () => {
  it("exposes validation toast feedback to users and assistive technology", () => {
    render(
      <CustomToast
        t={
          {
            id: "validation-toast",
            type: "custom",
            visible: true,
            createdAt: Date.now(),
            message: "",
            pauseDuration: 0,
            duration: 8000,
          } as Toast
        }
        type="error"
        title="Validation Failed"
        message={"Please fill in all required fields:\nIdentification - Study Title"}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Validation Failed");
    expect(alert.textContent).toContain("Identification - Study Title");
    expect(alert.getAttribute("aria-live")).toBe("assertive");
  });

  it("keeps reviewer records private to their owner", () => {
    const state = getReviewerWorkspaceState(
      { reviewerId: "reviewer-a", values: { title: "A" }, version: 2 },
      { reviewerId: "reviewer-b", values: { title: "B" }, version: 4 },
      "reviewer-a",
    );

    expect(state.ownDraft?.values).toEqual({ title: "A" });
    expect(state.ownSubmission).toBeNull();
    expect(state.otherReviewerRecord).toBeNull();
  });

  it("blocks blank required fields but accepts explicit Not reported", () => {
    const fields = [
      { fieldId: "title", name: "Title", isRequired: true },
      { fieldId: "year", name: "Year", isRequired: true },
    ];

    expect(findMissingRequiredFields(fields, { title: "", year: 0 }, {})).toEqual([
      "Title",
    ]);
    expect(
      findMissingRequiredFields(
        fields,
        {
          title: { stringValue: "Study title", numericValue: null },
          year: { stringValue: null, numericValue: 2026 },
        },
        {},
      ),
    ).toEqual([]);
    expect(
      findMissingRequiredFields(
        fields,
        { title: "", year: 2020 },
        { title: true },
      ),
    ).toEqual([]);
    expect(
      findMissingRequiredFields(
        fields,
        { title: { isNotReported: true }, year: 2020 },
        {},
      ),
    ).toEqual([]);
    expect(
      findMissingRequiredFields(
        fields,
        { title: { stringValue: "" }, year: 2020 },
        {},
      ),
    ).toEqual(["Title"]);
  });

  it("keeps an AI proposal editable in draft without creating a submission", () => {
    const draft = applyAiProposalToDraft(
      { title: "AI suggestion" },
      { title: "Human correction" },
    );

    expect(draft).toEqual({ title: "Human correction" });
    expect(
      hasTwoIndependentSubmissions([
        { reviewerId: "reviewer-a", values: draft, version: 1 },
      ]),
    ).toBe(false);
  });

  it("gates consensus/finalization until two distinct reviewers submit", () => {
    expect(
      hasTwoIndependentSubmissions([
        { reviewerId: "reviewer-a", values: {}, version: 1 },
        { reviewerId: "reviewer-a", values: {}, version: 2 },
      ]),
    ).toBe(false);
    expect(
      hasTwoIndependentSubmissions([
        { reviewerId: "reviewer-a", values: {}, version: 1 },
        { reviewerId: "reviewer-b", values: {}, version: 1 },
      ]),
    ).toBe(true);
    expect(canFinalizeConsensus(["reviewer-a", "reviewer-b"])).toBe(true);
  });
  it("renders an explicit Not reported control for a required reviewer field", () => {
    const field: ExtractionFieldDto = {
      fieldId: "title",
      name: "Title",
      fieldType: FieldTypeEnum.Text,
      isRequired: true,
      orderIndex: 0,
      options: [],
      subFields: [],
    };
    const section: ExtractionSectionDto = {
      sectionId: "identity",
      name: "Identity",
      orderIndex: 0,
      sectionType: SectionTypeEnum.FlatForm,
      fields: [field],
    };
    const onToggleFieldNotReported = vi.fn();

    render(
      <ReviewerFormPane
        activeSection={section}
        activeSectionId="identity"
        activeSectionDescription=""
        activeEvidenceTargetLabel={null}
        matrixFields={[]}
        fieldStates={{}}
        currentRows={[]}
        flattenedFields={[{ field, fieldKey: "title", depth: 0 }]}
        renderFieldControl={() => <input aria-label="Title value" />}
        isFieldNotReported={() => false}
        isMatrixFieldNotReported={() => false}
        isEvidenceTargetActive={() => false}
        onSelectEvidenceTarget={vi.fn()}
        onSetMatrixFieldValue={vi.fn()}
        onToggleFieldNotReported={onToggleFieldNotReported}
        onToggleMatrixFieldNotReported={vi.fn()}
        onRemoveMatrixRow={vi.fn()}
        onAddMatrixRow={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Not Reported"));
    expect(onToggleFieldNotReported).toHaveBeenCalledWith("title", true);
  });
});
