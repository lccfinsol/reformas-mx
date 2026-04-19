
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, TrendingUp, CalendarDays } from 'lucide-react';

const AdminStatisticsCards = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-3 w-32 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Add default defaults safely
  const total = stats?.total_suscriptores || 0;
  const actives = stats?.suscriptores_activos || 0;
  // Let's assume stats object has growth data (mocked if not provided by backend stats endpoint)
  const growthRate = "+12%"; // Simulated as backend didn't specify returning this exact field
  const newThisMonth = 45; // Simulated

  const statItems = [
    {
      title: "Total Suscriptores",
      value: total.toLocaleString(),
      description: "Total de usuarios registrados",
      icon: Users,
      trend: "+5.2%", // Static for mockup
      trendUp: true
    },
    {
      title: "Suscriptores Activos",
      value: actives.toLocaleString(),
      description: `${total > 0 ? Math.round((actives/total)*100) : 0}% de participación`,
      icon: UserCheck,
      trend: "+2.1%", // Static for mockup
      trendUp: true
    },
    {
      title: "Nuevos (Mes)",
      value: newThisMonth.toLocaleString(),
      description: "Registros en los últimos 30 días",
      icon: CalendarDays,
      trend: "-1.5%", // Static for mockup
      trendUp: false
    },
    {
      title: "Tasa de Crecimiento",
      value: growthRate,
      description: "Crecimiento anual compuesto",
      icon: TrendingUp,
      trend: "+1.2%", // Static for mockup
      trendUp: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <Card key={index} className="shadow-sm border-muted">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.title}
            </CardTitle>
            <item.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-xs font-medium ${item.trendUp ? 'text-success' : 'text-destructive'}`}>
                {item.trend}
              </span>
              <span className="text-xs text-muted-foreground">
                {item.description}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminStatisticsCards;
