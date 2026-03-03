import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSocket } from '../context/SocketContext';
import notificationService, { Notification } from '../services/notificationService';

interface NotificationBellProps {
  onNotificationClick?: (notification: Notification) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ onNotificationClick }) => {
  const { notifications: realTimeNotifications } = useSocket();
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch initial historical notifications
  const fetchInitialNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setAllNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Error fetching initial notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialNotifications();
  }, []);

  // Update state when new real-time notifications arrive
  useEffect(() => {
    if (realTimeNotifications.length === 0) return;

    console.log('🔔 NotificationBell: Real-time notifications updated', realTimeNotifications.length);

    // Merge new real-time notifications with existing ones
    setAllNotifications(prev => {
      const existingIds = new Set(prev.map(n => n._id));
      const newNotifications = realTimeNotifications.filter(n => !existingIds.has(n._id));
      
      if (newNotifications.length > 0) {
        console.log('🔔 Adding new notifications to bell:', newNotifications.length);
        // Update unread count for new notifications
        const newUnreadCount = newNotifications.filter(n => !n.isRead).length;
        setUnreadCount(prevCount => prevCount + newUnreadCount);
        return [...newNotifications, ...prev];
      }
      return prev;
    });
  }, [realTimeNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setAllNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setAllNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification._id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return '📝';
      case 'task_completed':
        return '✅';
      case 'task_updated':
        return '🔄';
      default:
        return '🔔';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown - Using Portal to render at body level */}
      {showDropdown && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9998] bg-black/20"
            onClick={() => setShowDropdown(false)}
          />

          {/* Notification Panel - Fixed Position Overlay */}
          <div className="fixed top-20 right-8 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9999] max-h-[calc(100vh-120px)] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex-shrink-0 rounded-t-2xl">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-gray-800">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600">
                  {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1 bg-white">
              {loading ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-4xl mb-2">⏳</p>
                  <p>Loading notifications...</p>
                </div>
              ) : allNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <p className="text-4xl mb-2">🔔</p>
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 bg-white">
                  {allNotifications.map(notification => (
                    <div
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 bg-white hover:bg-gray-100 cursor-pointer transition-colors border-b border-gray-100 ${
                        !notification.isRead ? 'bg-indigo-50' : 'bg-white'
                      }`}
                      style={{ minHeight: '80px' }}
                    >
                      <div className="flex gap-3 w-full">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-bold text-sm text-gray-900">
                              {notification.title || 'Notification'}
                            </h4>
                            {!notification.isRead && (
                              <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {notification.message || 'No message'}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {notification.sender && notification.sender.name && (
                              <span className="text-gray-600 truncate ml-2">
                                from {notification.sender.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default NotificationBell;
