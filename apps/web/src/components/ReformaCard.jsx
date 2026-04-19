
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Calendar, FileText, Building2 } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import { format } from 'date-fns';

const ReformaCard = ({ reforma }) => {
  const { isAuthenticated } = useAuth();
  const { isFavorited, addFavorite, removeFavorite } = useFavorites();
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const favorited = isFavorited(reforma.id);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para guardar favoritos');
      return;
    }

    setIsTogglingFavorite(true);
    try {
      if (favorited) {
        await removeFavorite(reforma.id);
        toast.success('Eliminado de favoritos');
      } else {
        await addFavorite(reforma.id);
        toast.success('Agregado a favoritos');
      }
    } catch (error) {
      toast.error('Error al actualizar favoritos');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const getMateriaColor = (materia) => {
    const colors = {
      'Fiscal': 'bg-blue-100 text-blue-800',
      'Laboral': 'bg-green-100 text-green-800',
      'Mercantil': 'bg-purple-100 text-purple-800',
      'Administrativo': 'bg-orange-100 text-orange-800',
      'Penal': 'bg-red-100 text-red-800',
      'Civil': 'bg-indigo-100 text-indigo-800',
      'Otro': 'bg-gray-100 text-gray-800'
    };
    return colors[materia] || colors['Otro'];
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap gap-2">
            {reforma.materia_legal && (
              <Badge className={getMateriaColor(reforma.materia_legal)}>
                {reforma.materia_legal}
              </Badge>
            )}
            {reforma.nivel && (
              <Badge variant="outline">{reforma.nivel}</Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            disabled={isTogglingFavorite}
            className="shrink-0"
          >
            <Heart
              className={`h-5 w-5 transition-all ${
                favorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
              }`}
            />
          </Button>
        </div>
        <CardTitle className="line-clamp-2 text-xl">
          <Link to={`/reforma/${reforma.id}`} className="hover:text-primary transition-colors">
            {reforma.titulo}
          </Link>
        </CardTitle>
        {reforma.descripcion_corta && (
          <CardDescription className="line-clamp-2">
            {reforma.descripcion_corta}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(reforma.fecha_publicacion), 'dd/MM/yyyy')}</span>
          </div>
          {reforma.fuente && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="line-clamp-1">{reforma.fuente}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button asChild className="w-full" variant="outline">
          <Link to={`/reforma/${reforma.id}`}>Ver detalles</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReformaCard;
