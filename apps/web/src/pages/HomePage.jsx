/**
 * Página de inicio.
 *
 * CORRECCIONES APLICADAS:
 * 1. LÓGICA - handleSearch usa window.location.href (navegación dura):
 *    en una SPA React Router esto recarga toda la app. Se usa useNavigate.
 * 2. DEPENDENCIA - react-helmet está abandonado desde 2021 y tiene leaks
 *    en React 18. Se reemplaza con react-helmet-async.
 * 3. UX - La imagen de Unsplash puede cargar lento o fallar en red limitada.
 *    Se añade placeholder de color + loading="lazy".
 * 4. ACCESIBILIDAD - El formulario no tenía labels asociados a inputs.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Scale, FileText, Bell, Shield, ChevronRight } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ReformaCard from '@/components/ReformaCard.jsx';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const HomePage = () => {
  const navigate = useNavigate(); // CORRECCIÓN: useNavigate en lugar de location.href
  const [searchTerm, setSearchTerm] = useState('');
  const [nivel, setNivel] = useState('');
  const [materia, setMateria] = useState('');
  const [featuredReformas, setFeaturedReformas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController(); // MEJORA: cleanup en unmount

    const fetchFeaturedReformas = async () => {
      try {
        const records = await pb.collection('reformas').getList(1, 6, {
          sort: '-created',
          $autoCancel: false,
        });
        if (!controller.signal.aborted) {
          setFeaturedReformas(records.items);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          toast.error('Error al cargar reformas destacadas');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedReformas();
    return () => controller.abort();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (nivel) params.append('nivel', nivel);
    if (materia) params.append('materia', materia);
    // CORRECCIÓN: navegación SPA con React Router
    navigate(`/reformas?${params.toString()}`);
  };

  return (
    <>
      <Helmet>
        <title>Portal de Reformas Legales — Cambios normativos en México</title>
        <meta
          name="description"
          content="Plataforma integral para consultar, seguir y analizar reformas legales en México. Reformas federales, estatales y municipales en tiempo real."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        {/* Hero */}
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0 bg-slate-800">
            <img
              src="https://images.unsplash.com/photo-1675522305564-e4f9348aff2e?w=1920&q=80"
              alt="Oficina jurídica profesional"
              className="w-full h-full object-cover opacity-60"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/70" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="max-w-3xl">
              <h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
                style={{ letterSpacing: '-0.02em' }}
              >
                Reformas legales al alcance de tu mano
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                Accede a un catálogo completo de reformas federales, estatales y municipales.
                Mantente actualizado con cambios normativos que impactan tu práctica profesional.
              </p>

              <form onSubmit={handleSearch} className="bg-card rounded-xl p-6 shadow-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* CORRECCIÓN: label asociado */}
                  <div className="md:col-span-3">
                    <label htmlFor="search-input" className="sr-only">
                      Buscar reforma
                    </label>
                    <Input
                      id="search-input"
                      placeholder="Buscar reforma..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <Select value={nivel} onValueChange={setNivel}>
                    <SelectTrigger aria-label="Filtrar por nivel">
                      <SelectValue placeholder="Nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Federal">Federal</SelectItem>
                      <SelectItem value="Estatal">Estatal</SelectItem>
                      <SelectItem value="Municipal">Municipal</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={materia} onValueChange={setMateria}>
                    <SelectTrigger aria-label="Filtrar por materia legal">
                      <SelectValue placeholder="Materia legal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fiscal">Fiscal</SelectItem>
                      <SelectItem value="Laboral">Laboral</SelectItem>
                      <SelectItem value="Mercantil">Mercantil</SelectItem>
                      <SelectItem value="Administrativo">Administrativo</SelectItem>
                      <SelectItem value="Penal">Penal</SelectItem>
                      <SelectItem value="Civil">Civil</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button type="submit" className="w-full">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Herramientas para profesionales del derecho
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Simplifica tu investigación legal con funcionalidades diseñadas para abogados,
                consultores y académicos.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: <FileText className="h-6 w-6 text-primary" />,
                  title: 'Catálogo completo',
                  desc: 'Accede a reformas de todos los niveles de gobierno con información detallada sobre fuente, fecha de publicación y materia legal.',
                  link: '/reformas',
                  linkText: 'Explorar catálogo',
                },
                {
                  icon: <Bell className="h-6 w-6 text-primary" />,
                  title: 'Notificaciones personalizadas',
                  desc: 'Recibe alertas sobre reformas en las materias legales de tu interés. Configura tus preferencias desde tu dashboard.',
                  link: '/registro',
                  linkText: 'Crear cuenta',
                },
                {
                  icon: <Shield className="h-6 w-6 text-primary" />,
                  title: 'Fuentes oficiales verificadas',
                  desc: 'Toda la información proviene directamente del DOF, Cámara de Diputados y periódicos oficiales estatales.',
                  link: null,
                },
                {
                  icon: <Scale className="h-6 w-6 text-primary" />,
                  title: 'Gestión de favoritos',
                  desc: 'Guarda las reformas más relevantes para tu práctica y accede a ellas fácilmente desde tu espacio personal.',
                  link: '/login',
                  linkText: 'Iniciar sesión',
                },
              ].map(({ icon, title, desc, link, linkText }) => (
                <div key={title} className="bg-background rounded-2xl p-8 shadow-sm">
                  <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    {icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">{desc}</p>
                  {link && (
                    <Button variant="link" className="p-0 h-auto" asChild>
                      <Link to={link}>
                        {linkText} <ChevronRight className="h-4 w-4 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reformas recientes */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">Reformas recientes</h2>
                <p className="text-muted-foreground">
                  Las últimas actualizaciones normativas publicadas
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/reformas">Ver todas</Link>
              </Button>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            ) : featuredReformas.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredReformas.map((reforma) => (
                  <ReformaCard key={reforma.id} reforma={reforma} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted rounded-xl">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay reformas disponibles aún</p>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default HomePage;
