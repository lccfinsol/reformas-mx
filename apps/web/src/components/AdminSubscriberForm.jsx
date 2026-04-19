
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient';
import { toast } from 'sonner';

const AdminSubscriberForm = ({ open, onOpenChange, subscriber, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre_completo: subscriber?.nombre_completo || '',
    numero_telefono: subscriber?.numero_telefono || '',
    pais_codigo: subscriber?.pais_codigo || 'MX',
  });

  // Re-initialize when subscriber changes
  React.useEffect(() => {
    if (subscriber && open) {
      setFormData({
        nombre_completo: subscriber.nombre_completo || '',
        numero_telefono: subscriber.numero_telefono || '',
        pais_codigo: subscriber.pais_codigo || 'MX',
      });
    }
  }, [subscriber, open]);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subscriber?.id) return;
    
    setLoading(true);
    try {
      const response = await apiServerClient.fetch(`/admin/subscribers/${subscriber.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update subscriber');
      }
      
      toast.success('Suscriptor actualizado correctamente');
      onSuccess && onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating subscriber:', error);
      toast.error(error.message || 'Error al actualizar el suscriptor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Suscriptor</DialogTitle>
          <DialogDescription>
            Actualiza los datos de contacto. Los cambios afectarán su información general.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_completo">Nombre Completo</Label>
            <Input
              id="nombre_completo"
              name="nombre_completo"
              value={formData.nombre_completo}
              onChange={handleChange}
              className="text-foreground"
              required
            />
          </div>
          
          <div className="grid grid-cols-[100px_1fr] gap-4">
            <div className="space-y-2">
              <Label htmlFor="pais_codigo">Código País</Label>
              <Input
                id="pais_codigo"
                name="pais_codigo"
                value={formData.pais_codigo}
                onChange={handleChange}
                placeholder="MX"
                className="text-foreground uppercase"
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_telefono">Teléfono</Label>
              <Input
                id="numero_telefono"
                name="numero_telefono"
                value={formData.numero_telefono}
                onChange={handleChange}
                placeholder="+521234567890"
                className="text-foreground"
                type="tel"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Incluye el código de país (ej. +52) en el número de teléfono si es internacional.
          </p>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSubscriberForm;
