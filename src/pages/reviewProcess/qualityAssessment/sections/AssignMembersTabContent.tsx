import type { WorkspaceQAPaper } from "../QualityAssessmentWorkspace";
import {
  Search,
  Filter,
  MoreHorizontal,
  User,
  FileText,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Card from "../../../../components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/Table";
import Button from "../../../../components/ui/Button";
import Pagination from "../../../../components/ui/Pagination";

interface AssignMembersTabContentProps {
  papers: WorkspaceQAPaper[];
  isLeader?: boolean;
  onPaperClick: (paperId: string) => void;
  onAssignClick: (e: React.MouseEvent, paperId: string) => void;
  onSearchChange?: (query: string) => void;
  searchQuery?: string;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

function getPaperStatus(paper: WorkspaceQAPaper, isLeader: boolean = false) {
  if (paper.resolution && typeof paper.resolution.finalDecision === "number") {
    return paper.resolution.finalDecision === 1
      ? "high-quality"
      : "low-quality";
  }
  if (paper.completionPercentage === 100 && !isLeader) return "completed";
  if (paper.completionPercentage > 0) return "in-progress";
  return "pending";
}

function getPaperReviewers(paper: WorkspaceQAPaper) {
  if ("reviewers" in paper && Array.isArray(paper.reviewers)) {
    return paper.reviewers;
  }
  return [];
}

export function AssignMembersTabContent({
  papers,
  isLeader,
  onPaperClick,
  onAssignClick,
  onSearchChange,
  searchQuery = "",
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: AssignMembersTabContentProps) {
  const pageSize = 10;

  return (
    <Card className="overflow-hidden rounded-xl border border-border bg-surface-white shadow-sm">
      <div className="flex flex-col justify-between gap-4 border-b border-border bg-surface-white p-4 sm:flex-row sm:items-center sm:p-5">
        <div>
          <h2 className="text-base font-semibold text-text-primary sm:text-lg">
            {isLeader
              ? "Assign Papers to Team Members"
              : "My Assessment Papers"}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {isLeader
              ? "Distribute quality assessment tasks among the review team."
              : "Review and evaluate your assigned papers."}
          </p>
        </div>

        <div className="flex w-full gap-2 sm:w-auto sm:gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary group-focus-within:text-accent transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                if (onSearchChange) onSearchChange(e.target.value);
              }}
              placeholder="Search papers by title..."
              className="w-full rounded-xl border border-border bg-bg-primary py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-text-secondary/80 focus:border-accent focus:bg-surface-white focus:outline-none focus:ring-2 focus:ring-accent/15 sm:w-72"
            />
          </div>
          <Button variant="outline" className="flex shrink-0 gap-2 rounded-xl border-border">
            <Filter size={16} />
            Filter
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-bg-primary">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center">
                <input
                  type="checkbox"
                  className="rounded-md border-slate-300 text-accent focus:ring-accent transition-colors"
                />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Paper Details
              </TableHead>
              {isLeader && (
                <TableHead className="w-48 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  Assigned Reviewers
                </TableHead>
              )}
              <TableHead className="w-40 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Status
              </TableHead>
              <TableHead className="w-16">
                <span></span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {papers.map((paper) => (
              <TableRow
                key={paper.paperId}
                className="group cursor-pointer transition-colors hover:bg-primary-light/40"
                onClick={() => onPaperClick(paper.paperId)}
              >
                <TableCell
                  className="text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    className="rounded-md border-slate-300 text-accent focus:ring-accent transition-colors"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-primary-light text-accent">
                      <FileText size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors line-clamp-2">
                        {paper.title}
                      </span>
                      <span className="text-xs text-text-secondary mt-1 line-clamp-1">
                        {paper.authors || "Unknown authors"}
                      </span>
                    </div>
                  </div>
                </TableCell>
                {isLeader && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 overflow-hidden">
                        {getPaperReviewers(paper).length === 0 ? (
                          <span
                            onClick={(e) => onAssignClick(e, paper.paperId)}
                            className="text-xs text-text-secondary italic cursor-pointer hover:text-accent transition-colors"
                          >
                            Unassigned
                          </span>
                        ) : (
                          getPaperReviewers(paper).map((member, idx) => (
                            <div
                              key={idx}
                              className="relative group/member shrink-0 cursor-pointer"
                              onClick={(e) => onAssignClick(e, paper.paperId)}
                            >
                              <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-light ring-2 ring-white hover:bg-accent/30 transition-colors">
                                <span className="text-xs font-bold text-accent">
                                  {(member.fullname || member.username)
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </span>
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/member:block z-10 w-max bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-none">
                                {member.fullname || member.username}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      {getPaperReviewers(paper).length < 2 && (
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-slate-300 bg-surface-white text-text-secondary hover:text-accent hover:border-accent hover:bg-primary-light ring-2 ring-white shrink-0 transition-all relative group/btn"
                          onClick={(e) => onAssignClick(e, paper.paperId)}
                        >
                          <User size={14} />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/btn:block z-10 w-max bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-none">
                            Assign Reviewer
                          </div>
                        </button>
                      )}
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  {(() => {
                    const status = getPaperStatus(paper, isLeader);

                    const statusStyles: Record<
                      string,
                      {
                        bg: string;
                        text: string;
                        icon: React.ReactNode;
                        label: string;
                      }
                    > = {
                      "high-quality": {
                        bg: "bg-emerald-50 border-emerald-200",
                        text: "text-emerald-700",
                        icon: (
                          <CheckCircle2
                            size={12}
                            className="text-emerald-500"
                          />
                        ),
                        label: "High Quality",
                      },
                      "low-quality": {
                        bg: "bg-rose-50 border-rose-200",
                        text: "text-rose-700",
                        icon: (
                          <CheckCircle2 size={12} className="text-rose-500" />
                        ),
                        label: "Low Quality",
                      },
                      completed: {
                        bg: "bg-emerald-50 border-emerald-200",
                        text: "text-emerald-700",
                        icon: (
                          <CheckCircle2
                            size={12}
                            className="text-emerald-500"
                          />
                        ),
                        label: "Completed",
                      },
                      "in-progress": {
                        bg: "bg-primary-light border-accent/30",
                        text: "text-accent",
                        icon: <Clock size={12} className="text-accent" />,
                        label: "In Progress",
                      },
                      pending: {
                        bg: "bg-bg-secondary border-border",
                        text: "text-text-primary",
                        icon: (
                          <Clock size={12} className="text-text-secondary" />
                        ),
                        label: "Pending",
                      },
                    };

                    const style =
                      statusStyles[status] || statusStyles["pending"];

                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text}`}
                      >
                        {style.icon}
                        {style.label}
                      </span>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  <button className="text-text-secondary hover:text-text-primary p-2 rounded-xl hover:bg-bg-secondary transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {papers.length === 0 && (
          <div className="flex flex-col items-center px-4 py-9 text-center text-text-secondary sm:py-10">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-bg-primary text-slate-400">
              <FileText size={22} />
            </div>
            <p className="text-sm font-semibold text-text-primary">
              No papers found
            </p>
            <p className="mt-1 text-sm">Try adjusting your search filters</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-start justify-between gap-3 border-t border-border bg-surface-white px-4 py-3 sm:flex-row sm:items-center sm:px-5">
        <div className="text-sm text-text-secondary">
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, totalItems)} of {totalItems} results
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </Card>
  );
}
