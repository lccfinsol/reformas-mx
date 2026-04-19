
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Trash2, Check, Mail, Zap } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [page]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiServerClient.fetch(`/notifications?page=${page}&limit=20`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data = await response.json();
      setNotifications(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Error al cargar notificaciones');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleMarkAsRead = async (id) => {
    try {
      const response = await apiServerClient.fetch(`/notifications/${id}/read`, {
        method: 'PUT'
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, leida: true, fecha_lectura: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Marcada como leída');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Error al actualizar notificación');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta notificación?')) return;

    try {
      const response = await apiServerClient.fetch(`/notifications/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notificación eliminada');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Error al eliminar notificación');
    }
  };

  const getNotificationIcon = (tipo) => {
    switch (tipo) {
      case 'email':
        return <Mail className="h-5 w-5 text-primary" />;
      case 'tiempo_real':
        return <Zap className="h-5 w-5 text-info" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Notificaciones - Portal de Reformas Legales</title>
        <meta name="description" content="Revisa tus notificaciones sobre reformas legales recientes." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-grow bg-secondary/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-2">Notificaciones</h1>
                <p className="text-muted-foreground">
                  Historial de notificaciones recibidas
                </p>
              </div>
              {unreadCount > 0 && (
                <Badge className="bg-destructive text-destructive-foreground text-lg px-4 py-2">
                  {unreadCount} sin leer
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              {loading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-32 bg-muted rounded-xl animate-pulse"></div>
                  ))}
                </>
              ) : notifications.length > 0 ? (
                <>
                  {notifications.map(notification => (
                    <Card
                      key={notification.id}
                      className={`transition-all ${
                        !notification.leida ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg shrink-0 ${
                            !notification.leida ? 'bg-primary/10' : 'bg-muted'
                          }`}>
                            {getNotificationIcon(notification.tipo_notificacion)}
                          </div>

                          <div className="flex-grow min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <Link
                                to={`/reforma/${notification.expand?.reforma_id?.id}`}
                                className="flex-grow"
                              >
                                <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
                                  {notification.expand?.reforma_id?.titulo || 'Sin título'}
                                </h3>
                              </Link>
                              {!notification.leida && (
                                <div className="w-3 h-3 rounded-full bg-primary shrink-0 mt-1"></div>
                              )}
                            </div>

                            {notification.expand?.reforma_id && (
                              <div className="flex flex-wrap gap-2 mb-3">
                                {notification.expand.reforma_id.materia_legal && (
                                  <Badge variant="secondary">
                                    {notification.expand.reforma_id.materia_legal}
                                  </Badge>
                                )}
                                {notification.expand.reforma_id.nivel && (
                                  <Badge variant="outline">
                                    {notification.expand.reforma_id.nivel}
                                  </Badge>
                                )}
                                {notification.expand.reforma_id.fuente && (
                                  <Badge variant="outline">
                                    {notification.expand.reforma_id.fuente}
                                  </Badge>
                                )}
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span>
                                Recibida: {format(new Date(notification.fecha_envio), 'dd/MM/yyyy HH:mm')}
                              </span>
                              {notification.leida && notification.fecha_lectura && (
                                <span>
                                  Leída: {format(new Date(notification.fecha_lectura), 'dd/MM/yyyy HH:mm')}
                                </span>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {!notification.leida && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Marcar como leída
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(notification.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                      <Button
                        variant="outline"
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        disabled={page === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Página {page} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={page === totalPages}
                      >
                        Siguiente
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Sin notificaciones</h3>
                    <p className="text-muted-foreground mb-6">
                      No has recibido notificaciones aún. Crea una suscripción para empezar a recibirlas.
                    </p>
                    <Button asChild>
                      <Link to="/subscriptions">Gestionar suscripciones</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default NotificationsPage;
