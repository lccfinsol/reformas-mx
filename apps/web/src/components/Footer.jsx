
import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Twitter, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-auto border-t">
      <div className="container mx-auto px-4 max-w-7xl py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <BookOpen size={24} className="text-primary" />
              <span className="font-semibold text-xl tracking-tight">
                Reformas Legales
              </span>
            </Link>
            <p className="text-secondary-foreground/80 leading-relaxed max-w-sm mb-6">
              El sistema más avanzado para el seguimiento de reformas legislativas en México. Notificaciones en tiempo real, búsqueda inteligente y cobertura nacional.
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Twitter" className="text-secondary-foreground/60 hover:text-primary transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" aria-label="LinkedIn" className="text-secondary-foreground/60 hover:text-primary transition-colors">
                <Linkedin size={20} />
              </a>
              <a href="mailto:contacto@reformaslegales.mx" aria-label="Email" className="text-secondary-foreground/60 hover:text-primary transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          <div>
            <span className="font-semibold text-lg mb-4 block font-serif">Plataforma</span>
            <ul className="space-y-3">
              <li>
                <Link to="/reformas" className="text-secondary-foreground/70 hover:text-primary transition-colors">Catálogo de Reformas</Link>
              </li>
              <li>
                <Link to="/buscar" className="text-secondary-foreground/70 hover:text-primary transition-colors">Búsqueda Avanzada</Link>
              </li>
              <li>
                <Link to="/suscripciones" className="text-secondary-foreground/70 hover:text-primary transition-colors">Suscripciones Temáticas</Link>
              </li>
            </ul>
          </div>

          <div>
            <span className="font-semibold text-lg mb-4 block font-serif">Legal</span>
            <ul className="space-y-3">
              <li>
                <Link to="/acerca-de" className="text-secondary-foreground/70 hover:text-primary transition-colors">Sobre Nosotros</Link>
              </li>
              <li>
                <a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors">Aviso de Privacidad</a>
              </li>
              <li>
                <a href="#" className="text-secondary-foreground/70 hover:text-primary transition-colors">Términos de Servicio</a>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-secondary-foreground/60">
          <p>© {new Date().getFullYear()} Reformas Legales México. Todos los derechos reservados.</p>
          <p>Información pública procesada mediante tecnologías de automatización.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
