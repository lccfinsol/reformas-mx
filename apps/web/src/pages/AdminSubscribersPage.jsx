
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Filter, Settings, Trash2, ShieldCheck, ShieldBan, Eye } from 'lucide-react';
import { format } from 'date-fns';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import AdminSubscriberDetail from '@/components/AdminSubscriberDetail.jsx';
import apiServerClient from '@/lib/apiServerClient';
import { toast } from 'sonner';

const AdminSubscribersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Detail Modal state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSubId, setSelectedSubId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState(searchParams.get('busqueda') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const limit = 20;

  // Mock static filter options for UI
  const materias = ['Todas', 'Fiscal', 'Laboral', 'Procesal y mercantil', 'Penal', 'Administrativo', 'Otras'];
  const fuentes = ['Todas', 'DOF', 'Cámara de Diputados', 'Periódico Estatal'];

  useEffect(() => {
    fetchSubscribers();
  }, [searchParams, page]);

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams);
      params.set('page', page);
      params.set('limit', limit);
      
      const response = await apiServerClient.fetch(`/admin/subscribers?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch subscribers');
      
      const data = await response.json();
      setSubscribers(data.subscribers || []);
      setTotal(data.total || 0);
      setSelectedIds([]); // Reset selection on page load
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      toast.error('Error al cargar suscriptores');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (searchTerm) newParams.set('busqueda', searchTerm);
    else newParams.delete('busqueda');
    setSearchParams(newParams);
  };

  const handleFilterChange = (key, value) => {
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'Todas' && value !== 'Todos') newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(subscribers.map(sub => sub.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;
    
    let confirmMsg = '';
    if (action === 'delete') confirmMsg = `¿Eliminar ${selectedIds.length} suscriptores?`;
    else if (action === 'activate') confirmMsg = `¿Activar ${selectedIds.length} suscriptores?`;
    else confirmMsg = `¿Desactivar ${selectedIds.length} suscriptores?`;

    if (!window.confirm(confirmMsg)) return;

    setBulkLoading(true);
    try {
      const response = await apiServerClient.fetch('/admin/subscribers/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, subscriber_ids: selectedIds })
      });

      if (!response.ok) throw new Error('Bulk action failed');
      
      toast.success('Operación completada con éxito');
      fetchSubscribers();
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Error en la operación masiva');
    } finally {
      setBulkLoading(false);
    }
  };

  const openDetail = (id) => {
    setSelectedSubId(id);
    setDetailOpen(true);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Helmet>
        <title>Gestión de Suscriptores - Admin</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Directorio de Suscriptores</h1>
            <p className="text-muted-foreground mt-1">Visualiza y gestiona los usuarios y sus preferencias.</p>
          </div>

          {/* Filters Bar */}
          <div className="bg-card border rounded-lg p-4 mb-6 shadow-sm flex flex-col lg:flex-row gap-4 items-end">
            <form onSubmit={handleSearch} className="flex-1 w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre, email o teléfono..." 
                className="pl-9 w-full bg-background text-foreground"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
            
            <div className="flex w-full lg:w-auto gap-3">
              <div className="w-full lg:w-[180px]">
                <Select value={searchParams.get('materia') || 'Todas'} onValueChange={(v) => handleFilterChange('materia', v)}>
                  <SelectTrigger className="bg-background">
                    <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {materias.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full lg:w-[180px]">
                <Select value={searchParams.get('fuente') || 'Todas'} onValueChange={(v) => handleFilterChange('fuente', v)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Fuente" />
                  </SelectTrigger>
                  <SelectContent>
                    {fuentes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full lg:w-[150px]">
                <Select value={searchParams.get('activo') || 'Todos'} onValueChange={(v) => handleFilterChange('activo', v)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value="true">Activos</SelectItem>
                    <SelectItem value="false">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
              <span className="text-sm font-medium text-primary">
                {selectedIds.length} seleccionado(s)
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="bg-background border-success text-success hover:bg-success/10" onClick={() => handleBulkAction('activate')} disabled={bulkLoading}>
                  <ShieldCheck className="h-4 w-4 mr-2" /> Activar
                </Button>
                <Button size="sm" variant="outline" className="bg-background border-warning text-warning hover:bg-warning/10" onClick={() => handleBulkAction('deactivate')} disabled={bulkLoading}>
                  <ShieldBan className="h-4 w-4 mr-2" /> Desactivar
                </Button>
                <Button size="sm" variant="outline" className="bg-background border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleBulkAction('delete')} disabled={bulkLoading}>
                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={subscribers.length > 0 && selectedIds.length === subscribers.length}
                        onCheckedChange={handleSelectAll}
                        aria-label="Seleccionar todos"
                      />
                    </TableHead>
                    <TableHead>Nombre y Email</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Materias Activas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : subscribers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No se encontraron suscriptores con los filtros actuales.
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscribers.map((sub) => (
                      <TableRow key={sub.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Checkbox 
                            checked={selectedIds.includes(sub.id)}
                            onCheckedChange={(checked) => handleSelectOne(sub.id, checked)}
                            aria-label={`Seleccionar ${sub.nombre_completo}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{sub.nombre_completo}</div>
                          <div className="text-xs text-muted-foreground">{sub.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{sub.numero_telefono || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{sub.pais_codigo || '-'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {sub.materias_activas && sub.materias_activas.length > 0 ? (
                              sub.materias_activas.slice(0, 2).map((materia, i) => (
                                <Badge key={i} variant="secondary" className="text-[10px] font-normal truncate max-w-[120px]">{materia}</Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">Ninguna</span>
                            )}
                            {sub.materias_activas?.length > 2 && (
                              <Badge variant="outline" className="text-[10px]">+{sub.materias_activas.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sub.activo ? "default" : "secondary"} className={sub.activo ? "bg-success hover:bg-success/80 text-success-foreground" : ""}>
                            {sub.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sub.fecha_registro ? format(new Date(sub.fecha_registro), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openDetail(sub.id)} title="Ver detalles">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination Footer */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between border-t p-4 bg-muted/10">
                <div className="text-sm text-muted-foreground">
                  Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  >
                    Anterior
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={page === totalPages}
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
        
        <Footer />
      </div>

      <AdminSubscriberDetail 
        id={selectedSubId} 
        open={detailOpen} 
        onOpenChange={setDetailOpen} 
        onRefreshList={fetchSubscribers}
      />
    </>
  );
};

export default AdminSubscribersPage;
