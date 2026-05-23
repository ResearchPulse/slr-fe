import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

interface AssignmentHeaderProps {
  currentPhaseText?: string;
}

const AssignmentHeader: React.FC<AssignmentHeaderProps> = ({
  currentPhaseText,
}) => {
  const navigate = useNavigate();
  const { projectId, processId } = useParams();

  const handleBack = () => {
    navigate(`/projects/${projectId}/processes/${processId}`);
  };

  return (
    <header className="bg-surface-white border-b border-border px-6 py-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-bg-secondary rounded-full text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                Assign Papers to Reviewers
              </h1>
              {currentPhaseText && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                  {currentPhaseText}
                </span>
              )}
            </div>
            <p className="text-text-secondary mt-1">
              Bulk assign screening papers to project reviewers
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AssignmentHeader;
