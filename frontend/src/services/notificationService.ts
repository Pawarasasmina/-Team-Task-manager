import api from './api';

interface Notification {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    name: string;
    email: string;
  };
  type: 'task_assigned' | 'task_completed' | 'task_updated';
  title: string;
  message: string;
  task?: {
    _id: string;
    title: string;
  };
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
}

interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
}

const notificationService = {
  // Get all notifications
  getNotifications: async (): Promise<NotificationResponse> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<{ success: boolean; notification: Notification }> => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }
};

export default notificationService;
export type { Notification, NotificationResponse, UnreadCountResponse };
