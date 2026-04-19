
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Scale, Menu, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import NotificationBell from '@/components/NotificationBell.jsx';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { path: '/', label: 'Inicio' },
    { path: '/reformas', label: 'Catálogo' },
    { path: '/acerca-de', label: 'Acerca de' }
  ];

  return (
    <header className="border-b bg-[#90CAF9] sticky top-0 z-50 backdrop-blur-sm bg-[#90CAF9]/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
            <Scale className="h-6 w-6 text-primary" />
            <span className="font-serif">Portal de Reformas Legales</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors hover:text-primary relative ${
                  isActive(link.path) ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {link.label}
                {isActive(link.path) && (
                  <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-primary" />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Iniciar sesión</Link>
                </Button>
                <Button asChild>
                  <Link to="/registro">Registrarse</Link>
                </Button>
              </>
            ) : (
              <>
                <NotificationBell />
                {isAdmin && (
                  <Button variant="secondary" className="font-medium text-primary hover:text-primary/90" asChild>
                    <Link to="/admin">
                      <ShieldAlert className="h-4 w-4 mr-2" />
                      Panel Admin
                    </Link>
                  </Button>
                )}
                {!isAdmin && (
                  <Button variant="outline" asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                )}
                <Button variant="outline" asChild>
                  <Link to="/subscriptions">Suscripciones</Link>
                </Button>
                <Button variant="ghost" onClick={handleLogout}>
                  Cerrar sesión
                </Button>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-4">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.path) ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {!isAuthenticated ? (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Iniciar sesión
                    </Button>
                  </Link>
                  <Link to="/registro" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full justify-start">Registrarse</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/notifications" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      Notificaciones
                    </Button>
                  </Link>
                  {isAdmin ? (
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="secondary" className="w-full justify-start text-primary">
                        <ShieldAlert className="h-4 w-4 mr-2" />
                        Panel Admin
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full justify-start">
                        Dashboard
                      </Button>
                    </Link>
                  )}
                  <Link to="/subscriptions" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      Suscripciones
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
