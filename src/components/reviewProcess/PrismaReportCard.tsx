import { useNavigate } from "react-router";
import { FiBarChart2, FiArrowRight } from "react-icons/fi";
import Button from "../ui/Button";

interface PrismaReportCardProps {
  projectId: string;
  processId: string;
}

export default function PrismaReportCard({
  projectId,
  processId,
}: PrismaReportCardProps) {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(`/projects/${projectId}/processes/${processId}/prisma-report`);
  };

  return (
    <section className="mb-6 flex flex-col gap-4 rounded-xl border border-border bg-surface-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          <FiBarChart2 className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary sm:text-lg">
              PRISMA 2020 flow report
            </h2>
            <span className="rounded-full bg-bg-secondary px-2.5 py-1 text-[10px] font-medium text-text-secondary">
              Report
            </span>
          </div>
          <p className="mt-1 text-sm leading-5 text-text-secondary">
            View your review pipeline as a PRISMA flow diagram.
          </p>
        </div>
      </div>

      <Button
        onClick={handleNavigate}
        variant="secondary"
        className="w-full shrink-0 normal-case tracking-normal sm:w-auto"
      >
        View full report
        <FiArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
      </Button>
    </section>
  );
}