
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { BookOpen, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.passwordConfirm) {
      toast.error('Las contraseñas no coinciden', {
        description: 'Por favor verifica que hayas escrito la misma contraseña.'
      });
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Contraseña muy corta', {
        description: 'La contraseña debe tener al menos 8 caracteres.'
      });
      return;
    }

    setLoading(true);
    
    try {
      await signup({
        email: formData.email,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
        name: formData.name,
      });
      toast.success('Cuenta creada correctamente', {
        description: 'Bienvenido al sistema de reformas legales.'
      });
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.email?.message || 'Revisa los datos e inténtalo de nuevo.';
      toast.error('Error al crear la cuenta', {
        description: message
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-muted/30">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Link to="/" className="flex items-center gap-2 mb-8 group">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl group-hover:scale-105 transition-transform shadow-md">
            <BookOpen size={28} />
          </div>
        </Link>
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-foreground font-serif">
          Crear Cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
            Inicia sesión aquí
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-xl shadow-black/5 sm:rounded-2xl sm:px-10 border border-border/50">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Lic. Juan Pérez"
                className="text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@correo.com"
                className="text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                className="text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirmar Contraseña</Label>
              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                required
                value={formData.passwordConfirm}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
                className="text-foreground"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-base mt-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Crear Cuenta Gratis'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
