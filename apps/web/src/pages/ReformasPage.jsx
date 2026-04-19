
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ReformaCard from '@/components/ReformaCard.jsx';
import FilterSidebar from '@/components/FilterSidebar.jsx';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';

const ReformasPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [reformas, setReformas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    nivel: searchParams.get('nivel') ? [searchParams.get('nivel')] : [],
    fuente: [],
    materia_legal: searchParams.get('materia') ? [searchParams.get('materia')] : []
  });

  const fetchReformas = useCallback(async () => {
    setLoading(true);
    try {
      const filterParts = [];
      
      if (searchTerm) {
        filterParts.push(`(titulo ~ "${searchTerm}" || contenido ~ "${searchTerm}" || descripcion_corta ~ "${searchTerm}")`);
      }
      
      if (filters.nivel.length > 0) {
        const nivelFilter = filters.nivel.map(n => `nivel = "${n}"`).join(' || ');
        filterParts.push(`(${nivelFilter})`);
      }
      
      if (filters.fuente.length > 0) {
        const fuenteFilter = filters.fuente.map(f => `fuente = "${f}"`).join(' || ');
        filterParts.push(`(${fuenteFilter})`);
      }
      
      if (filters.materia_legal.length > 0) {
        const materiaFilter = filters.materia_legal.map(m => `materia_legal = "${m}"`).join(' || ');
        filterParts.push(`(${materiaFilter})`);
      }

      const filterString = filterParts.length > 0 ? filterParts.join(' && ') : '';

      const records = await pb.collection('reformas').getList(1, 50, {
        filter: filterString,
        sort: '-fecha_publicacion',
        $autoCancel: false
      });
      
      setReformas(records.items);
    } catch (error) {
      console.error('Error fetching reformas:', error);
      toast.error('Error al cargar reformas');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchReformas();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchReformas]);

  const handleFilterChange = (key, values) => {
    setFilters(prev => ({ ...prev, [key]: values }));
  };

  const handleClearFilters = () => {
    setFilters({
      nivel: [],
      fuente: [],
      materia_legal: []
    });
    setSearchTerm('');
    setSearchParams({});
  };

  const hasActiveFilters = searchTerm || Object.values(filters).some(arr => arr.length > 0);

  return (
    <>
      <Helmet>
        <title>Catálogo de reformas legales - Portal de Reformas Legales</title>
        <meta name="description" content="Explora nuestro catálogo completo de reformas legales federales, estatales y municipales. Busca y filtra por materia legal, nivel y fuente." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-grow">
          <div className="bg-secondary py-12 border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{letterSpacing: '-0.02em'}}>
                Catálogo de reformas
              </h1>
              <p className="text-muted-foreground text-lg">
                Explora {reformas.length} reformas legales registradas
              </p>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid lg:grid-cols-4 gap-8">
              <aside className="lg:col-span-1">
                <div className="sticky top-24">
                  <FilterSidebar
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                  />
                </div>
              </aside>

              <main className="lg:col-span-3">
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por título o contenido..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                      >
                        <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                  {hasActiveFilters && (
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {reformas.length} resultado{reformas.length !== 1 ? 's' : ''} encontrado{reformas.length !== 1 ? 's' : ''}
                      </p>
                      <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                        Limpiar filtros
                      </Button>
                    </div>
                  )}
                </div>

                {loading ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-80 bg-muted rounded-xl animate-pulse"></div>
                    ))}
                  </div>
                ) : reformas.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {reformas.map(reforma => (
                      <ReformaCard key={reforma.id} reforma={reforma} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-muted rounded-xl">
                    <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No se encontraron reformas</h3>
                    <p className="text-muted-foreground mb-6">
                      Intenta ajustar tus filtros o realizar una nueva búsqueda
                    </p>
                    <Button onClick={handleClearFilters}>Limpiar filtros</Button>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default ReformasPage;
