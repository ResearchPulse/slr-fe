import React from "react";
import Button from "../ui/Button";
import FormTextarea from "../ui/FormTextarea";

interface ObjectiveFormProps {
  onSubmit: (data: { objective_statement: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ObjectiveForm: React.FC<ObjectiveFormProps> = ({
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      objective_statement: formData.get("objective_statement") as string,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        {/* Objective Statement Field */}
        <div className="space-y-2">
          <FormTextarea
            id="objective_statement"
            name="objective_statement"
            label="Objective Statement"
            helperText="Define a clear, concise, and measurable objective for this systematic review. Use the SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound)."
            placeholder="e.g., To evaluate the comparative effectiveness of metformin versus lifestyle interventions in reducing HbA1c levels in adults with pre-diabetes over a 12-month period..."
            rows={5}
            required
            className="bg-bg-primary/50 border-border focus:bg-surface-white transition-all rounded-xl"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-6 border-t border-border">
        <Button
          type="submit"
          isLoading={isLoading}
          className="flex-1 h-12"
        >
          Add Objective
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

export default ObjectiveForm;
