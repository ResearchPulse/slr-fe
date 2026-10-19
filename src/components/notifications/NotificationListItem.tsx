import {
  Bell,
  ClipboardCheck,
  FolderKanban,
  Info,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";
import { formatRelativeTime } from "../../utils/dateFormat";
import type { NotificationItem } from "../../types/notification";

interface NotificationListItemProps {
  notification: NotificationItem;
  onClick: () => void;
  compact?: boolean;
}

const iconForType = (type: string | number): LucideIcon => {
  switch (String(type).toUpperCase()) {
    case "3":
    case "INVITATION":
    case "PROJECT_INVITATION":
    case "MEMBER_JOINED":
      return UserRoundPlus;
    case "4":
    case "PAPER_ASSIGNMENT":
    case "SCREENING_CONFLICT":
    case "REVIEW":
      return ClipboardCheck;
    case "2":
    case "PROJECT":
    case "PROJECT_CREATED":
      return FolderKanban;
    case "1":
    case "5":
    case "SYSTEM":
    case "SYSTEM_AUDIT":
      return Info;
    default:
      return Bell;
  }
};

export default function NotificationListItem({
  notification,
  onClick,
  compact = false,
}: NotificationListItemProps) {
  const Icon = iconForType(notification.type);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-start gap-3 text-left transition-colors hover:bg-primary-light/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary motion-reduce:transition-none ${
        compact ? "px-4 py-3" : "px-5 py-4 sm:px-6"
      } ${notification.isRead ? "bg-surface-white" : "bg-primary-light/40"}`}
    >
      <span className={`mt-0.5 flex shrink-0 items-center justify-center rounded-xl border ${compact ? "h-9 w-9" : "h-10 w-10"} ${notification.isRead ? "border-border bg-bg-secondary text-text-secondary" : "border-primary/10 bg-surface-white text-primary"}`}>
        <Icon className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"} aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className={`line-clamp-2 text-sm leading-5 ${notification.isRead ? "font-medium text-text-secondary" : "font-semibold text-text-primary"}`}>
            {notification.title}
          </span>
          <span className="shrink-0 pt-0.5 text-[11px] text-text-secondary">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </span>
        <span className={`mt-1 block text-xs leading-[1.55] text-text-secondary ${compact ? "line-clamp-2" : "line-clamp-3"}`}>
          {notification.message}
        </span>
      </span>

      {!notification.isRead && (
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
      )}
    </button>
  );
}
