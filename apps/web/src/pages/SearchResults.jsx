
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ArrowRight } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import pb from '@/lib/pocketbaseClient';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      setLoading(true);
      try {
        const records = await pb.collection('reformas').getList(1, 50, {
          filter: `titulo ~ "${query}" || contenido ~ "${query}"`,
          $autoCancel: false
        });
        
        const formattedResults = records.items.map(record => {
          // Simple context extraction
          const contentLower = record.contenido.toLowerCase();
          const queryLower = query.toLowerCase();
          const index = contentLower.indexOf(queryLower);
          let contexto = record.contenido.substring(0, 150) + '...';
          
          if (index !== -1) {
            const start = Math.max(0, index - 50);
            const end = Math.min(record.contenido.length, index + query.length + 50);
            contexto = (start > 0 ? '...' : '') + record.contenido.substring(start, end) + '...';
          }

          return {
            id: record.id + '_res',
            reforma_id: record.id,
            tipo_resultado: 'texto',
            texto_encontrado: query,
            contexto: contexto,
            posicion: index,
            relevancia: 1,
            reforma: record
          };
        });
        
        setResults(formattedResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  const handleResultClick = (result) => {
    navigate(`/reforma/${result.reforma_id}`, {
      state: { searchResult: result }
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Resultados de búsqueda - Portal de Reformas Legales</title>
      </Helmet>
      <Header />
      
      <main className="flex-grow bg-secondary/30 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-6">Buscar Reformas</h1>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                placeholder="Buscar por palabra clave, materia, etc..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-grow bg-background text-foreground"
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" /> Buscar
              </Button>
            </form>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Buscando resultados...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {query && results.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No se encontraron resultados para "{query}"
                  </CardContent>
                </Card>
              )}
              
              {results.map((result) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleResultClick(result)}>
                  <CardHeader>
                    <CardTitle className="text-lg text-primary hover:underline">
                      {result.reforma.titulo}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      {result.contexto}
                    </p>
                    <div className="flex items-center text-sm font-medium text-primary">
                      Ver documento completo <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SearchResults;
