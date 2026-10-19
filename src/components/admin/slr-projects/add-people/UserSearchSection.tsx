import { FiSearch, FiCheck, FiChevronRight, FiPlus } from "react-icons/fi";
import { cn } from "../../../../utils/cn";
import LoadingSpinner from "../../../ui/LoadingSpinner";

interface User {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  status: "available" | "added" | "invited";
}

interface UserSearchSectionProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  isSearching: boolean;
  displayUsers: User[];
  selectedUserId: string | null;
  onSelectUser: (user: User) => void;
  assignedRoles: Record<string, "Reviewer">;
  getInitials: (name: string) => string;
  showSuggestions?: boolean;
  // Pagination for admin list
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function UserSearchSection({
  searchTerm,
  onSearchChange,
  isSearching,
  displayUsers,
  selectedUserId,
  onSelectUser,
  assignedRoles,
  getInitials,
  showSuggestions = false,
  currentPage,
  totalPages,
  onPageChange,
}: UserSearchSectionProps) {
  return (
    <div className="space-y-4">
      <div className="relative group">
        <FiSearch
          className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent transition-colors"
          size={16}
        />
        <input
          type="text"
          aria-label="Search users by username or email"
          placeholder="Search username or email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="min-h-11 w-full rounded-xl border border-border bg-surface-white py-3.5 pl-11 pr-4 text-sm font-bold text-text-primary outline-none transition-[border-color,box-shadow] placeholder:font-medium placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/15 motion-reduce:transition-none"
        />
      </div>

      {showSuggestions && displayUsers.length > 0 && (
        <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
          Gợi ý người có thể mời
        </p>
      )}

      <div className="max-h-[280px] overflow-y-auto pr-2 -mr-2 space-y-2 custom-scrollbar relative">
        {isSearching && (
          <div className="absolute inset-0 bg-surface-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
            <LoadingSpinner size="sm" />
          </div>
        )}

        {displayUsers.length > 0 ? (
          displayUsers.map((user: User) => {
            const isSelected = selectedUserId === user.id;
            const isAlreadyChosen = assignedRoles[user.id];
            const isAdded = user.status === "added";
            const isInvited = user.status === "invited";
            const isSelectable = user.status === "available";

            return (
              <button
                type="button"
                key={user.id}
                onClick={() => onSelectUser(user)}
                aria-pressed={isSelected}
                disabled={!isSelectable}
                className={cn(
                  "group flex w-full cursor-pointer select-none items-center gap-3 rounded-xl border p-3 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none disabled:cursor-not-allowed",
                  isSelected
                    ? "border-accent bg-accent"
                    : "border-border bg-surface-white hover:border-accent/30 hover:bg-bg-secondary",
                  !isSelectable &&
                    !isSelected &&
                    "opacity-50 cursor-not-allowed",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0",
                    isSelected
                      ? "bg-surface-white/20 text-white"
                      : "bg-bg-secondary text-text-secondary",
                  )}
                >
                  {getInitials(user.fullName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-black tracking-tight truncate",
                      isSelected ? "text-white" : "text-text-primary",
                    )}
                  >
                    {user.fullName}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p
                      className={cn(
                        "text-[9px] font-bold italic",
                        isSelected ? "text-white/70" : "text-text-secondary",
                      )}
                    >
                      @{user.userName}
                    </p>
                    <div
                      className={cn(
                        "w-0.5 h-0.5 rounded-full",
                        isSelected ? "bg-surface-white/30" : "bg-border",
                      )}
                    />
                    <p
                      className={cn(
                        "text-[9px] font-medium truncate",
                        isSelected ? "text-white/70" : "text-text-secondary",
                      )}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>
                {isAdded || isInvited ? (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest",
                      isSelected
                        ? "bg-surface-white/20 text-white"
                        : "bg-bg-secondary text-text-secondary",
                    )}
                  >
                    {isAdded ? "Member" : "Invited"}
                  </span>
                ) : isAlreadyChosen && !isSelected ? (
                  <div className="flex items-center gap-1.5 px-2 py-1.5 bg-bg-secondary text-accent text-[8px] font-black uppercase tracking-widest rounded-full">
                    {assignedRoles[user.id]}
                    <FiCheck size={10} />
                  </div>
                ) : isSelected ? (
                  <FiChevronRight className="text-white" />
                ) : (
                  isSelectable && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-border transition-colors group-hover:border-accent/50">
                      <FiPlus
                        className="text-text-secondary group-hover:text-accent"
                        size={12}
                      />
                    </div>
                  )
                )}
              </button>
            );
          })
        ) : searchTerm.length > 0 && searchTerm.length < 2 && !isSearching ? (
          <div className="space-y-2 py-10 text-center text-text-secondary">
            <p className="text-xs font-bold">Continue typing to search...</p>
          </div>
        ) : (
          !isSearching && (
            <div className="py-10 text-center space-y-2">
              {currentPage !== undefined ? (
                <>
                  <p className="text-xs font-bold text-text-secondary">
                    Browsing all active users
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-text-secondary">
                    Select members from the list below
                  </p>
                </>
              ) : (
                <p className="text-xs font-bold text-text-secondary">
                  {showSuggestions
                    ? "Chưa có gợi ý phù hợp. Hãy tìm theo username hoặc email."
                    : "Type at least 2 characters to search"}
                </p>
              )}
            </div>
          )
        )}

        {/* Pagination Controls for Admin List */}
        {currentPage !== undefined &&
          totalPages !== undefined &&
          totalPages > 1 && (
            <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-border bg-surface-white py-3 pt-3">
              <button
                type="button"
                aria-label="Previous users page"
                onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-surface-white text-text-secondary transition-colors hover:bg-bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-40 active:scale-95 motion-reduce:active:scale-100"
              >
                <FiChevronRight className="rotate-180" size={14} />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-text-secondary">
                  {currentPage} / {totalPages}
                </span>
              </div>
              <button
                type="button"
                aria-label="Next users page"
                onClick={() =>
                  onPageChange?.(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-border bg-surface-white text-text-secondary transition-colors hover:bg-bg-secondary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-40 active:scale-95 motion-reduce:active:scale-100"
              >
                <FiChevronRight size={14} />
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
