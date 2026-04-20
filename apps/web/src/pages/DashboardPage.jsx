
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Bell, ArrowRight, Settings, FileText } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ReformaCard from '@/components/ReformaCard.jsx';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [stats, setStats] = useState({ favCount: 0, notifCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      try {
        // Fetch recent favorites with expanded reforma data
        const favRecords = await pb.collection('favoritos').getList(1, 4, {
          filter: `usuario_id="${currentUser.id}"`,
          sort: '-created',
          expand: 'reforma_id',
          $autoCancel: false
        });
        
        const reformas = favRecords.items.map(f => f.expand?.reforma_id).filter(Boolean);
        setFavorites(reformas);

        // Fetch total unread notifications
        const unreadNotifs = await pb.collection('notification_history').getList(1, 1, {
          filter: `user_id="${currentUser.id}" && leida=false`,
          $autoCancel: false
        });

        setStats({
          favCount: favRecords.totalItems,
          notifCount: unreadNotifs.totalItems
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [currentUser]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-muted/10">
      <Header />

      <main className="flex-1 container mx-auto px-4 max-w-7xl py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif mb-2">Hola, {currentUser?.name || 'Usuario'}</h1>
          <p className="text-muted-foreground">Bienvenido a tu panel de inteligencia legislativa.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              <Bookmark size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Reformas Guardadas</p>
              <h3 className="text-2xl font-bold text-foreground">{loading ? '-' : stats.favCount}</h3>
            </div>
          </div>
          
          <div className="bg-card border rounded-2xl p-6 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center shrink-0">
              <Bell size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Alertas sin leer</p>
              <h3 className="text-2xl font-bold text-foreground">{loading ? '-' : stats.notifCount}</h3>
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-1">Preferencias</p>
              <p className="text-foreground font-medium">Gestiona tus suscripciones y filtros de alerta.</p>
            </div>
            <Button variant="outline" size="icon" asChild>
              <Link to="/suscripciones"><Settings size={20} /></Link>
            </Button>
          </div>
        </div>

        {/* Recent Favorites */}
        <div>
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h2 className="text-2xl font-bold font-serif flex items-center gap-2">
              <Bookmark size={24} className="text-primary" /> Guardados Recientemente
            </h2>
            <Button variant="ghost" asChild className="text-primary hidden sm:flex">
              <Link to="/reformas">Explorar más <ArrowRight size={16} className="ml-2" /></Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="bg-card border rounded-xl p-6 h-[250px] flex flex-col">
                  <Skeleton className="h-6 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-6" />
                </div>
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="bg-card border border-dashed rounded-2xl p-12 text-center flex flex-col items-center">
              <FileText size={48} className="text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tienes reformas guardadas</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Guarda reformas para acceder a ellas rápidamente, exportarlas o imprimirlas en cualquier momento.
              </p>
              <Button asChild><Link to="/reformas">Ir al catálogo</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {favorites.map(reforma => (
                <ReformaCard key={reforma.id} reforma={reforma} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardPage;
