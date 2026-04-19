
import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-6 w-6 text-primary" />
              <span className="font-serif font-semibold text-lg">Portal de Reformas Legales</span>
            </div>
            <p className="text-sm leading-relaxed">
              Plataforma integral para consultar, seguir y analizar reformas legales en México.
              Mantente informado sobre cambios normativos federales, estatales y municipales.
            </p>
          </div>

          <div>
            <h3 className="font-serif font-semibold mb-4">Enlaces rápidos</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-sm hover:text-primary transition-colors">
                Inicio
              </Link>
              <Link to="/reformas" className="text-sm hover:text-primary transition-colors">
                Catálogo de reformas
              </Link>
              <Link to="/acerca-de" className="text-sm hover:text-primary transition-colors">
                Acerca de
              </Link>
              <Link to="/login" className="text-sm hover:text-primary transition-colors">
                Iniciar sesión
              </Link>
            </nav>
          </div>

          <div>
            <h3 className="font-serif font-semibold mb-4">Contacto</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-primary" />
                <span>contacto@reformaslegales.mx</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-primary" />
                <span>+52 55 1234 5678</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Ciudad de México, México</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p>&copy; 2026 Portal de Reformas Legales. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <Link to="#" className="hover:text-primary transition-colors">
              Política de privacidad
            </Link>
            <Link to="#" className="hover:text-primary transition-colors">
              Términos de servicio
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
