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
    <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-[4px] p-6 mb-8 text-white shadow-none overflow-hidden relative">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-surface-white/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-indigo-400/20 rounded-full blur-3xl" />

      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-[4px] bg-surface-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
            <FiBarChart2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">PRISMA 2020 Flow Report</h2>
            <p className="text-indigo-100 text-sm max-w-md">
              Visualise your systematic review pipeline with a flow diagram.
            </p>
          </div>
        </div>

        <Button
          onClick={handleNavigate}
          className="bg-surface-white text-accent hover:bg-bg-secondary border-none px-6 py-2.5 font-bold shadow-none hover:shadow-none transition-all flex items-center gap-2 group shrink-0"
        >
          View Full Report
          <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
