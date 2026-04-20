
import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar, Building2, Tag, ChevronRight, Bookmark, BookmarkCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/hooks/useFavorites.js';

const ReformaCard = ({ reforma }) => {
  const { isFavorite, toggleFavorite, loading } = useFavorites(reforma.id);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!loading) {
      await toggleFavorite();
    }
  };

  return (
    <div className="group relative flex flex-col bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="p-6 flex-1 flex flex-col">
        
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-medium">
              {reforma.fuente}
            </Badge>
            {reforma.nivel && (
              <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                {reforma.nivel}
              </Badge>
            )}
            {reforma.materia_legal && (
              <Badge variant="outline" className="text-muted-foreground border-muted-foreground/30">
                {reforma.materia_legal}
              </Badge>
            )}
          </div>
          
          <button 
            onClick={handleToggleFavorite}
            disabled={loading}
            className="text-muted-foreground hover:text-primary transition-colors p-1"
            aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
          >
            {isFavorite ? (
              <BookmarkCheck size={22} className="fill-primary text-primary" />
            ) : (
              <Bookmark size={22} />
            )}
          </button>
        </div>

        <Link to={`/reforma/${reforma.id}`} className="group-hover:text-primary transition-colors">
          <h3 className="text-xl font-bold font-serif leading-snug mb-3 line-clamp-3">
            {reforma.titulo}
          </h3>
        </Link>

        <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-1">
          {reforma.descripcion_corta || reforma.contenido?.substring(0, 150) + '...'}
        </p>

        <div className="flex items-center justify-between mt-auto pt-4 border-t">
          <div className="flex items-center text-sm text-muted-foreground gap-4">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>{format(new Date(reforma.fecha_publicacion), 'dd/MM/yyyy')}</span>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 group-hover:translate-x-1 transition-all" asChild>
            <Link to={`/reforma/${reforma.id}`}>
              Ver Detalles <ChevronRight size={16} className="ml-1" />
            </Link>
          </Button>
        </div>
        
      </div>
    </div>
  );
};

export default ReformaCard;
