import { useSelector } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "../services/notificationService";
import { QUERY_KEYS } from "../constants/queryKeys";
import { getErrorMessage } from "../utils/errorUtils";
import { toastError } from "../utils/toast";
import type { RootState } from "../redux/store";
import type { GetNotificationsParams, NotificationItem } from "../types/notification";

const DEFAULT_PARAMS: GetNotificationsParams = { pageNumber: 1, pageSize: 50 };

export const useNotifications = (params: GetNotificationsParams = DEFAULT_PARAMS) => {
  const userId = useSelector((state: RootState) => state.auth.user?.id || "anonymous");
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const query = useQuery({
    queryKey: QUERY_KEYS.user.notifications.list(userId, params),
    queryFn: () => notificationService.getNotifications(params),
    enabled: isAuthenticated,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, "Couldn't load notifications") : null,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
};

export const useUnreadCount = () => {
  const userId = useSelector((state: RootState) => state.auth.user?.id || "anonymous");
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const query = useQuery({
    queryKey: QUERY_KEYS.user.notifications.unreadCount(userId),
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isAuthenticated,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  return {
    unreadCount: query.data ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
};

export const useNotificationMutations = () => {
  const queryClient = useQueryClient();
  const userId = useSelector((state: RootState) => state.auth.user?.id || "anonymous");
  const listKey = QUERY_KEYS.user.notifications.list(userId);
  const countKey = QUERY_KEYS.user.notifications.unreadCount(userId);

  const invalidateNotifications = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user.notifications.all(userId) });
  };

  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.user.notifications.all(userId) });
      const previousLists = queryClient.getQueriesData<NotificationItem[]>({ queryKey: listKey });
      const wasUnread = previousLists.some(([, list]) => list?.some((item) => item.id === id && !item.isRead));

      queryClient.setQueriesData<NotificationItem[]>({ queryKey: listKey }, (items) =>
        items?.map((item) => item.id === id ? { ...item, isRead: true } : item),
      );
      const previousCount = queryClient.getQueryData<number>(countKey);
      if (wasUnread && previousCount !== undefined) {
        queryClient.setQueryData(countKey, Math.max(0, previousCount - 1));
      }

      return { previousLists, previousCount };
    },
    onError: (error, _id, context) => {
      context?.previousLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.previousCount !== undefined) queryClient.setQueryData(countKey, context.previousCount);
      toastError("Couldn't update notification", getErrorMessage(error, "Please try again."));
    },
    onSettled: invalidateNotifications,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.user.notifications.all(userId) });
      const previousLists = queryClient.getQueriesData<NotificationItem[]>({ queryKey: listKey });
      queryClient.setQueriesData<NotificationItem[]>({ queryKey: listKey }, (items) =>
        items?.map((item) => ({ ...item, isRead: true })),
      );
      const previousCount = queryClient.getQueryData<number>(countKey);
      queryClient.setQueryData(countKey, 0);
      return { previousLists, previousCount };
    },
    onError: (error, _ids, context) => {
      context?.previousLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.previousCount !== undefined) queryClient.setQueryData(countKey, context.previousCount);
      toastError("Couldn't update notifications", getErrorMessage(error, "Please try again."));
    },
    onSettled: invalidateNotifications,
  });

  return {
    markAsRead: markAsReadMutation.mutateAsync,
    isMarkingAsRead: markAsReadMutation.isPending,
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
};
