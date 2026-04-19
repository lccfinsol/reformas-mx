
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import apiServerClient from '@/lib/apiServerClient';
import { format } from 'date-fns';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (open) {
      fetchRecentNotifications();
    }
  }, [open]);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiServerClient.fetch('/notifications/unread-count');
      if (!response.ok) throw new Error('Failed to fetch unread count');
      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchRecentNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiServerClient.fetch('/notifications?page=1&limit=5');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setRecentNotifications(data.items || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setRecentNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const response = await apiServerClient.fetch(`/notifications/${id}/read`, {
        method: 'PUT'
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      
      setRecentNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} nuevas</Badge>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
              ))}
            </div>
          ) : recentNotifications.length > 0 ? (
            <div className="divide-y">
              {recentNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-muted/50 transition-colors ${
                    !notification.leida ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Link
                      to={`/reforma/${notification.expand?.reforma_id?.id}`}
                      className="flex-grow"
                      onClick={() => {
                        if (!notification.leida) {
                          handleMarkAsRead(notification.id);
                        }
                        setOpen(false);
                      }}
                    >
                      <p className="font-medium text-sm line-clamp-2 hover:text-primary">
                        {notification.expand?.reforma_id?.titulo || 'Sin título'}
                      </p>
                    </Link>
                    {!notification.leida && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1"></div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(notification.fecha_envio), 'dd/MM/yyyy HH:mm')}
                  </p>
                  {notification.expand?.reforma_id?.materia_legal && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.expand.reforma_id.materia_legal}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No hay notificaciones</p>
            </div>
          )}
        </div>
        <div className="p-3 border-t">
          <Button variant="ghost" className="w-full" asChild>
            <Link to="/notifications" onClick={() => setOpen(false)}>
              Ver todas las notificaciones
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
