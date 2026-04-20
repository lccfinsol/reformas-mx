
import React, { useState, useEffect } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const SubscriptionsPage = () => {
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const defaultSub = {
    user_id: currentUser?.id,
    materia_legal: 'Otras',
    estado: 'Federal',
    fuente: 'Todas',
    activa: false,
    notificaciones_email: false,
    notificaciones_tiempo_real: false
  };

  const [formData, setFormData] = useState(defaultSub);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (!currentUser) return;
      try {
        const records = await pb.collection('user_subscriptions').getList(1, 1, {
          filter: `user_id="${currentUser.id}"`,
          $autoCancel: false
        });
        
        if (records.items.length > 0) {
          setSubscription(records.items[0]);
          setFormData(records.items[0]);
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscription();
  }, [currentUser]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (subscription?.id) {
        const updated = await pb.collection('user_subscriptions').update(subscription.id, formData, { $autoCancel: false });
        setSubscription(updated);
        toast.success('Preferencias actualizadas');
      } else {
        const created = await pb.collection('user_subscriptions').create(formData, { $autoCancel: false });
        setSubscription(created);
        toast.success('Suscripción creada exitosamente');
      }
    } catch (err) {
      console.error('Error saving subscription:', err);
      toast.error('Error al guardar', { description: 'Verifica los datos e inténtalo nuevamente.' });
    } finally {
      setSaving(false);
    }
  };

  const materias = ['Fiscal', 'Laboral', 'Procesal y mercantil', 'Penal', 'Salud y seguridad social', 'Administrativo', 'Otras'];
  const fuentes = ['DOF', 'Cámara de Diputados', 'Periódico Estatal', 'Todas'];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-muted/10">
      <Header />

      <main className="flex-1 container mx-auto px-4 max-w-3xl py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif mb-2">Preferencias de Alertas</h1>
          <p className="text-muted-foreground">Configura cómo y sobre qué temas deseas recibir notificaciones automáticas.</p>
        </div>

        {loading ? (
          <div className="bg-card border rounded-2xl p-8 h-[400px] flex items-center justify-center">
            <p className="text-muted-foreground">Cargando preferencias...</p>
          </div>
        ) : (
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            
            <div className="p-6 md:p-8 space-y-10">
              
              {/* Main Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl border">
                <div>
                  <Label htmlFor="activa" className="text-base font-semibold">Activar Suscripción</Label>
                  <p className="text-sm text-muted-foreground">Pausar o reanudar todas tus alertas.</p>
                </div>
                <Switch 
                  id="activa" 
                  checked={formData.activa} 
                  onCheckedChange={(val) => handleChange('activa', val)}
                />
              </div>

              <div className={`space-y-8 transition-opacity duration-300 ${!formData.activa ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                
                {/* Topic Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Temática de Interés</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Materia Legal Principal</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.materia_legal}
                        onChange={(e) => handleChange('materia_legal', e.target.value)}
                      >
                        {materias.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fuente de Publicación</Label>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.fuente}
                        onChange={(e) => handleChange('fuente', e.target.value)}
                      >
                        {fuentes.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Delivery Methods */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Métodos de Entrega</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email_notif" className="flex flex-col cursor-pointer">
                        <span className="font-medium text-foreground">Correo Electrónico</span>
                        <span className="font-normal text-sm text-muted-foreground">Recibe un resumen diario en tu bandeja de entrada.</span>
                      </Label>
                      <Switch 
                        id="email_notif" 
                        checked={formData.notificaciones_email} 
                        onCheckedChange={(val) => handleChange('notificaciones_email', val)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="realtime_notif" className="flex flex-col cursor-pointer">
                        <span className="font-medium text-foreground">Alertas en Tiempo Real</span>
                        <span className="font-normal text-sm text-muted-foreground">Notificaciones instantáneas dentro de la plataforma (WebSockets).</span>
                      </Label>
                      <Switch 
                        id="realtime_notif" 
                        checked={formData.notificaciones_tiempo_real} 
                        onCheckedChange={(val) => handleChange('notificaciones_tiempo_real', val)}
                      />
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <div className="bg-muted/30 p-6 border-t flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle size={16} />
                <span>Los cambios se aplican de inmediato.</span>
              </div>
              <Button onClick={handleSave} disabled={saving} size="lg">
                {saving ? 'Guardando...' : (
                  <>
                    <Save size={18} className="mr-2" /> Guardar Preferencias
                  </>
                )}
              </Button>
            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default SubscriptionsPage;
