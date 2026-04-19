
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Phone, Globe, Calendar, Bell, Edit, Trash2 } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient';
import AdminSubscriberForm from './AdminSubscriberForm.jsx';

const AdminSubscriberDetail = ({ id, open, onOpenChange, onRefreshList }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editFormOpen, setEditFormOpen] = useState(false);

  const fetchDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiServerClient.fetch(`/admin/subscribers/${id}`);
      if (!response.ok) throw new Error('Failed to fetch details');
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(err);
      setError('Error al cargar detalles del suscriptor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && id) {
      fetchDetails();
    } else {
      setData(null); // Reset when closing
    }
  }, [open, id]);

  const handleEditSuccess = () => {
    fetchDetails(); // Reload details
    onRefreshList && onRefreshList(); // Reload table behind it
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-hidden flex flex-col p-0">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              <p>Cargando información del perfil...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-destructive">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={fetchDetails}>Intentar de nuevo</Button>
            </div>
          ) : data ? (
            <>
              <SheetHeader className="p-6 pb-0">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <SheetTitle className="text-2xl">{data.subscriber?.nombre_completo || 'Sin Nombre'}</SheetTitle>
                    <SheetDescription className="flex items-center gap-2 mt-1">
                      <Badge variant={data.subscriber?.activo ? 'default' : 'secondary'} className={data.subscriber?.activo ? 'bg-success hover:bg-success/90' : ''}>
                        {data.subscriber?.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                      <span>ID: {data.subscriber?.id?.substring(0, 8)}...</span>
                    </SheetDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => setEditFormOpen(true)} title="Editar contacto">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1 px-6">
                <div className="py-6 space-y-8">
                  {/* Contact Info */}
                  <section>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Información de Contacto</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{data.subscriber?.email}</span>
                      </div>
                      {data.subscriber?.numero_telefono && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{data.subscriber.numero_telefono}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>{data.subscriber?.pais_codigo || 'No especificado'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Registrado: {format(new Date(data.subscriber?.fecha_creacion || data.subscriber?.created), 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                    </div>
                  </section>

                  <Separator />

                  {/* Subscriptions */}
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Suscripciones ({data.subscriptions?.length || 0})</h3>
                    </div>
                    {data.subscriptions?.length > 0 ? (
                      <div className="grid gap-3">
                        {data.subscriptions.map(sub => (
                          <div key={sub.id} className="p-3 bg-muted/50 rounded-lg border border-border">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">{sub.materia_legal}</p>
                                <p className="text-xs text-muted-foreground mt-1">Fuente: {sub.fuente}</p>
                                {sub.estado && <p className="text-xs text-muted-foreground">Estado: {sub.estado}</p>}
                              </div>
                              <Badge variant={sub.activa ? 'outline' : 'secondary'} className="text-[10px]">
                                {sub.activa ? 'Activa' : 'Pausada'}
                              </Badge>
                            </div>
                            <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                              <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">
                                {sub.notificaciones_email ? 'Email: Sí' : 'Email: No'}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] bg-info/10 text-info">
                                {sub.notificaciones_tiempo_real ? 'Realtime: Sí' : 'Realtime: No'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No tiene suscripciones configuradas.</p>
                    )}
                  </section>

                  <Separator />

                  {/* Notifications History */}
                  <section className="pb-8">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                      <Bell className="h-4 w-4" /> Últimas Notificaciones
                    </h3>
                    {data.notifications?.length > 0 ? (
                      <div className="space-y-4 border-l-2 border-border ml-2 pl-4">
                        {data.notifications.map(notif => (
                          <div key={notif.id} className="relative">
                            <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
                            <p className="text-xs text-muted-foreground mb-1">
                              {format(new Date(notif.fecha_envio), 'dd MMM, HH:mm')}
                            </p>
                            <p className="text-sm font-medium line-clamp-1">{notif.expand?.reforma_id?.titulo || 'Reforma Legal'}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Vía {notif.tipo_notificacion} • {notif.leida ? 'Leída' : 'No leída'}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No hay historial de notificaciones recientes.</p>
                    )}
                  </section>
                </div>
              </ScrollArea>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Edit Form Modal */}
      {data && data.subscriber && (
        <AdminSubscriberForm 
          open={editFormOpen} 
          onOpenChange={setEditFormOpen} 
          subscriber={data.subscriber} 
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
};

export default AdminSubscriberDetail;
