import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import Navigation from '@/components/Navigation';
import {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearAllNotifications,
} from '@/store/slices/notificationSlice';
import { notificationAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import './Notifications.css';

const Notifications: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const { notifications, unreadCount } = useSelector(
    (state: RootState) => state.notification
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🔄 Fetch notifications from backend
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user?.email) return;
      setLoading(true);
      setError('');

      try {
        // ✅ Always include token from localStorage
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Authentication token missing. Please login again.');
          setLoading(false);
          return;
        }

        const res = await notificationAPI.getUserNotifications(user.email, token);

        if (res.data && Array.isArray(res.data)) {
          // Sort newest first
          const sorted = res.data.sort((a, b) => b.timestamp - a.timestamp);
          dispatch(clearAllNotifications());
          sorted.forEach((n: any) => {
            dispatch(
              addNotification({
                id: n.id,
                type: n.type || 'system', // fallback if backend doesn't have type
                title: n.title,
                message: n.message,
                read: n.read,
                timestamp: n.timestamp,
              })
            );
          });
        } else {
          console.warn('Unexpected response format:', res.data);
        }
      } catch (err: any) {
        console.error('Failed to load notifications:', err);
        setError(
          err.response?.status === 403
            ? 'Access denied. Please login again.'
            : 'Could not load notifications. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [user?.email, dispatch]);

  // ✅ Mark a single notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      await notificationAPI.markAsRead(id, token);
      dispatch(markAsRead(id));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // ✅ Remove a notification from the Redux store
  const handleRemove = (id: string) => {
    dispatch(removeNotification(id));
  };

  // ✅ Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      if (notifications.length > 0) {
        await Promise.all(
          notifications
            .filter((n) => !n.read)
            .map((n) => notificationAPI.markAsRead(n.id, token))
        );
        dispatch(markAllAsRead());
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // ✅ Clear all notifications locally
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      dispatch(clearAllNotifications());
    }
  };

  // ✅ Helpers for icon and color
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'friend_request':
        return '👋';
      case 'payment':
        return '💰';
      case 'system':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'notification-message';
      case 'friend_request':
        return 'notification-friend';
      case 'payment':
        return 'notification-payment';
      case 'system':
        return 'notification-system';
      default:
        return '';
    }
  };

  return (
    <>
      <Navigation />

      <div className="container" style={{ paddingTop: 'var(--spacing-lg)' }}>
        <div className="page-header">
          <h1>Notifications</h1>
          <p>
            {notifications.length} notification
            {notifications.length !== 1 ? 's' : ''}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {loading && <div className="spinner spinner-lg"></div>}

        <div className="notifications-card">
          <div className="notifications-toolbar">
            <div className="toolbar-info">
              {unreadCount > 0 && (
                <span className="unread-badge">{unreadCount} unread</span>
              )}
            </div>
            <div className="toolbar-actions">
              {unreadCount > 0 && (
                <button
                  className="btn btn-secondary btn-small"
                  onClick={handleMarkAllAsRead}
                >
                  Mark All as Read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  className="btn btn-danger btn-small"
                  onClick={handleClearAll}
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {notifications.length > 0 ? (
            <div className="notifications-list">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${getNotificationColor(
                    notif.type
                  )} ${!notif.read ? 'unread' : ''}`}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="notification-content">
                    <div className="notification-title">{notif.title}</div>
                    <div className="notification-message">{notif.message}</div>
                    <div className="notification-time">
                      {new Date(notif.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="notification-actions">
                    {!notif.read && (
                      <button
                        className="notification-action-btn"
                        onClick={() => handleMarkAsRead(notif.id)}
                        title="Mark as read"
                      >
                        ●
                      </button>
                    )}
                    <button
                      className="notification-action-btn"
                      onClick={() => handleRemove(notif.id)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="empty-state">
                <p>🎉 No notifications yet!</p>
                <small>You're all caught up</small>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
};

export default Notifications;
