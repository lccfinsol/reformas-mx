
// Mock implementations for export. Full jsPDF/docx implementations are large, 
// so this provides basic blob generation that works with FileSaver.
import { saveAs } from 'file-saver';

export const exportToPdf = (reforma) => {
  try {
    // In a real app, use jsPDF:
    // import { jsPDF } from 'jspdf';
    // const doc = new jsPDF();
    // doc.text(reforma.titulo, 10, 10);
    // doc.save(`${reforma.titulo}.pdf`);
    
    // For environment stability, we'll create a blob text proxy
    const content = `
      Title: ${reforma.titulo}
      Source: ${reforma.fuente}
      Date: ${reforma.fecha_publicacion}
      
      ${reforma.contenido}
    `;
    const blob = new Blob([content], { type: 'application/pdf' });
    saveAs(blob, `Reforma_${reforma.id}.pdf`);
    return true;
  } catch (err) {
    console.error("PDF Export failed", err);
    throw err;
  }
};

export const exportToWord = (reforma) => {
  try {
    // Mock Word export
    const content = `
      ${reforma.titulo}
      
      Fuente: ${reforma.fuente} | Fecha: ${reforma.fecha_publicacion}
      
      ${reforma.contenido}
    `;
    const blob = new Blob([content], { type: 'application/msword' });
    saveAs(blob, `Reforma_${reforma.id}.doc`);
    return true;
  } catch (err) {
    console.error("Word Export failed", err);
    throw err;
  }
};
