
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Download, Activity, ExternalLink } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import AdminStatisticsCards from '@/components/AdminStatisticsCards.jsx';
import AdminStatisticsCharts from '@/components/AdminStatisticsCharts.jsx';
import apiServerClient from '@/lib/apiServerClient';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiServerClient.fetch('/admin/subscribers/statistics');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching admin statistics:', error);
      toast.error('Error cargando estadísticas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Panel de Administración - Reformas Legales</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-secondary/20">
        <Header />
        
        <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Administrativo</h1>
              <p className="text-muted-foreground mt-1">Visión general del sistema de suscriptores y notificaciones.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="outline" className="bg-background">
                <Link to="/admin/subscribers">
                  <Users className="h-4 w-4 mr-2" />
                  Gestionar Suscriptores
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-background">
                <Link to="/admin/export">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Datos
                </Link>
              </Button>
              {/* Placeholder for scraping logs route */}
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link to="/dashboard">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Vista Usuario
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4 text-foreground">Estadísticas Principales</h2>
              <AdminStatisticsCards stats={stats} loading={loading} />
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold text-foreground">Análisis de Distribución</h2>
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <AdminStatisticsCharts stats={stats} loading={loading} />
            </section>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default AdminDashboard;
