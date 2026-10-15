import { ArrowRight, Bell, CheckCheck, LoaderCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";
import {
  useNotificationMutations,
  useNotifications,
  useUnreadCount,
} from "../../hooks/useNotifications";
import type { NotificationItem } from "../../types/notification";
import { getNotificationHref } from "../../utils/notificationNavigation";
import NotificationListItem from "../notifications/NotificationListItem";

interface NotificationDropdownProps {
  disableNavigation?: boolean;
  activityPath?: string;
  onClose?: () => void;
}

export default function NotificationDropdown({
  disableNavigation = false,
  activityPath = "/notifications",
  onClose,
}: NotificationDropdownProps) {
  const navigate = useNavigate();
  const { notifications, isLoading, isError, error, refetch, isFetching } = useNotifications({
    pageNumber: 1,
    pageSize: 50,
  });
  const { unreadCount } = useUnreadCount();
  const { markAsRead, markAllAsRead, isMarkingAllAsRead } = useNotificationMutations();
  const hasUnread = unreadCount > 0 || notifications.some((item) => !item.isRead);

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
      } catch {
        // The mutation shows an error and rolls back its optimistic update.
      }
    }

    if (disableNavigation) return;

    const href = getNotificationHref(notification);
    if (href) navigate(href);
    onClose?.();
  };

  return (
    <section
      id="notifications-popover"
      role="dialog"
      aria-modal="false"
      aria-label="Notifications"
      className="fixed left-4 right-4 top-[72px] z-(--z-index-dropdown) mx-auto w-auto max-w-[27rem] overflow-hidden rounded-xl border border-border bg-surface-white shadow-[0_4px_12px_-4px_rgba(18,35,49,0.18)] animate-in fade-in slide-in-from-top-2 duration-150 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:mx-0 sm:w-[min(27rem,calc(100vw-2rem))]"
    >
      <header className="flex items-center justify-between gap-3 border-b border-border bg-surface-white px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/10 bg-primary-light text-primary">
            <Bell className="h-[17px] w-[17px]" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold leading-5 text-text-primary">Notifications</h2>
            <p className="mt-0.5 text-xs leading-4 text-text-secondary">
              {unreadCount > 0 ? `${unreadCount} unread` : "Updates across your review projects"}
            </p>
          </div>
          {isFetching && <LoaderCircle className="h-3.5 w-3.5 animate-spin text-text-secondary" aria-label="Refreshing notifications" />}
        </div>
        <button
          type="button"
          onClick={() => markAllAsRead()}
          disabled={!hasUnread || isMarkingAllAsRead || isLoading}
          className="shrink-0 rounded-lg px-2.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:text-text-disabled disabled:hover:bg-transparent"
        >
          {isMarkingAllAsRead ? "Marking…" : "Mark all read"}
        </button>
      </header>

      <div className="max-h-[min(26rem,65vh)] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4 p-5" aria-label="Loading notifications">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex gap-3 animate-pulse">
                <div className="h-9 w-9 shrink-0 rounded-xl bg-bg-secondary" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-3/4 rounded bg-bg-secondary" />
                  <div className="h-2.5 w-full rounded bg-bg-secondary" />
                  <div className="h-2.5 w-2/3 rounded bg-bg-secondary" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center px-6 py-9 text-center">
            <p className="text-sm font-medium text-text-primary">Couldn’t load notifications</p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-text-secondary">{error || "Check your connection and try again."}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:bg-bg-secondary"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Try again
            </button>
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-border/80">
            {notifications.slice(0, 6).map((notification) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                onClick={() => void handleNotificationClick(notification)}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-9 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-secondary text-primary">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-3 text-sm font-semibold text-text-primary">You are all caught up</h3>
            <p className="mt-1 max-w-[19rem] text-xs leading-5 text-text-secondary">New invitations and review updates will appear here.</p>
          </div>
        )}
      </div>

      <footer className="border-t border-border bg-bg-secondary/50 p-2">
        <button
          type="button"
          onClick={() => {
            navigate(activityPath);
            onClose?.();
          }}
          className="group flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
          See all activity
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </button>
      </footer>
    </section>
  );
}
