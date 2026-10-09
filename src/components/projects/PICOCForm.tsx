import React from "react";
import Button from "../ui/Button";
import FormTextarea from "../ui/FormTextarea";
import FormSelect from "../ui/FormSelect";

export type PICOCElementType =
  | "population"
  | "intervention"
  | "comparison"
  | "outcome"
  | "context";

interface PICOCFormProps {
  onSubmit: (data: {
    element_type: PICOCElementType;
    description: string;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const PICOCForm: React.FC<PICOCFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      element_type: formData.get("element_type") as PICOCElementType,
      description: formData.get("description") as string,
    });
  };

  const elementTypeOptions = [
    { value: "Population", label: "Population" },
    { value: "Intervention", label: "Intervention" },
    { value: "Comparison", label: "Comparison" },
    { value: "Outcome", label: "Outcome" },
    { value: "Context", label: "Context" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <FormSelect
            id="element_type"
            name="element_type"
            label="Element Type"
            helperText="Select which component of the PICOC framework you are defining."
            options={elementTypeOptions}
            required
            className="bg-bg-primary/50 border-border focus:bg-surface-white transition-all rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <FormTextarea
            id="description"
            name="description"
            label="Description"
            helperText="Provide a detailed description for this element. Be as specific as possible to guide the search strategy."
            placeholder="e.g., Adults aged 18-65 with a clinical diagnosis of Type 2 Diabetes..."
            rows={5}
            required
            className="bg-bg-primary/50 border-border focus:bg-surface-white transition-all rounded-xl"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-6 border-t border-border">
        <Button
          type="submit"
          isLoading={isLoading}
          className="flex-1 h-12"
        >
          Add Element
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="px-6 h-12"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default PICOCForm;
