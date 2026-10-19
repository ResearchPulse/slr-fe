import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Bell, BellRing, CheckCheck, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useNotificationMutations, useNotifications, useUnreadCount } from "../../hooks/useNotifications";
import NotificationListItem from "../../components/notifications/NotificationListItem";
import Button from "../../components/ui/Button";
import type { NotificationItem } from "../../types/notification";
import { getNotificationHref } from "../../utils/notificationNavigation";

interface NotificationCenterPageProps {
  disableNavigation?: boolean;
}

type Filter = "all" | "unread";
const PAGE_SIZE = 10;

export default function NotificationCenterPage({ disableNavigation = false }: NotificationCenterPageProps) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const { notifications, isLoading, isError, error, refetch, isFetching } = useNotifications({ pageNumber: 1, pageSize: 50 });
  const { unreadCount } = useUnreadCount();
  const { markAsRead, markAllAsRead, isMarkingAllAsRead } = useNotificationMutations();

  const filteredNotifications = useMemo(
    () => filter === "unread" ? notifications.filter((item) => !item.isRead) : notifications,
    [filter, notifications],
  );
  const pageCount = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));
  const visibleNotifications = filteredNotifications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      try {
        await markAsRead(notification.id);
      } catch {
        // The mutation reports the error and rolls back its optimistic update.
      }
    }

    if (disableNavigation) return;
    const href = getNotificationHref(notification);
    if (href) navigate(href);
  };

  return (
    <main className="min-h-[calc(100vh-64px)] bg-bg-primary px-4 py-6 sm:px-6 sm:py-9">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <BellRing className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs font-semibold">Updates for your work</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-[30px]">Notifications</h1>
            <p className="mt-1 max-w-xl text-sm leading-6 text-text-secondary">Invitations, review assignments, and activity across your projects.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="min-h-11 self-start normal-case tracking-normal sm:self-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "motion-safe:animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </Button>
        </header>

        <section className="overflow-hidden rounded-xl border border-border bg-surface-white">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-2 rounded-lg bg-bg-secondary p-1" role="group" aria-label="Filter notifications">
              {(["all", "unread"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => { setFilter(value); setPage(1); }}
                  className={`inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 motion-reduce:transition-none ${filter === value ? "bg-surface-white text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
                >
                  {value === "all" ? "All activity" : "Unread"}
                  {value === "unread" && unreadCount > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${filter === value ? "bg-primary-light text-primary" : "bg-surface-white text-text-secondary"}`}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => markAllAsRead()}
              disabled={unreadCount === 0 && !notifications.some((item) => !item.isRead) || isMarkingAllAsRead || isLoading}
              className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:bg-transparent sm:self-auto"
            >
              <CheckCheck className="h-4 w-4" aria-hidden="true" />
              {isMarkingAllAsRead ? "Marking as read…" : "Mark all as read"}
            </button>
          </div>

          {isLoading ? (
            <div className="divide-y divide-border" aria-label="Loading notifications">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="flex motion-safe:animate-pulse gap-3 px-5 py-5">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-bg-secondary" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 w-2/5 rounded bg-bg-secondary" />
                    <div className="h-3 w-4/5 rounded bg-bg-secondary" />
                    <div className="h-3 w-1/2 rounded bg-bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="px-6 py-14 text-center" role="alert">
              <p className="font-medium text-text-primary">Notifications couldn’t load</p>
              <p className="mt-1 text-sm text-text-secondary">{error || "Check your connection and try again."}</p>
              <Button variant="outline" size="sm" onClick={() => void refetch()} className="mt-4 min-h-11 normal-case tracking-normal">Try again</Button>
            </div>
          ) : visibleNotifications.length > 0 ? (
            <div className="divide-y divide-border">
              {visibleNotifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200"
                  style={{ animationDelay: `${Math.min(index * 25, 175)}ms` }}
                >
                  <NotificationListItem
                    notification={notification}
                    onClick={() => void handleNotificationClick(notification)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-bg-secondary text-text-secondary">
                <Bell className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-text-primary">
                {filter === "unread" ? "You’re all caught up" : "No activity yet"}
              </h2>
              <p className="mt-1 max-w-sm text-sm leading-6 text-text-secondary">
                {filter === "unread" ? "There are no unread notifications. New updates will appear here." : "Project invitations and review updates will appear here."}
              </p>
            </div>
          )}

          {!isLoading && !isError && filteredNotifications.length > PAGE_SIZE && (
            <footer className="flex items-center justify-between border-t border-border bg-bg-secondary/40 px-4 py-3 sm:px-5">
              <p className="text-xs text-text-secondary">
                {filteredNotifications.length} recent updates · Page {page} of {pageCount}
              </p>
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Previous page" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-white hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" aria-label="Next page" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page >= pageCount} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-white hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </footer>
          )}
        </section>
      </div>
    </main>
  );
}
