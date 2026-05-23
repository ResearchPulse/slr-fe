import React from "react";
import {
  FiCheckCircle,
  FiInfo,
  FiAlertTriangle,
  FiClock,
  FiBell,
  FiLoader,
} from "react-icons/fi";
import {
  useNotifications,
  useNotificationMutations,
} from "../../hooks/useNotifications";
import { formatRelativeTime } from "../../utils/dateFormat";
import {
  NotificationType,
  NotificationEntityType,
  type NotificationItem,
} from "../../types/notification";
import { useNavigate } from "react-router";
import { LuUserPlus } from "react-icons/lu";

interface NotificationDropdownProps {
  disableNavigation?: boolean;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  disableNavigation = false,
}) => {
  const navigate = useNavigate();
  const { notifications, isLoading, isFetching } = useNotifications({
    pageNumber: 1,
    pageSize: 10,
  });
  const { markAsRead, markAllAsRead, isMarkingAllAsRead } =
    useNotificationMutations();

  const getIcon = (type: number) => {
    switch (type) {
      case NotificationType.Invitation:
        return <LuUserPlus className="text-green-500 w-5 h-5" />;
      case NotificationType.System:
        return <FiAlertTriangle className="text-amber-500 w-5 h-5" />;
      case NotificationType.Project:
        return <FiInfo className="text-blue-500 w-5 h-5" />;
      case NotificationType.Review:
        return <FiCheckCircle className="text-indigo-500 w-5 h-5" />;
      case NotificationType.Comment:
        return <FiInfo className="text-slate-500 w-5 h-5" />;
      default:
        return <FiBell className="text-gray-400 w-5 h-5" />;
    }
  };

  console.log(notifications);

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (disableNavigation) return;

    // Handle navigation based on entity type
    if (notification.relatedEntityId) {
      switch (notification.entityType) {
        case NotificationEntityType.ProjectInvitation:
          navigate(`/invitations/${notification.relatedEntityId}`);
          break;
        case NotificationEntityType.Project:
          navigate(`/projects/${notification.relatedEntityId}`);
          break;
        default:
          break;
      }
    }
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsRead();
  };

  return (
    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-surface-white rounded-md shadow-2xl border border-border ring-1 ring-black/5 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-bg-secondary">
        <h3 className="font-medium text-text-primary uppercase tracking-[0.1em] text-[13px] flex items-center gap-2">
          Notifications
          {(isLoading || isFetching) && (
            <FiLoader className="w-3 h-3 animate-spin text-accent" />
          )}
        </h3>
        <button
          onClick={handleMarkAllAsRead}
          disabled={isMarkingAllAsRead || notifications.length === 0}
          className="text-[10px] font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 uppercase tracking-widest"
        >
          {isMarkingAllAsRead ? "Marking..." : "Mark all as read"}
        </button>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="p-12 text-center">
            <FiLoader className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
            <p className="text-text-secondary text-sm">
              Loading notifications...
            </p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-border">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 hover:bg-bg-secondary transition-colors cursor-pointer flex gap-4 ${
                  !notif.isRead ? "bg-bg-secondary/50" : ""
                }`}
              >
                <div className="mt-1 flex-shrink-0">{getIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <p
                      className={`text-[13px] font-medium truncate tracking-wide ${
                        !notif.isRead
                          ? "text-text-primary"
                          : "text-text-secondary"
                      }`}
                    >
                      {notif.title}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-text-secondary uppercase tracking-widest whitespace-nowrap">
                      <FiClock className="w-3 h-3" />
                      {formatRelativeTime(notif.createdAt)}
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
                {!notif.isRead && (
                  <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0"></div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-bg-secondary rounded-[4px] flex items-center justify-center mx-auto mb-4 border border-border">
              <FiBell className="w-8 h-8 text-text-secondary" />
            </div>
            <p className="text-text-primary text-[13px] font-medium tracking-[0.1em] uppercase">
              All caught up!
            </p>
            <p className="text-text-secondary text-xs mt-1">
              No new notifications.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-bg-secondary text-center">
        <button className="text-[10px] font-medium text-text-secondary hover:text-text-primary transition-colors uppercase tracking-[0.2em]">
          See All Activity
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
