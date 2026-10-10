import { FiCheck, FiLock, FiExternalLink } from "react-icons/fi";
import type { PhaseStats } from "../../types/reviewProcessWorkspace";

interface PhaseProgressStepperProps {
  currentPhase: number;
  completedPhases: number[];
  phaseStats?: PhaseStats;
  onPhaseClick?: (phaseIndex: number) => void;
  /** Navigate into the phase workspace (like "View Identification" on summary cards) */
  onPhaseOpen?: (phaseName: string) => void;
  /** Whether to show the "Open" action button on each step (default: false) */
  showOpenAction?: boolean;
}

const PHASES = [
  {
    id: 0,
    name: "Identification",
    shortName: "Identify",
    key: "identification",
  },
  { id: 1, name: "Study Selection", shortName: "Selection", key: "screening" },
  { id: 2, name: "Quality Assessment", shortName: "Quality", key: "quality" },
  { id: 3, name: "Data Extraction", shortName: "Extract", key: "extraction" },
  { id: 4, name: "Synthesis", shortName: "Synthesis", key: "synthesis" },
  { id: 5, name: "PRISMA Report", shortName: "PRISMA", key: "prisma" },
];

export default function PhaseProgressStepper({
  currentPhase,
  completedPhases,
  phaseStats,
  onPhaseClick,
  onPhaseOpen,
  showOpenAction = false,
}: PhaseProgressStepperProps) {
  const isPhaseCompleted = (phaseId: number) =>
    completedPhases.includes(phaseId);
  const isCurrentPhase = (phaseId: number) => phaseId === currentPhase;
  // PRISMA Report (phase 5) and Study Selection (phase 1) are always unlocked
  const isPhaseLocked = (phaseId: number) =>
    phaseId !== 5 &&
    phaseId !== 1 &&
    phaseId > currentPhase &&
    !isPhaseCompleted(phaseId);

  const getPhaseStatus = (phaseId: number) => {
    if (isPhaseCompleted(phaseId)) return "completed";
    if (isCurrentPhase(phaseId)) return "current";
    if (isPhaseLocked(phaseId)) return "locked";
    return "available";
  };

  const getPhaseStats = (phaseId: number): string | null => {
    if (!phaseStats) return null;

    switch (phaseId) {
      case 0: // Identification
        return `${phaseStats.identification.uniqueRecords} unique records`;
      case 1: // Study Selection
        return `${phaseStats.screening.pendingCount} pending`;
      case 2: // Quality Assessment
        return `${phaseStats.quality.highQualityPapers} high quality`;
      case 3: // Data Extraction
        return `${phaseStats.extraction.completed} completed`;
      case 4: // Synthesis
        return `${phaseStats.synthesis.themes} themes`;
      case 5: // PRISMA
        return phaseStats.prisma.completeness;
      default:
        return null;
    }
  };

  const getPhaseClasses = (phaseId: number) => {
    const status = getPhaseStatus(phaseId);
    const baseClasses = "relative flex items-center justify-center";

    switch (status) {
      case "completed":
        return `${baseClasses} text-green-700`;
      case "current":
        return `${baseClasses} text-accent`;
      case "locked":
        return `${baseClasses} text-text-secondary`;
      default:
        return `${baseClasses} text-text-secondary`;
    }
  };

  const getStepCircleClasses = (phaseId: number) => {
    const status = getPhaseStatus(phaseId);
    const baseClasses =
      "w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold text-sm transition-all duration-200";
    const clickable = !isPhaseLocked(phaseId) && (onPhaseClick || onPhaseOpen);

    switch (status) {
      case "completed":
        return `${baseClasses} bg-green-100 border-green-600 text-green-700${clickable ? " hover:shadow-none cursor-pointer" : ""}`;
      case "current":
        return `${baseClasses} bg-primary border-accent text-white shadow-none scale-110${clickable ? " cursor-pointer" : ""}`;
      case "locked":
        return `${baseClasses} bg-bg-secondary border-border text-text-secondary cursor-not-allowed`;
      default:
        return `${baseClasses} bg-surface-white border-gray-400 text-text-secondary hover:border-accent hover:shadow-none cursor-pointer`;
    }
  };

  const getConnectorClasses = (phaseId: number) => {
    const isCompleted = isPhaseCompleted(phaseId);
    const nextIsCompleted = isPhaseCompleted(phaseId + 1);
    const isCurrent = isCurrentPhase(phaseId) || isCurrentPhase(phaseId + 1);

    if (isCompleted && nextIsCompleted) {
      return "bg-green-600";
    }
    if (isCurrent) {
      return "bg-primary";
    }
    return "bg-gray-300";
  };

  const handlePhaseClick = (phaseId: number) => {
    if (isPhaseLocked(phaseId)) return;

    // If onPhaseOpen is provided, navigate into the phase workspace
    if (onPhaseOpen) {
      const phase = PHASES.find((p) => p.id === phaseId);
      if (phase) {
        onPhaseOpen(phase.key);
        return;
      }
    }

    // Fallback to simple phase click
    if (onPhaseClick) {
      onPhaseClick(phaseId);
    }
  };

  return (
    <div className="bg-surface-white border border-border rounded-xl p-8 mb-6 shadow-none">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {PHASES.map((phase, index) => (
          <div key={phase.id} className="flex items-center flex-1">
            {/* Phase Step */}
            <div
              className="flex flex-col items-center shrink-0 group"
              onClick={() => handlePhaseClick(phase.id)}
            >
              {/* Circle */}
              <div className={getStepCircleClasses(phase.id)}>
                {isPhaseCompleted(phase.id) ? (
                  <FiCheck className="w-6 h-6" />
                ) : isPhaseLocked(phase.id) ? (
                  <FiLock className="w-5 h-5" />
                ) : (
                  <span>{phase.id + 1}</span>
                )}
              </div>

              {/* Label */}
              <div className="mt-3 text-center min-w-20">
                <p
                  className={`text-xs font-semibold ${getPhaseClasses(phase.id)}`}
                >
                  {phase.shortName}
                </p>
                {getPhaseStats(phase.id) && (
                  <p className="text-[10px] text-text-secondary mt-1">
                    {getPhaseStats(phase.id)}
                  </p>
                )}
                {isCurrentPhase(phase.id) && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-primary-light text-accent text-xs rounded-full font-medium">
                    Active
                  </span>
                )}
                {showOpenAction && !isPhaseLocked(phase.id) && (
                  <span className="inline-flex items-center gap-0.5 mt-1.5 text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiExternalLink className="w-2.5 h-2.5" />
                    Open
                  </span>
                )}
              </div>
            </div>

            {/* Connector Line */}
            {index < PHASES.length - 1 && (
              <div className="flex-1 h-0.5 mx-4 relative -top-6">
                <div
                  className={`h-full transition-all duration-300 ${getConnectorClasses(phase.id)}`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Current Phase Description */}
      <div className="mt-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-light border border-primary/20 rounded-xl">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <p className="text-sm text-accent">
            <span className="font-semibold">Current Phase:</span>{" "}
            {PHASES.find((p) => p.id === currentPhase)?.name || "Not started"}
          </p>
        </div>
      </div>
    </div>
  );
}
