
import React, { useState, useEffect, useCallback } from 'react';
import { Search, SlidersHorizontal, Loader2, FileSearch } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ReformaCard from '@/components/ReformaCard.jsx';
import FilterSidebar from '@/components/FilterSidebar.jsx';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

const ReformasPage = () => {
  const [reformas, setReformas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    fuente: '',
    nivel: '',
    materia_legal: ''
  });

  const fetchReformas = useCallback(async (currentPage = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      
      const filterConditions = [];
      if (searchTerm) filterConditions.push(`titulo ~ "${searchTerm}"`);
      if (filters.fuente) filterConditions.push(`fuente = "${filters.fuente}"`);
      if (filters.nivel) filterConditions.push(`nivel = "${filters.nivel}"`);
      if (filters.materia_legal) filterConditions.push(`materia_legal = "${filters.materia_legal}"`);

      const filterString = filterConditions.join(' && ');

      const result = await pb.collection('reformas').getList(currentPage, 12, {
        sort: '-fecha_publicacion',
        filter: filterString,
        $autoCancel: false
      });

      if (append) {
        setReformas(prev => [...prev, ...result.items]);
      } else {
        setReformas(result.items);
      }
      setTotalPages(result.totalPages);
      setPage(currentPage);
    } catch (err) {
      console.error('Error fetching reformas:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, filters]);

  useEffect(() => {
    // Reset page to 1 when filters or search change
    const debounceTimer = setTimeout(() => {
      fetchReformas(1, false);
    }, 400); // 400ms debounce for search

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, filters, fetchReformas]);

  const loadMore = () => {
    if (page < totalPages) {
      fetchReformas(page + 1, true);
    }
  };

  const clearFilters = () => {
    setFilters({ fuente: '', nivel: '', materia_legal: '' });
    setSearchTerm('');
  };

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Header />

      <div className="bg-secondary text-secondary-foreground border-b">
        <div className="container mx-auto px-4 max-w-7xl py-12 md:py-16">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 font-serif">Catálogo de Reformas</h1>
          <p className="text-secondary-foreground/80 text-lg max-w-2xl">
            Explora la base de datos de iniciativas, decretos y publicaciones oficiales. Utiliza los filtros para encontrar información específica.
          </p>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 max-w-7xl py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block lg:col-span-1 h-[calc(100vh-200px)] sticky top-24">
            <FilterSidebar 
              filters={filters} 
              setFilters={setFilters} 
              onClear={clearFilters}
            />
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Search Bar & Mobile Filters */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                <Input
                  type="text"
                  placeholder="Buscar por título, palabra clave..."
                  className="pl-10 h-12 text-base shadow-sm text-foreground bg-card"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Sheet>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="outline" className="h-12 px-4 shadow-sm border-border bg-card">
                    <SlidersHorizontal size={20} className="mr-2" />
                    Filtros
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
                  <FilterSidebar 
                    filters={filters} 
                    setFilters={setFilters} 
                    onClear={clearFilters}
                  />
                </SheetContent>
              </Sheet>
            </div>

            {/* Results */}
            {loading && reformas.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-card border rounded-xl p-6 h-[250px] flex flex-col">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-5/6 mb-6" />
                  </div>
                ))}
              </div>
            ) : reformas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-muted/30 rounded-2xl border border-dashed">
                <FileSearch size={64} className="text-muted-foreground/50 mb-6" />
                <h3 className="text-xl font-bold mb-2">No se encontraron resultados</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Intenta ajustar los filtros de búsqueda o cambiar las palabras clave para encontrar lo que necesitas.
                </p>
                <Button variant="outline" onClick={clearFilters}>Limpiar Filtros</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reformas.map(reforma => (
                    <ReformaCard key={reforma.id} reforma={reforma} />
                  ))}
                </div>

                {page < totalPages && (
                  <div className="mt-8 flex justify-center">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      onClick={loadMore} 
                      disabled={loading}
                      className="min-w-[200px]"
                    >
                      {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : 'Cargar más resultados'}
                    </Button>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReformasPage;
