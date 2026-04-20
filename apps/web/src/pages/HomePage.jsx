
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Zap, Bell, ShieldCheck, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReformaCard from '@/components/ReformaCard.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import pb from '@/lib/pocketbaseClient.js';
import { Skeleton } from '@/components/ui/skeleton';
import FilterSidebar from '@/components/FilterSidebar.jsx';

const HomePage = () => {
  const [reformas, setReformas] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    keyword: '',
    nivel: 'Todos',
    materia: 'Todas',
    dateRange: 'all',
    customStart: '',
    customEnd: ''
  });

  const fetchReformas = async (currentFilters) => {
    setLoading(true);
    try {
      let filterConditions = [];
      
      if (currentFilters.keyword && currentFilters.keyword.trim() !== '') {
        filterConditions.push(`(titulo ~ "${currentFilters.keyword}" || contenido ~ "${currentFilters.keyword}")`);
      }
      
      if (currentFilters.nivel && currentFilters.nivel !== 'Todos') {
        filterConditions.push(`nivel = "${currentFilters.nivel}"`);
      }
      
      if (currentFilters.materia && currentFilters.materia !== 'Todas') {
        filterConditions.push(`materia_legal = "${currentFilters.materia}"`);
      }
      
      if (currentFilters.dateRange && currentFilters.dateRange !== 'all') {
        const today = new Date();
        let startDate = new Date();
        
        if (currentFilters.dateRange === '7') {
          startDate.setDate(today.getDate() - 7);
        } else if (currentFilters.dateRange === '30') {
          startDate.setDate(today.getDate() - 30);
        } else if (currentFilters.dateRange === '90') {
          startDate.setDate(today.getDate() - 90);
        } else if (currentFilters.dateRange === 'custom') {
          if (currentFilters.customStart) startDate = new Date(currentFilters.customStart);
          else startDate = null;
        }
        
        if (startDate) {
          filterConditions.push(`fecha_publicacion >= "${startDate.toISOString().split('T')[0]} 00:00:00.000Z"`);
        }
        
        if (currentFilters.dateRange === 'custom' && currentFilters.customEnd) {
          const endDate = new Date(currentFilters.customEnd);
          endDate.setDate(endDate.getDate() + 1); // up to the end of the day
          filterConditions.push(`fecha_publicacion < "${endDate.toISOString().split('T')[0]} 00:00:00.000Z"`);
        }
      }

      const finalFilterString = filterConditions.join(' && ');

      const records = await pb.collection('reformas').getList(1, 12, {
        sort: '-fecha_publicacion',
        filter: finalFilterString,
        $autoCancel: false
      });
      
      setReformas(records.items);
      setTotalItems(records.totalItems);
    } catch (err) {
      console.error('Error fetching reformas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReformas(filters);
  }, [filters]);

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleClearFilters = (clearedFilters) => {
    setFilters(clearedFilters);
  };

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden bg-[#f8fafc] dark:bg-[#0a0f1c]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20 mb-6">
                  Plataforma de Inteligencia Legal
                </span>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-balance">
                  Reformas legales al alcance de tu mano
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl">
                  Monitorea, analiza y recibe notificaciones en tiempo real sobre cambios legislativos a nivel federal y estatal. La fuente confiable para profesionales del derecho en México.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="text-base px-8 h-14 rounded-full shadow-lg shadow-primary/20" asChild>
                    <a href="#directorio">Explorar Directorio</a>
                  </Button>
                  <Button size="lg" variant="outline" className="text-base px-8 h-14 rounded-full bg-background/50 backdrop-blur" asChild>
                    <Link to="/registro">Crear Cuenta Gratis</Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Feature Spotlight: Zig-Zag Layout */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Herramientas diseñadas para el rigor jurídico</h2>
              <p className="text-lg text-muted-foreground text-balance">
                Olvídate de revisar manualmente múltiples diarios oficiales. Nuestro sistema automatizado centraliza y clasifica la información que necesitas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center mb-24">
              <div className="order-2 md:order-1 relative">
                <div className="absolute inset-0 bg-primary/5 rounded-3xl translate-x-4 translate-y-4 -z-10" />
                <div className="bg-card border rounded-3xl p-8 shadow-xl">
                  <div className="flex flex-col gap-4">
                    <div className="h-12 w-3/4 bg-muted rounded-md" />
                    <div className="h-4 w-full bg-muted rounded-md" />
                    <div className="h-4 w-5/6 bg-muted rounded-md" />
                    <div className="h-4 w-4/6 bg-muted rounded-md" />
                    <div className="flex gap-2 mt-4">
                      <div className="h-8 w-24 bg-primary/20 rounded-full" />
                      <div className="h-8 w-24 bg-secondary rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="h-14 w-14 bg-primary/10 flex items-center justify-center rounded-2xl mb-6 text-primary">
                  <Search size={28} />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Búsqueda avanzada y filtros precisos</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Localiza iniciativas y decretos específicos utilizando palabras clave, nivel de gobierno, o materia legal. Nuestro motor de búsqueda indexa el contenido completo de los documentos para resultados exactos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
              <div>
                <div className="h-14 w-14 bg-primary/10 flex items-center justify-center rounded-2xl mb-6 text-primary">
                  <Bell size={28} />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">Notificaciones en tiempo real</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Configura alertas personalizadas sobre las materias que impactan a tus clientes. Recibe avisos inmediatos vía correo electrónico o en tu panel cuando se publique un cambio relevante en el DOF o periódicos estatales.
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-accent/5 rounded-3xl -translate-x-4 translate-y-4 -z-10" />
                <div className="bg-card border rounded-3xl p-8 shadow-xl flex flex-col gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4 items-start pb-6 border-b last:border-0 last:pb-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap size={18} className="text-primary" />
                      </div>
                      <div>
                        <div className="h-5 w-48 bg-muted rounded-md mb-2" />
                        <div className="h-3 w-32 bg-muted/60 rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Directory Section (Search and Filters) */}
        <section id="directorio" className="py-24 bg-muted/30 border-t scroll-mt-16">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Directorio de Reformas</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Busca y filtra entre miles de documentos legales publicados para encontrar exactamente la información que necesitas.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              {/* Sidebar Filters */}
              <div className="lg:col-span-1 sticky top-24">
                <FilterSidebar 
                  initialFilters={filters} 
                  onApply={handleApplyFilters} 
                  onClear={handleClearFilters} 
                />
              </div>

              {/* Results Area */}
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-foreground">Resultados</h3>
                  {!loading && (
                    <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                      {totalItems} {totalItems === 1 ? 'documento encontrado' : 'documentos encontrados'}
                    </span>
                  )}
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="bg-card border rounded-2xl p-6 h-[280px] flex flex-col">
                        <Skeleton className="h-6 w-3/4 mb-4" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-5/6 mb-6" />
                        <div className="mt-auto flex justify-between">
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : reformas.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
                    {reformas.map(reforma => (
                      <ReformaCard key={reforma.id} reforma={reforma} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-card border border-dashed rounded-3xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
                      <FileText size={36} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">No se encontraron resultados</h3>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto">
                      No hay reformas que coincidan con los filtros actuales. Intenta modificar tus términos de búsqueda o ampliar el rango de fechas.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-8 font-bold px-8 h-12 rounded-full" 
                      onClick={() => handleClearFilters({
                        keyword: '', nivel: 'Todos', materia: 'Todas', dateRange: 'all', customStart: '', customEnd: ''
                      })}
                    >
                      Restablecer todos los filtros
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 mix-blend-multiply pointer-events-none" />
          <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
            <ShieldCheck size={48} className="mx-auto mb-6 text-primary-foreground/80" />
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance">
              Garantiza la certeza jurídica de tus operaciones
            </h2>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto">
              Únete a cientos de despachos y corporativos que confían en nuestra plataforma para el monitoreo normativo diario.
            </p>
            <Button size="lg" variant="secondary" className="text-primary px-8 h-14 rounded-full text-lg font-bold shadow-xl transition-transform active:scale-95" asChild>
              <Link to="/registro">Comenzar Prueba Gratuita</Link>
            </Button>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
