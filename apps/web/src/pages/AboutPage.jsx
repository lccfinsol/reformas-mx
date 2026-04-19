
import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent } from '@/components/ui/card';
import { Scale, Target, Users, Database } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const AboutPage = () => {
  return (
    <>
      <Helmet>
        <title>Acerca de - Portal de Reformas Legales</title>
        <meta name="description" content="Conoce nuestra misión, fuentes de datos y equipo detrás del Portal de Reformas Legales. Plataforma dedicada a democratizar el acceso a información normativa." />
      </Helmet>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-grow">
          <div className="bg-secondary py-16 border-b">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{letterSpacing: '-0.02em'}}>
                Acerca del portal
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Nuestra misión es democratizar el acceso a información legal actualizada,
                facilitando el seguimiento de reformas normativas en México.
              </p>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <Card>
                <CardContent className="p-8">
                  <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                    <Target className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-3">Nuestra misión</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Proporcionar una plataforma integral que centralice y simplifique el acceso
                    a reformas legales, permitiendo a profesionales del derecho, empresas y
                    ciudadanos mantenerse informados sobre cambios normativos relevantes.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                    <Database className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-3">Fuentes de datos</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Nuestra base de datos se alimenta directamente de fuentes oficiales verificadas:
                    Diario Oficial de la Federación, Cámara de Diputados, y periódicos oficiales
                    estatales, garantizando información precisa y actualizada.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-secondary rounded-2xl p-8 md:p-12 mb-16">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center shrink-0">
                  <Scale className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold mb-3">Compromiso con la transparencia</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Creemos firmemente en la transparencia y el acceso abierto a la información legal.
                    Cada reforma publicada en nuestro portal incluye referencias directas a la fuente
                    oficial, permitiendo a nuestros usuarios verificar y profundizar en el contenido normativo.
                  </p>
                </div>
              </div>

              <div className="space-y-4 mt-8">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">Actualización continua:</span> Nuestro
                    equipo monitorea constantemente las fuentes oficiales para incorporar nuevas reformas
                    dentro de las primeras 24 horas de su publicación.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">Cobertura integral:</span> Abarcamos
                    reformas de todos los niveles de gobierno (federal, estatal y municipal) y todas las
                    materias legales relevantes.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0"></div>
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">Herramientas de seguimiento:</span> Ofrecemos
                    funcionalidades para que puedas personalizar tu experiencia, guardar favoritos y recibir
                    notificaciones sobre temas de tu interés.
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">Equipo multidisciplinario</h2>
              <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Nuestro equipo está conformado por abogados especializados, analistas legales y
                desarrolladores comprometidos con la excelencia en la recopilación, verificación y
                presentación de información jurídica. Trabajamos diariamente para ofrecer la mejor
                experiencia de consulta legal en línea.
              </p>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default AboutPage;
