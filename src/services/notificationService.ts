import api from "../config/axios";
import type {
  GetNotificationsParams,
  NotificationApiItem,
  NotificationApiResponse,
  NotificationEntityType,
  NotificationItem,
} from "../types/notification";

type NotificationListPayload =
  | NotificationApiItem[]
  | { items: NotificationApiItem[] };

const normalizeNotification = (item: NotificationApiItem): NotificationItem => {
  const rawType = String(item.type);
  const normalizedType = rawType.toUpperCase();
  const entityType = item.entityType ?? (
    item.relatedEntityId
      ? normalizedType.includes("INVITATION") ? 1 : 2
      : item.projectId
        ? 2
        : null
  );

  return {
    id: item.id,
    title: item.title,
    message: item.message,
    type: item.type,
    relatedEntityId: item.relatedEntityId ?? item.projectId ?? null,
    entityType: entityType as NotificationEntityType | null,
    actionUrl: item.actionUrl ?? null,
    isRead: item.isRead ?? item.read ?? false,
    createdAt: item.createdAt,
  };
};

class NotificationService {
  private readonly endpoint = "/notifications";

  /** The current API returns the latest notifications as a plain array. */
  getNotifications = async (
    params: GetNotificationsParams = { pageNumber: 1, pageSize: 50 },
  ): Promise<NotificationItem[]> => {
    const response = await api.get<NotificationApiResponse<NotificationListPayload>>(
      this.endpoint,
      { params },
    );
    const payload = response.data.data;
    const items = Array.isArray(payload) ? payload : payload.items;
    return items.map(normalizeNotification);
  };

  getUnreadCount = async (): Promise<number> => {
    const response = await api.get<NotificationApiResponse<number>>(
      `${this.endpoint}/unread-count`,
    );
    return Number(response.data.data) || 0;
  };

  markAsRead = async (id: string): Promise<void> => {
    // The API exposes PATCH /notifications/:id/read.
    await api.patch(`${this.endpoint}/${encodeURIComponent(id)}/read`);
  };

  markAllAsRead = async (): Promise<void> => {
    await api.patch(`${this.endpoint}/read-all`);
  };
}

export const notificationService = new NotificationService();
