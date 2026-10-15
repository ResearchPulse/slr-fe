import { NotificationEntityType, type NotificationItem } from "../types/notification";

export function getNotificationHref(notification: NotificationItem): string | null {
  const actionUrl = notification.actionUrl?.trim();
  if (actionUrl?.startsWith("/") && !actionUrl.startsWith("//")) return actionUrl;

  if (!notification.relatedEntityId) return null;
  if (notification.entityType === NotificationEntityType.ProjectInvitation) {
    return `/invitations/${encodeURIComponent(notification.relatedEntityId)}`;
  }
  if (notification.entityType === NotificationEntityType.Project) {
    return `/projects/${encodeURIComponent(notification.relatedEntityId)}`;
  }
  return null;
}
