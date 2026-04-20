
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SearchResultDetail = ({ reforma, searchResult }) => {
  const contentRef = useRef(null);
  const highlightRef = useRef(null);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchResult]);

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} ref={highlightRef} className="bg-yellow-200 text-black px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">
            Resultado Destacado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="italic text-muted-foreground">
            "...{highlightText(searchResult.contexto || searchResult.texto_encontrado, searchResult.texto_encontrado)}..."
          </p>
        </CardContent>
      </Card>

      <div className="prose prose-lg max-w-none" ref={contentRef}>
        <h2 className="text-2xl font-semibold mb-4">Contenido Completo</h2>
        <p className="whitespace-pre-wrap leading-relaxed">
          {highlightText(reforma.contenido, searchResult.texto_encontrado)}
        </p>
      </div>
    </div>
  );
};

export default SearchResultDetail;
