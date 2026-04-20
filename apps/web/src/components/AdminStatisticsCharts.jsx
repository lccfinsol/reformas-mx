
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const AdminStatisticsCharts = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader>
              <div className="h-5 w-40 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="h-32 w-32 rounded-full border-4 border-muted animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Transform backend stats object into recharts arrays
  const materiaData = stats?.por_materia ? Object.entries(stats.por_materia)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7) // Top 7 for better display
    : [];

  const fuenteData = stats?.por_fuente ? Object.entries(stats.por_fuente)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    : [];

  // Mocked timeline data since backend doesn't provide historical timeseries out of the box in this response
  const timelineData = [
    { name: 'Ene', usuarios: 400 },
    { name: 'Feb', usuarios: 300 },
    { name: 'Mar', usuarios: 550 },
    { name: 'Abr', usuarios: 450 },
    { name: 'May', usuarios: 700 },
    { name: 'Jun', usuarios: 650 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-sm border-muted">
        <CardHeader>
          <CardTitle>Suscriptores por Materia Legal</CardTitle>
          <CardDescription>Top materias seleccionadas por los usuarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {materiaData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={materiaData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]}>
                    {materiaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No hay datos disponibles
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-muted">
        <CardHeader>
          <CardTitle>Distribución por Fuente</CardTitle>
          <CardDescription>Preferencias de fuentes de información</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {fuenteData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fuenteData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {fuenteData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No hay datos disponibles
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card className="col-span-1 lg:col-span-2 shadow-sm border-muted">
        <CardHeader>
          <CardTitle>Crecimiento de Suscriptores</CardTitle>
          <CardDescription>Usuarios activos a lo largo del tiempo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="usuarios" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStatisticsCharts;
