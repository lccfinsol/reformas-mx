
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export const exportarAPDF = async (reforma) => {
  try {
    const doc = new jsPDF();
    let yPos = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxLineWidth = pageWidth - margin * 2;

    // Helper to check page break
    const checkPageBreak = (neededSpace) => {
      if (yPos + neededSpace > pageHeight - 20) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(reforma.titulo || 'Reforma Legal', maxLineWidth);
    doc.text(titleLines, margin, yPos);
    yPos += titleLines.length * 7 + 5;

    // Metadata
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const metadata = [
      `Fecha de publicación: ${reforma.fecha_publicacion ? format(new Date(reforma.fecha_publicacion), 'dd/MM/yyyy') : 'N/A'}`,
      `Fuente: ${reforma.fuente || 'N/A'}`,
      `Materia: ${reforma.materia_legal || 'N/A'}`,
      `Estado: ${reforma.estado || 'N/A'}`
    ];

    metadata.forEach(line => {
      checkPageBreak(6);
      doc.text(line, margin, yPos);
      yPos += 6;
    });
    yPos += 10;

    // Content - FULL contenido garantizado sin cortes ni truncamiento
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    // Se asegura de tomar TODO el texto y dividirlo en líneas para ajustarlo al ancho de página
    const contenidoCompleto = reforma.contenido || '';
    const contentLines = doc.splitTextToSize(contenidoCompleto, maxLineWidth);
    
    for (let i = 0; i < contentLines.length; i++) {
      checkPageBreak(6);
      doc.text(contentLines[i], margin, yPos);
      yPos += 6;
    }

    // Page numbers and footer
    const pageCount = doc.getNumberOfPages();
    const exportDate = format(new Date(), 'dd/MM/yyyy HH:mm');
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      
      // Footer text
      doc.text(`Exportado el: ${exportDate}`, margin, pageHeight - 10);
      // Page number
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    doc.save(`Reforma_${reforma.id || 'export'}.pdf`);
    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('No se pudo generar el archivo PDF');
  }
};

export const exportarAWord = async (reforma) => {
  try {
    const children = [
      new Paragraph({
        text: reforma.titulo || 'Reforma Legal',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        spacing: { after: 400 },
        children: [
          new TextRun({ text: `Fecha de publicación: ${reforma.fecha_publicacion ? format(new Date(reforma.fecha_publicacion), 'dd/MM/yyyy') : 'N/A'}`, break: 1 }),
          new TextRun({ text: `Fuente: ${reforma.fuente || 'N/A'}`, break: 1 }),
          new TextRun({ text: `Materia: ${reforma.materia_legal || 'N/A'}`, break: 1 }),
          new TextRun({ text: `Estado: ${reforma.estado || 'N/A'}`, break: 1 }),
        ],
      }),
    ];

    // Content paragraphs - FULL contenido garantizado
    const contenidoCompleto = reforma.contenido || '';
    const paragraphs = contenidoCompleto.split('\n').filter(p => p.trim().length > 0);
    
    paragraphs.forEach(text => {
      children.push(
        new Paragraph({
          text: text.trim(),
          spacing: { after: 200, line: 360 }, // 1.5 line spacing
          alignment: AlignmentType.JUSTIFIED
        })
      );
    });

    const doc = new Document({
      creator: "Portal de Reformas Legales",
      title: reforma.titulo || "Reforma",
      description: "Documento exportado de reformas legales",
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: children,
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Reforma_${reforma.id || 'export'}.docx`);
    return true;
  } catch (error) {
    console.error('Error exporting to Word:', error);
    throw new Error('No se pudo generar el archivo Word');
  }
};

export const imprimirReforma = () => {
  try {
    // La impresión utiliza window.print() que respeta el DOM actual. 
    // Al remover los límites de altura en la UI, la impresión también tomará el contenido completo.
    window.print();
    return true;
  } catch (error) {
    console.error('Error printing:', error);
    throw new Error('No se pudo abrir el diálogo de impresión');
  }
};
