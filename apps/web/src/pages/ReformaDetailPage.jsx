
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Download, Printer, Calendar, MapPin, FileText, Bookmark, BookmarkCheck, Link as LinkIcon, Loader2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { useFavorites } from '@/hooks/useFavorites.js';
import { exportarAPDF, exportarAWord, imprimirReforma } from '@/services/exportReformaService.js';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const ReformaDetailPage = () => {
  const { id } = useParams();
  const [reforma, setReforma] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const { isFavorite, toggleFavorite, loading: favLoading } = useFavorites(id);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const record = await pb.collection('reformas').getOne(id, {
          $autoCancel: false
        });
        setReforma(record);
      } catch (err) {
        console.error('Error fetching reforma detail:', err);
        toast.error('Error', { description: 'No se pudo cargar la información de la reforma.' });
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleExportPDF = async () => {
    if (!reforma) return;
    setIsExportingPdf(true);
    try {
      await exportarAPDF(reforma, 'reforma-print-content');
      toast.success('Documento exportado', { description: 'Se ha descargado el archivo PDF exitosamente.' });
    } catch(e) {
      toast.error('Error de exportación', { description: 'Hubo un problema al generar el documento PDF.' });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportWord = async () => {
    if (!reforma) return;
    setIsExportingWord(true);
    try {
      await exportarAWord(reforma);
      toast.success('Documento exportado', { description: 'Se ha descargado el archivo Word exitosamente.' });
    } catch(e) {
      toast.error('Error de exportación', { description: 'Hubo un problema al generar el documento Word.' });
    } finally {
      setIsExportingWord(false);
    }
  };

  const handlePrint = () => {
    if (!reforma) return;
    try {
      imprimirReforma();
    } catch(e) {
      toast.error('Error de impresión', { description: 'No se pudo abrir el diálogo de impresión.' });
    }
  };

  // Helper to format content with paragraphs and lists
  const formatContent = (text) => {
    if (!text) return null;
    
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
    
    return paragraphs.map((paragraph, index) => {
      const isListItem = paragraph.trim().startsWith('-') || paragraph.trim().match(/^\d+\./);
      
      if (isListItem) {
        return (
          <li key={index} className="ml-6 mb-2 list-disc pl-2">
            {paragraph.trim().replace(/^-/, '').trim()}
          </li>
        );
      }
      
      return (
        <p key={index} className="mb-4 text-foreground/90 leading-relaxed">
          {paragraph.trim()}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-[100dvh]">
        <Header />
        <main className="flex-1 container mx-auto px-4 max-w-4xl py-12">
          <Skeleton className="h-6 w-32 mb-8" />
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-12 w-3/4 mb-12" />
          <Skeleton className="h-64 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!reforma) {
    return (
      <div className="flex flex-col min-h-[100dvh]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Reforma no encontrada</h2>
            <Button asChild><Link to="/reformas">Volver al catálogo</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Header />

      <main className="flex-1 container mx-auto px-4 max-w-4xl py-12">
        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 no-print">
          <Button variant="ghost" className="text-muted-foreground pl-0 hover:bg-transparent hover:text-foreground" asChild>
            <Link to="/reformas">
              <ArrowLeft size={20} className="mr-2" /> Volver a resultados
            </Link>
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <Button 
              variant={isFavorite ? "secondary" : "outline"} 
              size="sm" 
              onClick={toggleFavorite}
              disabled={favLoading}
              className={isFavorite ? "text-primary" : ""}
            >
              {isFavorite ? <BookmarkCheck size={18} className="mr-2 fill-primary" /> : <Bookmark size={18} className="mr-2" />}
              {isFavorite ? 'Guardado' : 'Guardar'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={isExportingPdf}>
              {isExportingPdf ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Download size={18} className="mr-2" />}
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportWord} disabled={isExportingWord}>
              {isExportingWord ? <Loader2 size={18} className="mr-2 animate-spin" /> : <FileText size={18} className="mr-2" />}
              Word
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer size={18} className="mr-2" /> Imprimir
            </Button>
          </div>
        </div>

        {/* Content Container - Target for PDF export and Print */}
        <div id="reforma-print-content" className="bg-card border rounded-2xl p-6 md:p-10 shadow-sm reforma-content">
          
          {/* Print-only Header */}
          <div className="print-only print-metadata">
            <div className="print-metadata-item">
              <span className="print-metadata-label">Documento:</span> Reforma Legal
            </div>
            <div className="print-metadata-item">
              <span className="print-metadata-label">Generado el:</span> {format(new Date(), "dd/MM/yyyy HH:mm")}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6 no-print">
            <Badge variant="secondary" className="bg-primary/10 text-primary px-3 py-1">
              {reforma.fuente}
            </Badge>
            {reforma.nivel && <Badge variant="outline" className="px-3 py-1">{reforma.nivel}</Badge>}
            {reforma.materia_legal && <Badge variant="outline" className="px-3 py-1">{reforma.materia_legal}</Badge>}
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif leading-tight mb-8">
            {reforma.titulo}
          </h1>

          <div className="flex flex-wrap gap-x-8 gap-y-4 mb-10 pb-8 border-b text-sm text-muted-foreground print-metadata">
            <div className="flex items-center gap-2 print-metadata-item">
              <Calendar size={18} className="text-primary no-print" />
              <span><span className="print-metadata-label">Publicado:</span> <strong className="text-foreground font-medium">{format(new Date(reforma.fecha_publicacion), "dd 'de' MMMM, yyyy", { locale: es })}</strong></span>
            </div>
            <div className="flex items-center gap-2 print-metadata-item print-only">
              <span><span className="print-metadata-label">Fuente:</span> <strong className="text-foreground font-medium">{reforma.fuente}</strong></span>
            </div>
            <div className="flex items-center gap-2 print-metadata-item print-only">
              <span><span className="print-metadata-label">Materia:</span> <strong className="text-foreground font-medium">{reforma.materia_legal}</strong></span>
            </div>
            {reforma.estado && (
              <div className="flex items-center gap-2 print-metadata-item">
                <MapPin size={18} className="text-primary no-print" />
                <span><span className="print-metadata-label">Estado:</span> <strong className="text-foreground font-medium">{reforma.estado}</strong></span>
              </div>
            )}
            {reforma.url_fuente && (
              <div className="flex items-center gap-2 no-print">
                <LinkIcon size={18} className="text-primary" />
                <a href={reforma.url_fuente} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                  Ver fuente oficial
                </a>
              </div>
            )}
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-serif">
            {reforma.descripcion_corta && (
              <div className="mb-8 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                <p className="text-lg font-medium text-foreground m-0">
                  {reforma.descripcion_corta}
                </p>
              </div>
            )}
            
            <div className="mt-8">
              <h2 className="text-2xl font-serif font-semibold mb-6">Contenido Íntegro</h2>
              <div className="text-base">
                {formatContent(reforma.contenido)}
              </div>
            </div>
          </div>
          
          {(reforma.impacto || reforma.ordenamiento_afectado) && (
            <div className="mt-12 pt-8 border-t bg-muted/30 -mx-6 md:-mx-10 px-6 md:px-10 pb-8 rounded-b-2xl">
              <h3 className="text-xl font-serif font-semibold mb-6">Detalles de Impacto Normativo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reforma.ordenamiento_afectado && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Ordenamiento Afectado</h4>
                    <p className="text-foreground">{reforma.ordenamiento_afectado}</p>
                  </div>
                )}
                {reforma.impacto && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">Análisis de Impacto</h4>
                    <p className="text-foreground">{reforma.impacto}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReformaDetailPage;
