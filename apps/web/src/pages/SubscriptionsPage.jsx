
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

const SubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    materia_legal: '',
    estado: '',
    fuente: '',
    notificaciones_email: true,
    notificaciones_tiempo_real: true,
    activa: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const materias = ['Fiscal', 'Laboral', 'Procesal y mercantil', 'Penal', 'Salud y seguridad social', 'Administrativo', 'Otras'];
  const estados = ['Federal', 'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'];
  const fuentes = ['DOF', 'Cámara de Diputados', 'Periódico Estatal', 'Todas'];

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const records = await pb.collection('user_subscriptions').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setSubscriptions(records);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Error al cargar suscripciones');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.materia_legal || !formData.fuente) {
      toast.error('Materia legal y fuente son requeridos');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await pb.collection('user_subscriptions').update(editingId, formData, { $autoCancel: false });
        toast.success('Suscripción actualizada');
      } else {
        await pb.collection('user_subscriptions').create({
          ...formData,
          user_id: pb.authStore.model.id
        }, { $autoCancel: false });
        toast.success('Suscripción creada');
      }
      
      resetForm();
      fetchSubscriptions();
    } catch (error) {
      console.error('Error saving subscription:', error);
      toast.error('Error al guardar suscripción');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (subscription) => {
    setFormData({
      materia_legal: subscription.materia_legal,
      estado: subscription.estado || '',
      fuente: subscription.fuente,
      notificaciones_email: subscription.notificaciones_email,
      notificaciones_tiempo_real: subscription.notificaciones_tiempo_real,
      activa: subscription.activa
    });
    setEditingId(subscription.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta suscripción?')) return;

    try {
      await pb.collection('user_subscriptions').delete(id, { $autoCancel: false });
      toast.success('Suscripción eliminada');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Error al eliminar suscripción');
    }
  };

  const resetForm = () => {
    setFormData({
      materia_legal: '',
      estado: '',
      fuente: '',
      notificaciones_email: true,
      notificaciones_tiempo_real: true,
      activa: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <>
      <Helmet>
        <title>Mis suscripciones - Portal de Reformas Legales</title>
        <meta name="description" content="Gestiona tus suscripciones y preferencias de notificación para recibir alertas sobre reformas legales de tu interés." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-grow bg-secondary/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Mis suscripciones</h1>
              <p className="text-muted-foreground">
                Gestiona tus preferencias de notificación para reformas legales
              </p>
            </div>

            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="mb-6">
                <Plus className="h-4 w-4 mr-2" />
                Nueva suscripción
              </Button>
            )}

            {showForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>{editingId ? 'Editar suscripción' : 'Nueva suscripción'}</CardTitle>
                  <CardDescription>
                    Selecciona las materias y fuentes sobre las que deseas recibir notificaciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="materia_legal">Materia legal *</Label>
                      <Select
                        value={formData.materia_legal}
                        onValueChange={(value) => setFormData({ ...formData, materia_legal: value })}
                      >
                        <SelectTrigger id="materia_legal">
                          <SelectValue placeholder="Selecciona una materia" />
                        </SelectTrigger>
                        <SelectContent>
                          {materias.map(materia => (
                            <SelectItem key={materia} value={materia}>
                              {materia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado (opcional)</Label>
                      <Select
                        value={formData.estado}
                        onValueChange={(value) => setFormData({ ...formData, estado: value })}
                      >
                        <SelectTrigger id="estado">
                          <SelectValue placeholder="Todos los estados" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos los estados</SelectItem>
                          {estados.map(estado => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fuente">Fuente *</Label>
                      <Select
                        value={formData.fuente}
                        onValueChange={(value) => setFormData({ ...formData, fuente: value })}
                      >
                        <SelectTrigger id="fuente">
                          <SelectValue placeholder="Selecciona una fuente" />
                        </SelectTrigger>
                        <SelectContent>
                          {fuentes.map(fuente => (
                            <SelectItem key={fuente} value={fuente}>
                              {fuente}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-semibold">Preferencias de notificación</h3>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-notifications" className="cursor-pointer">
                          Notificaciones por email
                        </Label>
                        <Switch
                          id="email-notifications"
                          checked={formData.notificaciones_email}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, notificaciones_email: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="realtime-notifications" className="cursor-pointer">
                          Notificaciones en tiempo real
                        </Label>
                        <Switch
                          id="realtime-notifications"
                          checked={formData.notificaciones_tiempo_real}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, notificaciones_tiempo_real: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="active" className="cursor-pointer">
                          Suscripción activa
                        </Label>
                        <Switch
                          id="active"
                          checked={formData.activa}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, activa: checked })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button type="submit" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {editingId ? 'Actualizar' : 'Crear'} suscripción
                          </>
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {loading ? (
                <>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-40 bg-muted rounded-xl animate-pulse"></div>
                  ))}
                </>
              ) : subscriptions.length > 0 ? (
                subscriptions.map(subscription => (
                  <Card key={subscription.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">
                            {subscription.materia_legal}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Fuente: {subscription.fuente}
                            {subscription.estado && ` • ${subscription.estado}`}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          subscription.activa
                            ? 'bg-success/10 text-success'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {subscription.activa ? 'Activa' : 'Pausada'}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {subscription.notificaciones_email && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                            Email
                          </span>
                        )}
                        {subscription.notificaciones_tiempo_real && (
                          <span className="px-2 py-1 bg-info/10 text-info text-xs rounded">
                            Tiempo real
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <span>Creada: {format(new Date(subscription.fecha_creacion), 'dd/MM/yyyy')}</span>
                        {subscription.ultima_notificacion && (
                          <span>
                            Última notificación: {format(new Date(subscription.ultima_notificacion), 'dd/MM/yyyy')}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(subscription)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(subscription.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">Sin suscripciones</h3>
                    <p className="text-muted-foreground mb-6">
                      Crea una suscripción para recibir notificaciones sobre reformas legales
                    </p>
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva suscripción
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

export default SubscriptionsPage;
