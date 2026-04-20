
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bell, Check, Trash2, Inbox } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';

const NotificationsPage = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [currentUser]);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      // Expand 'reforma_id' to show title
      const records = await pb.collection('notification_history').getList(1, 50, {
        filter: `user_id="${currentUser.id}"`,
        sort: '-fecha_envio',
        expand: 'reforma_id',
        $autoCancel: false
      });
      setNotifications(records.items);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await pb.collection('notification_history').update(id, {
        leida: true,
        fecha_lectura: new Date().toISOString()
      }, { $autoCancel: false });
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, leida: true } : n)
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await pb.collection('notification_history').delete(id, { $autoCancel: false });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-muted/10">
      <Header />

      <main className="flex-1 container mx-auto px-4 max-w-4xl py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Bell size={28} />
          </div>
          <h1 className="text-3xl font-bold font-serif">Notificaciones</h1>
        </div>

        <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-6 space-y-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-4 pb-6 border-b last:border-0">
                  <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Inbox size={32} className="text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No tienes notificaciones</h3>
              <p className="text-muted-foreground">Te avisaremos cuando haya actualizaciones que coincidan con tus suscripciones.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((notif) => {
                const isRead = notif.leida;
                const reforma = notif.expand?.reforma_id;

                return (
                  <li key={notif.id} className={`p-6 transition-colors hover:bg-muted/30 ${!isRead ? 'bg-primary/5' : ''}`}>
                    <div className="flex gap-4">
                      <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${!isRead ? 'bg-primary' : 'bg-transparent'}`} />
                      
                      <div className="flex-1">
                        <div className="flex justify-between gap-4 mb-1">
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(notif.fecha_envio), "d 'de' MMM, HH:mm", { locale: es })}
                          </p>
                          <div className="flex items-center gap-2">
                            {!isRead && (
                              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-primary" onClick={() => markAsRead(notif.id)}>
                                <Check size={14} className="mr-1" /> Marcar leída
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteNotification(notif.id)}>
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>

                        {reforma ? (
                          <>
                            <h4 className={`text-base leading-snug mb-2 ${!isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                              Nueva publicación: <Link to={`/reforma/${reforma.id}`} className="hover:text-primary hover:underline">{reforma.titulo}</Link>
                            </h4>
                            <p className="text-sm text-muted-foreground">Fuente: {reforma.fuente}</p>
                          </>
                        ) : (
                          <h4 className="text-base font-medium text-muted-foreground italic">Reforma no disponible</h4>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotificationsPage;
