
import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, FileText, Download, Heart, ArrowLeft, Twitter, Facebook, Linkedin, Copy, Check, Printer, FileDown, FileType2 } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import pb from '@/lib/pocketbaseClient';
import { useFavorites } from '@/hooks/useFavorites.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toast } from 'sonner';
import { format } from 'date-fns';
import SearchResultDetail from '@/components/SearchResultDetail.jsx';
import { exportarAPDF, exportarAWord, imprimirReforma } from '@/services/exportReformaService.js';

const ReformaDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const searchResult = location.state?.searchResult;
  
  const { isAuthenticated } = useAuth();
  const { isFavorited, addFavorite, removeFavorite } = useFavorites();
  const [reforma, setReforma] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Export loading states
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);

  useEffect(() => {
    const fetchReforma = async () => {
      try {
        const record = await pb.collection('reformas').getOne(id, { $autoCancel: false });
        
        // LOGS DE DEPURACIÓN AÑADIDOS SEGÚN LA TAREA 1
        console.log('--- DEBUG REFORMA ---');
        console.log('Registro completo obtenido de la base de datos:', record);
        console.log('Longitud del campo "contenido" original en BD:', record.contenido?.length || 0, 'caracteres');
        if (record.contenido?.length < 500) {
           console.warn('⚠️ ADVERTENCIA: El campo "contenido" devuelto por PocketBase es muy corto. Si falta texto, el problema está en los datos guardados en la BD, no en la UI.');
        } else {
           console.log('✅ El campo "contenido" parece tener una longitud adecuada.');
        }
        console.log('---------------------');

        setReforma(record);
      } catch (error) {
        console.error('Error fetching reforma:', error);
        toast.error('Error al cargar la reforma');
      } finally {
        setLoading(false);
      }
    };

    fetchReforma();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Debes iniciar sesión para guardar favoritos');
      return;
    }

    setIsTogglingFavorite(true);
    try {
      if (isFavorited(id)) {
        await removeFavorite(id);
        toast.success('Eliminado de favoritos');
      } else {
        await addFavorite(id);
        toast.success('Agregado a favoritos');
      }
    } catch (error) {
      toast.error('Error al actualizar favoritos');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar enlace');
    }
  };

  const handleShare = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(reforma.titulo);
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportarAPDF(reforma);
      toast.success('PDF exportado correctamente');
    } catch (error) {
      toast.error(error.message || 'Error al exportar PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportWord = async () => {
    setIsExportingWord(true);
    try {
      await exportarAWord(reforma);
      toast.success('Documento Word exportado correctamente');
    } catch (error) {
      toast.error(error.message || 'Error al exportar Word');
    } finally {
      setIsExportingWord(false);
    }
  };

  const handlePrint = () => {
    try {
      imprimirReforma();
    } catch (error) {
      toast.error('Error al intentar imprimir');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando reforma...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!reforma) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Reforma no encontrada</h2>
            <p className="text-muted-foreground mb-6">La reforma que buscas no existe</p>
            <Button asChild>
              <Link to="/reformas">Volver al catálogo</Link>
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${reforma.titulo} - Portal de Reformas Legales`}</title>
        <meta name="description" content={reforma.contenido.substring(0, 160)} />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-grow bg-secondary/30 print:bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 print:py-0 print:px-0">
            <Button variant="ghost" asChild className="mb-6 print:hidden no-print">
              <Link to={searchResult ? "/buscar" : "/reformas"}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {searchResult ? "Volver a resultados" : "Volver al catálogo"}
              </Link>
            </Button>

            <Card className="print:shadow-none print:border-none print:m-0 mb-8">
              <CardContent className="p-8 md:p-12 print:p-0">
                <div className="flex flex-wrap gap-2 mb-6 print:hidden no-print">
                  {reforma.materia_legal && (
                    <Badge className="bg-primary text-primary-foreground">
                      {reforma.materia_legal}
                    </Badge>
                  )}
                  {reforma.nivel && (
                    <Badge variant="outline">{reforma.nivel}</Badge>
                  )}
                  {reforma.estado && (
                    <Badge variant="secondary">{reforma.estado}</Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight print:text-2xl text-balance">
                  {reforma.titulo}
                </h1>

                <div className="grid md:grid-cols-2 gap-4 mb-8 print:mb-4 bg-muted/50 p-4 rounded-lg print:bg-transparent print:p-0">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-5 w-5 print:hidden text-primary" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Fecha de publicación</p>
                      <p className="text-sm font-medium text-foreground">
                        {reforma.fecha_publicacion ? format(new Date(reforma.fecha_publicacion), 'dd/MM/yyyy') : 'No especificada'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <FileText className="h-5 w-5 print:hidden text-primary" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Fuente</p>
                      <p className="text-sm font-medium text-foreground">{reforma.fuente || 'No especificada'}</p>
                    </div>
                  </div>
                  
                  {reforma.materia_legal && (
                    <div className="flex items-center gap-3 text-muted-foreground print:hidden">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="text-[10px] font-bold">{reforma.materia_legal.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Materia Legal</p>
                        <p className="text-sm font-medium text-foreground">{reforma.materia_legal}</p>
                      </div>
                    </div>
                  )}
                  
                  {reforma.estado && (
                    <div className="flex items-center gap-3 text-muted-foreground print:hidden">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <span className="text-[10px] font-bold">{reforma.estado.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70">Estado</p>
                        <p className="text-sm font-medium text-foreground">{reforma.estado}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-wrap gap-3 mb-8 print:hidden no-print">
                  <Button variant="outline" onClick={handlePrint} className="flex-1 sm:flex-none">
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleExportPDF} 
                    disabled={isExportingPDF}
                    className="flex-1 sm:flex-none"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    {isExportingPDF ? 'Exportando...' : 'Exportar a PDF'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleExportWord} 
                    disabled={isExportingWord}
                    className="flex-1 sm:flex-none"
                  >
                    <FileType2 className="h-4 w-4 mr-2" />
                    {isExportingWord ? 'Exportando...' : 'Exportar a Word'}
                  </Button>
                </div>

                <Separator className="my-8 print:my-4" />

                {searchResult ? (
                  <SearchResultDetail reforma={reforma} searchResult={searchResult} />
                ) : (
                  <Card className="border-border shadow-sm print:shadow-none print:border-none bg-card print:bg-transparent">
                    <CardHeader className="bg-muted/30 border-b print:border-none print:bg-transparent print:p-0">
                      <CardTitle className="text-2xl print:text-xl text-primary">Contenido Completo</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 print:p-0">
                      {/* 
                          REMOVED: max-h-[70vh] overflow-y-auto 
                          ADDED: h-auto overflow-visible
                          Esto garantiza que el contenedor crezca a la altura natural del texto sin cortarlo 
                      */}
                      <div className="h-auto overflow-visible p-6 md:p-8 print:p-0">
                        <div className="prose prose-lg max-w-none print:prose-sm reforma-content">
                          <div className="whitespace-pre-wrap leading-relaxed text-foreground/90 font-normal break-words">
                            {reforma.contenido}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Separator className="my-8 print:hidden no-print" />

                <div className="flex flex-wrap gap-3 print:hidden no-print">
                  <Button
                    variant={isFavorited(id) ? "default" : "outline"}
                    onClick={handleToggleFavorite}
                    disabled={isTogglingFavorite}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isFavorited(id) ? 'fill-current' : ''}`} />
                    {isFavorited(id) ? 'En favoritos' : 'Guardar'}
                  </Button>

                  {reforma.pdf && (
                    <Button variant="outline" asChild>
                      <a href={pb.files.getUrl(reforma, reforma.pdf)} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF Original
                      </a>
                    </Button>
                  )}

                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyLink}
                      title="Copiar enlace"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare('twitter')}
                      title="Compartir en Twitter"
                    >
                      <Twitter className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare('facebook')}
                      title="Compartir en Facebook"
                    >
                      <Facebook className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare('linkedin')}
                      title="Compartir en LinkedIn"
                    >
                      <Linkedin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="print:hidden no-print">
          <Footer />
        </div>
      </div>
    </>
  );
};

export default ReformaDetailPage;
