import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  userId: string;
  type: 'task_assignment' | 'task_update' | 'task_mention';
  message: string;
  taskId?: string;
  taskTitle?: string;
  projectId?: string;
  timestamp: number;
  read: boolean;
  shown: boolean; // Whether toast has been shown
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'shown'>) => void;
  markAsShown: (notificationId: string) => void;
  markAsRead: (notificationId: string) => void;
  getUnshownNotifications: (userId: string) => Notification[];
  getUnreadNotifications: (userId: string) => Notification[];
  clearNotifications: (userId: string) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notif-${crypto.randomUUID()}`,
          timestamp: Date.now(),
          read: false,
          shown: false,
        };
        
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));
      },
      
      markAsShown: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === notificationId ? { ...notif, shown: true } : notif
          ),
        })),
      
      markAsRead: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          ),
        })),
      
      getUnshownNotifications: (userId) => {
        const state = get();
        return state.notifications
          .filter((notif) => notif.userId === userId && !notif.shown)
          .sort((a, b) => a.timestamp - b.timestamp);
      },
      
      getUnreadNotifications: (userId) => {
        const state = get();
        return state.notifications
          .filter((notif) => notif.userId === userId && !notif.read)
          .sort((a, b) => b.timestamp - a.timestamp);
      },
      
      clearNotifications: (userId) =>
        set((state) => ({
          notifications: state.notifications.filter((notif) => notif.userId !== userId),
        })),
    }),
    {
      name: 'notification-storage', // localStorage key
    }
  )
);
