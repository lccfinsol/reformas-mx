
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, FileText, Download, Loader2, FileJson, Table as TableIcon } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient';
import { toast } from 'sonner';

const AdminExportPage = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    formato: 'excel',
    materia: 'Todas',
    fuente: 'Todas',
    estado: 'Todos',
  });

  const materias = ['Todas', 'Fiscal', 'Laboral', 'Procesal y mercantil', 'Penal', 'Administrativo', 'Otras'];
  const fuentes = ['Todas', 'DOF', 'Cámara de Diputados', 'Periódico Estatal'];

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('formato', formData.formato);
      if (formData.materia !== 'Todas') params.append('materia', formData.materia);
      if (formData.fuente !== 'Todas') params.append('fuente', formData.fuente);
      if (formData.estado !== 'Todos') params.append('estado', formData.estado);

      const url = `/admin/subscribers/export?${params.toString()}`;
      
      const response = await apiServerClient.fetch(url);
      if (!response.ok) {
        throw new Error('Error al generar la exportación');
      }

      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `exportacion_suscriptores_${new Date().toISOString().split('T')[0]}.${formData.formato === 'excel' ? 'xlsx' : formData.formato}`;
      
      if (contentDisposition && contentDisposition.includes('filename=')) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Archivo exportado exitosamente');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Ocurrió un error al generar la exportación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Exportar Datos - Admin</title>
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Exportar Datos de Suscriptores</h1>
            <p className="text-muted-foreground mt-1">Genera reportes de usuarios y estadísticas en el formato que necesites.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8">
            {/* Main Form */}
            <Card className="shadow-sm border-muted">
              <CardHeader>
                <CardTitle>Configuración del Reporte</CardTitle>
                <CardDescription>Selecciona los parámetros para la extracción de datos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Format selection */}
                <div className="space-y-3">
                  <Label>Formato de Archivo</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'excel', label: 'Excel (XLSX)', icon: FileSpreadsheet },
                      { id: 'csv', label: 'CSV', icon: TableIcon },
                      { id: 'pdf', label: 'PDF', icon: FileText },
                      { id: 'json', label: 'JSON', icon: FileJson },
                    ].map(fmt => (
                      <div 
                        key={fmt.id}
                        onClick={() => setFormData({...formData, formato: fmt.id})}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.formato === fmt.id ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card hover:bg-muted text-muted-foreground'}`}
                      >
                        <fmt.icon className="h-6 w-6 mb-2" />
                        <span className="text-sm font-medium">{fmt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Filtrar por Materia</Label>
                    <Select value={formData.materia} onValueChange={(v) => setFormData({...formData, materia: v})}>
                      <SelectTrigger className="bg-background text-foreground">
                        <SelectValue placeholder="Todas las materias" />
                      </SelectTrigger>
                      <SelectContent>
                        {materias.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Filtrar por Fuente</Label>
                    <Select value={formData.fuente} onValueChange={(v) => setFormData({...formData, fuente: v})}>
                      <SelectTrigger className="bg-background text-foreground">
                        <SelectValue placeholder="Todas las fuentes" />
                      </SelectTrigger>
                      <SelectContent>
                        {fuentes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Estado de Suscriptor</Label>
                    <Select value={formData.estado} onValueChange={(v) => setFormData({...formData, estado: v})}>
                      <SelectTrigger className="bg-background text-foreground">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Todos">Todos</SelectItem>
                        <SelectItem value="true">Solo Activos</SelectItem>
                        <SelectItem value="false">Solo Inactivos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 pt-6">
                <Button onClick={handleExport} disabled={loading} className="w-full md:w-auto">
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</>
                  ) : (
                    <><Download className="mr-2 h-4 w-4" /> Descargar Reporte</>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Sidebar Context Info */}
            <div className="space-y-6">
              <Card className="shadow-sm bg-primary/5 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-primary">Sobre los formatos</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-3">
                  <p><strong>Excel:</strong> El formato más completo. Incluye hojas separadas para lista general y estadísticas.</p>
                  <p><strong>PDF:</strong> Documento formateado para impresión rápida o presentaciones ejecutivas.</p>
                  <p><strong>CSV:</strong> Archivo plano ideal para importar a otras herramientas de CRM o marketing.</p>
                  <p><strong>JSON:</strong> Datos estructurados para integración con APIs de terceros.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default AdminExportPage;
