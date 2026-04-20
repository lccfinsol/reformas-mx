
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, BookOpen, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Reformas', path: '/reformas' }
  ];

  if (isAuthenticated) {
    navLinks.push({ name: 'Notificaciones', path: '/notificaciones' });
    navLinks.push({ name: 'Suscripciones', path: '/suscripciones' });
    navLinks.push({ name: 'Mi Panel', path: '/dashboard' });
  }

  const NavItems = ({ mobile = false }) => (
    <>
      {navLinks.map((link) => {
        const isActive = location.pathname === link.path;
        return (
          <Link
            key={link.path}
            to={link.path}
            className={`transition-colors duration-200 font-bold ${
              isActive 
                ? 'text-primary' 
                : 'text-foreground/70 hover:text-primary'
            } ${mobile ? 'block py-3 text-lg border-b' : 'text-sm'}`}
          >
            {link.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:scale-105 transition-transform">
              <BookOpen size={20} />
            </div>
            <span className="font-bold text-lg tracking-tight hidden sm:inline-block text-foreground">
              Reformas Legales
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-6">
            <NavItems />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/buscar" className="hidden sm:flex text-muted-foreground hover:text-foreground transition-colors p-2">
            <Search size={20} />
            <span className="sr-only">Buscar</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/notificaciones" className="text-muted-foreground hover:text-foreground p-2 relative transition-colors">
                <Bell size={20} />
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout} className="hidden sm:inline-flex font-bold">
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="font-bold">
                <Link to="/login">Iniciar Sesión</Link>
              </Button>
              <Button size="sm" asChild className="font-bold">
                <Link to="/registro">Registrarse</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="-mr-2">
                <Menu size={24} />
                <span className="sr-only">Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col h-full mt-6">
                <nav className="flex flex-col gap-2">
                  <NavItems mobile />
                </nav>
                <div className="mt-auto pb-8 flex flex-col gap-3">
                  {!isAuthenticated ? (
                    <>
                      <Button variant="outline" className="w-full justify-center font-bold" asChild>
                        <Link to="/login">Iniciar Sesión</Link>
                      </Button>
                      <Button className="w-full justify-center font-bold" asChild>
                        <Link to="/registro">Registrarse</Link>
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" className="w-full justify-center font-bold text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground" onClick={handleLogout}>
                      Cerrar Sesión
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  );
};

export default Header;
