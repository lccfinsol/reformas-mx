
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Heart, Bell, User, Trash2, Save } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useFavorites } from '@/hooks/useFavorites.js';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

const DashboardPage = () => {
  const { currentUser, updateProfile } = useAuth();
  const { favorites, loading: favoritesLoading, refetch } = useFavorites();
  const [reformasData, setReformasData] = useState([]);
  const [loadingReformas, setLoadingReformas] = useState(true);
  const [suscripcion, setSuscripcion] = useState(null);
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(true);
  const [selectedCategorias, setSelectedCategorias] = useState([]);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [profileData, setProfileData] = useState({
    nombre: currentUser?.nombre || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const categorias = ['Fiscal', 'Laboral', 'Mercantil', 'Administrativo', 'Penal', 'Civil', 'Otro'];

  useEffect(() => {
    const fetchFavoriteReformas = async () => {
      if (favorites.length === 0) {
        setReformasData([]);
        setLoadingReformas(false);
        return;
      }

      try {
        const reformaIds = favorites.map(fav => fav.reforma_id);
        const filter = reformaIds.map(id => `id = "${id}"`).join(' || ');
        
        const records = await pb.collection('reformas').getFullList({
          filter: filter,
          $autoCancel: false
        });
        
        setReformasData(records);
      } catch (error) {
        console.error('Error fetching favorite reformas:', error);
        toast.error('Error al cargar reformas favoritas');
      } finally {
        setLoadingReformas(false);
      }
    };

    fetchFavoriteReformas();
  }, [favorites]);

  useEffect(() => {
    const fetchSuscripcion = async () => {
      try {
        const records = await pb.collection('suscripciones').getFullList({
          filter: `usuario_id = "${currentUser.id}"`,
          $autoCancel: false
        });

        if (records.length > 0) {
          setSuscripcion(records[0]);
          setSelectedCategorias(records[0].categorias || []);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoadingSuscripcion(false);
      }
    };

    fetchSuscripcion();
  }, [currentUser]);

  const handleRemoveFavorite = async (reformaId) => {
    try {
      const favorite = favorites.find(fav => fav.reforma_id === reformaId);
      if (favorite) {
        await pb.collection('favoritos').delete(favorite.id, { $autoCancel: false });
        toast.success('Eliminado de favoritos');
        refetch();
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Error al eliminar favorito');
    }
  };

  const handleCategoriaToggle = (categoria) => {
    setSelectedCategorias(prev =>
      prev.includes(categoria)
        ? prev.filter(c => c !== categoria)
        : [...prev, categoria]
    );
  };

  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    try {
      if (suscripcion) {
        await pb.collection('suscripciones').update(suscripcion.id, {
          categorias: selectedCategorias
        }, { $autoCancel: false });
      } else {
        const newSuscripcion = await pb.collection('suscripciones').create({
          usuario_id: currentUser.id,
          categorias: selectedCategorias
        }, { $autoCancel: false });
        setSuscripcion(newSuscripcion);
      }
      toast.success('Preferencias guardadas');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Error al guardar preferencias');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({ nombre: profileData.nombre });
      toast.success('Perfil actualizado');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - Portal de Reformas Legales</title>
        <meta name="description" content="Gestiona tus favoritos, preferencias de notificaciones y perfil de usuario." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-grow bg-secondary/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">Bienvenido, {currentUser?.nombre || currentUser?.email}</p>
            </div>

            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    <CardTitle>Reformas favoritas</CardTitle>
                  </div>
                  <CardDescription>
                    Reformas que has guardado para consultar más tarde
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {favoritesLoading || loadingReformas ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-24 bg-muted rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  ) : reformasData.length > 0 ? (
                    <div className="space-y-4">
                      {reformasData.map(reforma => (
                        <div
                          key={reforma.id}
                          className="flex items-start justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                        >
                          <div className="flex-grow">
                            <Link to={`/reforma/${reforma.id}`} className="hover:text-primary">
                              <h3 className="font-semibold mb-1">{reforma.titulo}</h3>
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(reforma.fecha_publicacion), 'dd/MM/yyyy')} • {reforma.materia_legal} • {reforma.nivel}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFavorite(reforma.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-muted rounded-lg">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground mb-4">No tienes reformas favoritas</p>
                      <Button asChild>
                        <Link to="/reformas">Explorar catálogo</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <CardTitle>Preferencias de notificaciones</CardTitle>
                  </div>
                  <CardDescription>
                    Selecciona las materias legales sobre las que deseas recibir notificaciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingSuscripcion ? (
                    <div className="space-y-3">
                      {[...Array(7)].map((_, i) => (
                        <div key={i} className="h-6 bg-muted rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        {categorias.map(categoria => (
                          <div key={categoria} className="flex items-center space-x-2">
                            <Checkbox
                              id={categoria}
                              checked={selectedCategorias.includes(categoria)}
                              onCheckedChange={() => handleCategoriaToggle(categoria)}
                            />
                            <Label htmlFor={categoria} className="cursor-pointer">
                              {categoria}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <Button onClick={handleSavePreferences} disabled={savingPreferences}>
                        <Save className="h-4 w-4 mr-2" />
                        {savingPreferences ? 'Guardando...' : 'Guardar preferencias'}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle>Perfil de usuario</CardTitle>
                  </div>
                  <CardDescription>
                    Actualiza tu información personal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        value={currentUser?.email || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nombre">Nombre</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        type="text"
                        value={profileData.nombre}
                        onChange={handleProfileChange}
                        placeholder="Tu nombre completo"
                        className="text-foreground"
                      />
                    </div>

                    <Button type="submit" disabled={savingProfile}>
                      <Save className="h-4 w-4 mr-2" />
                      {savingProfile ? 'Guardando...' : 'Guardar cambios'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default DashboardPage;
