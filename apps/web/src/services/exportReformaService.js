
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

export const exportarAPDF = async (reforma, elementId = 'reforma-print-content') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('No se encontró el contenido para exportar');
    }

    // Temporarily add a class to format specifically for the canvas capture if needed
    element.classList.add('pdf-export-mode');
    
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better resolution
      useCORS: true,
      logging: false,
      windowWidth: 1200, // Force a specific width to avoid mobile layouts
    });
    
    element.classList.remove('pdf-export-mode');

    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate image dimensions to fit width
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Add subsequent pages if content is longer than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`Reforma_${reforma.id || 'export'}.pdf`);
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
      // Check if it looks like a list item
      const isListItem = text.trim().startsWith('-') || text.trim().match(/^\d+\./);
      
      children.push(
        new Paragraph({
          text: isListItem ? text.trim().replace(/^-/, '').trim() : text.trim(),
          spacing: { after: 200, line: 360 }, // 1.5 line spacing
          alignment: AlignmentType.JUSTIFIED,
          bullet: isListItem ? { level: 0 } : undefined
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
    window.print();
    return true;
  } catch (error) {
    console.error('Error printing:', error);
    throw new Error('No se pudo abrir el diálogo de impresión');
  }
};
