'use client';

import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { notificationsApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await notificationsApi.getNotifications();
        if (Array.isArray(response.data)) {
          setNotifications(response.data);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
          <p className="text-gray-600">Stay updated with your university activities</p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="info">{unreadCount} unread</Badge>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={!notification.read ? 'border-l-4 border-l-blue-600' : ''}
            hover
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notification.read ? 'bg-gray-300' : 'bg-blue-600'}`} />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Notification</h3>
                      <p className="text-gray-600 text-sm">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                          title="Mark as read"
                        >
                          <Check size={16} className="text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{notification.created_at ? formatDateTime(new Date(notification.created_at)) : ''}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600">No notifications</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}




