import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DataItemDefinitionExtended } from "../../../../../../types/dataExtraction";
import { SectionTypeEnum } from "../../../../../../types/dataExtraction";
import type { WizardSection } from "../../../../../../types/templateWizard";
import { toastWarning } from "../../../../../../utils/toast";
import Step2_FlatSetup from "../Step2_FlatSetup";

vi.mock("../../../../../../utils/toast", () => ({
  toastWarning: vi.fn(),
}));

const sections: WizardSection[] = [
  {
    id: "section-context",
    name: "PICOC & Study Metadata",
    orderIndex: 1,
    sectionType: SectionTypeEnum.FlatForm,
    isPicoc: true,
  },
  {
    id: "section-rq1",
    name: "RQ1: RQ1: Staleness and availability",
    orderIndex: 2,
    sectionType: SectionTypeEnum.FlatForm,
    linkedResearchQuestionId: "rq-1",
    isLockedName: true,
  },
  {
    id: "section-rq2",
    name: "RQ2: Malicious clients",
    orderIndex: 3,
    sectionType: SectionTypeEnum.FlatForm,
    linkedResearchQuestionId: "rq-2",
    isLockedName: true,
  },
];

const existingItems: DataItemDefinitionExtended[] = [
  {
    data_item_id: "field-1",
    form_id: "section-rq1",
    name: "Primary outcome",
    data_type: "SingleSelect",
    description: "Outcome recorded by reviewers",
    is_required: true,
    display_order: 1,
    options: [
      { option_id: "option-1", field_id: "field-1", option_value: "Improved", display_order: 1 },
      { option_id: "option-2", field_id: "field-1", option_value: "Unchanged", display_order: 2 },
    ],
    subItems: [
      {
        data_item_id: "nested-1",
        form_id: "section-rq1",
        parent_field_id: "field-1",
        name: "Evidence source",
        data_type: "Text",
        description: "",
        is_required: false,
        display_order: 1,
        options: [],
        subItems: [],
      },
    ],
  },
];

function renderEditor(onComplete = vi.fn()) {
  render(
    <Step2_FlatSetup
      section={sections[1]}
      sections={sections}
      sectionFieldCounts={{ "section-context": 5, "section-rq1": 1, "section-rq2": 0 }}
      initialItems={existingItems}
      onComplete={onComplete}
    />,
  );
  return onComplete;
}

describe("Step2_FlatSetup", () => {
  it("keeps existing options and nested fields when a field is edited and saved", () => {
    const onComplete = renderEditor();

    fireEvent.click(screen.getByRole("button", { name: "Edit Primary outcome" }));
    fireEvent.change(screen.getByLabelText(/Field Name/), {
      target: { value: "Primary finding" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    fireEvent.click(screen.getByRole("button", { name: "Save section" }));

    const [savedItems] = vi.mocked(onComplete).mock.calls[0];
    expect(savedItems[0]).toMatchObject({
      data_item_id: "field-1",
      name: "Primary finding",
      options: [
        { option_id: "option-1", option_value: "Improved" },
        { option_id: "option-2", option_value: "Unchanged" },
      ],
      subItems: [{ data_item_id: "nested-1", name: "Evidence source" }],
    });
  });

  it("saves the current section before navigating to another section", () => {
    const onComplete = renderEditor();

    fireEvent.click(screen.getByRole("button", { name: /Malicious clients/ }));

    expect(onComplete).toHaveBeenCalledWith(existingItems, "section-rq2");
  });

  it("keeps the user in the current section while the field form is unfinished", () => {
    const onComplete = renderEditor();

    fireEvent.click(screen.getByRole("button", { name: /Add field/i }));
    fireEvent.click(screen.getByRole("button", { name: /Malicious clients/ }));

    expect(onComplete).not.toHaveBeenCalled();
    expect(toastWarning).toHaveBeenCalledWith(
      "Finish field editing",
      "Save or cancel the field form before switching sections.",
    );
  });

  it("provides a horizontally scrollable section navigator at compact widths", () => {
    renderEditor();

    expect(screen.getByRole("navigation", { name: "Template sections" })).toBeTruthy();
    expect(screen.getByRole("navigation", { name: "Template sections" }).lastElementChild?.className).toContain("overflow-x-auto");
  });
});
