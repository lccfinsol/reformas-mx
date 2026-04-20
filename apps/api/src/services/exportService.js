import 'dotenv/config';
import logger from '../utils/logger.js';
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

/**
 * Get subscribers with detailed information and pagination
 * @param {Object} filtros - Filter object {materia_legal, fuente, estado, activo, busqueda, page, limit}
 * @param {Object} pb - PocketBase instance
 * @returns {Object} {subscribers: [...], total, page, limit}
 */
async function obtenerSuscriptoresConDetalles(filtros = {}, pb) {
  const page = filtros.page || 1;
  const limit = filtros.limit || 50;

  // Build filter conditions for user_subscriptions
  const conditions = [];

  if (filtros.materia_legal) {
    conditions.push(`materia_legal = "${filtros.materia_legal.replace(/"/g, '\\"')}"`);
  }

  if (filtros.fuente) {
    conditions.push(`fuente = "${filtros.fuente.replace(/"/g, '\\"')}"`);
  }

  if (filtros.estado) {
    conditions.push(`estado = "${filtros.estado.replace(/"/g, '\\"')}"`);
  }

  const filterStr = conditions.length > 0 ? conditions.join(' && ') : '';

  // Get all subscriptions matching filters with expanded user data
  const subscriptions = await pb.collection('user_subscriptions').getFullList({
    filter: filterStr,
    expand: 'user_id',
    sort: '-fecha_creacion',
  });

  // Group by user_id to aggregate subscriptions
  const userMap = new Map();

  for (const sub of subscriptions) {
    const userId = sub.user_id;
    const user = sub.expand?.user_id;

    // Apply activo filter if specified
    if (filtros.activo !== undefined) {
      const userActivo = user?.activo !== false;
      if (userActivo !== filtros.activo) {
        continue;
      }
    }

    if (!userMap.has(userId)) {
      userMap.set(userId, {
        user_id: userId,
        nombre_completo: user?.nombre || user?.name || '',
        email: user?.email || '',
        numero_telefono: user?.numero_telefono || '',
        pais_codigo: user?.pais_codigo || '',
        materias_suscritas: [],
        fuentes_suscritas: [],
        estados_suscritos: [],
        fecha_registro: user?.created || '',
        activo: user?.activo !== false,
      });
    }

    const userData = userMap.get(userId);
    if (!userData.materias_suscritas.includes(sub.materia_legal)) {
      userData.materias_suscritas.push(sub.materia_legal);
    }
    if (!userData.fuentes_suscritas.includes(sub.fuente)) {
      userData.fuentes_suscritas.push(sub.fuente);
    }
    if (!userData.estados_suscritos.includes(sub.estado)) {
      userData.estados_suscritos.push(sub.estado);
    }
  }

  let suscriptores = Array.from(userMap.values());

  // Apply search filter if provided (case-insensitive)
  if (filtros.busqueda) {
    const searchLower = filtros.busqueda.toLowerCase();
    suscriptores = suscriptores.filter(
      sub =>
        sub.nombre_completo.toLowerCase().includes(searchLower) ||
        sub.email.toLowerCase().includes(searchLower)
    );
  }

  // Apply pagination
  const total = suscriptores.length;
  const startIdx = (page - 1) * limit;
  const endIdx = startIdx + limit;
  const paginatedSuscriptores = suscriptores.slice(startIdx, endIdx);

  logger.info(`Obtenidos ${paginatedSuscriptores.length} suscriptores (página ${page}, total ${total})`);

  return {
    subscribers: paginatedSuscriptores,
    total,
    page,
    limit,
  };
}

/**
 * Get statistics about subscribers
 * @param {Object} pb - PocketBase instance
 * @returns {Object} Statistics object with counts
 */
async function obtenerEstadisticas(pb) {
  // Get all subscriptions for statistics
  const allSubscriptions = await pb.collection('user_subscriptions').getFullList();

  // Count unique users
  const uniqueUserIds = new Set(allSubscriptions.map(sub => sub.user_id));
  const totalSuscriptores = uniqueUserIds.size;

  // Get all users to count active/inactive
  const allUsers = await pb.collection('users').getFullList();

  const stats = {
    total_suscriptores: totalSuscriptores,
    por_materia: {},
    por_fuente: {},
    por_estado: {},
    activos: 0,
    inactivos: 0,
  };

  // Count subscriptions by materia, fuente, estado
  for (const sub of allSubscriptions) {
    stats.por_materia[sub.materia_legal] = (stats.por_materia[sub.materia_legal] || 0) + 1;
    stats.por_fuente[sub.fuente] = (stats.por_fuente[sub.fuente] || 0) + 1;
    stats.por_estado[sub.estado] = (stats.por_estado[sub.estado] || 0) + 1;
  }

  // Count active/inactive users
  for (const user of allUsers) {
    if (user.activo !== false) {
      stats.activos++;
    } else {
      stats.inactivos++;
    }
  }

  logger.info(`Estadísticas obtenidas: ${totalSuscriptores} suscriptores únicos`);
  return stats;
}

/**
 * Escape special characters in CSV fields
 * @param {string} field - Field value
 * @returns {string} Escaped field
 */
function escaparCSV(field) {
  if (!field) return '';
  return String(field)
    .replace(/"/g, '""')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ');
}

/**
 * Export subscribers to CSV format
 * @param {Array} suscriptores - Array of subscriber objects
 * @param {Object} estadisticas - Statistics object (unused in CSV)
 * @returns {string} UTF-8 CSV string
 */
function exportarACSV(suscriptores, estadisticas = {}) {
  const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'País', 'Materias Suscritas', 'Fuentes', 'Estados', 'Fecha Registro'];

  const rows = suscriptores.map(sub => [
    sub.user_id || '',
    escaparCSV(sub.nombre_completo || ''),
    escaparCSV(sub.email || ''),
    escaparCSV(sub.numero_telefono || ''),
    escaparCSV(sub.pais_codigo || ''),
    escaparCSV((sub.materias_suscritas || []).join('; ')),
    escaparCSV((sub.fuentes_suscritas || []).join('; ')),
    escaparCSV((sub.estados_suscritos || []).join('; ')),
    sub.fecha_registro || '',
  ]);

  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  logger.info(`CSV exportado: ${suscriptores.length} suscriptores`);
  return csvContent;
}

/**
 * Export subscribers to Excel format
 * @param {Array} suscriptores - Array of subscriber objects
 * @param {Object} estadisticas - Statistics object
 * @returns {Buffer} Excel file buffer
 */
function exportarAExcel(suscriptores, estadisticas = {}) {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Suscriptores
  const subscribersData = suscriptores.map(sub => ({
    'ID': sub.user_id || '',
    'Nombre': sub.nombre_completo || '',
    'Email': sub.email || '',
    'Teléfono': sub.numero_telefono || '',
    'País': sub.pais_codigo || '',
    'Materias': (sub.materias_suscritas || []).join('; '),
    'Fuentes': (sub.fuentes_suscritas || []).join('; '),
    'Estados': (sub.estados_suscritos || []).join('; '),
    'Fecha Registro': sub.fecha_registro || '',
  }));

  const subscribersSheet = XLSX.utils.json_to_sheet(subscribersData);

  // Make headers bold and add background color
  for (let col = 1; col <= 9; col++) {
    const cellRef = XLSX.utils.encode_col(col - 1) + '1';
    if (subscribersSheet[cellRef]) {
      subscribersSheet[cellRef].font = { bold: true };
      subscribersSheet[cellRef].fill = { fgColor: { rgb: 'FFD3D3D3' } };
      subscribersSheet[cellRef].border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    }
  }

  // Add borders to all data cells
  for (let row = 2; row <= subscribersData.length + 1; row++) {
    for (let col = 1; col <= 9; col++) {
      const cellRef = XLSX.utils.encode_col(col - 1) + row;
      if (subscribersSheet[cellRef]) {
        subscribersSheet[cellRef].border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }
  }

  // Set column widths
  subscribersSheet['!cols'] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
    { wch: 30 },
    { wch: 25 },
    { wch: 30 },
    { wch: 15 },
  ];

  XLSX.utils.book_append_sheet(workbook, subscribersSheet, 'Suscriptores');

  // Sheet 2: Estadísticas
  const statsData = [];
  statsData.push({ 'Métrica': `Total de suscriptores: ${suscriptores.length}`, 'Cantidad': '' });
  statsData.push({ 'Métrica': '', 'Cantidad': '' });
  statsData.push({ 'Métrica': 'Materia', 'Cantidad': 'Cantidad' });

  for (const [materia, count] of Object.entries(estadisticas.por_materia || {})) {
    statsData.push({ 'Métrica': materia, 'Cantidad': count });
  }

  statsData.push({ 'Métrica': '', 'Cantidad': '' });
  statsData.push({ 'Métrica': 'Fuente', 'Cantidad': 'Cantidad' });

  for (const [fuente, count] of Object.entries(estadisticas.por_fuente || {})) {
    statsData.push({ 'Métrica': fuente, 'Cantidad': count });
  }

  statsData.push({ 'Métrica': '', 'Cantidad': '' });
  statsData.push({ 'Métrica': 'Estado', 'Cantidad': 'Cantidad' });

  for (const [estado, count] of Object.entries(estadisticas.por_estado || {}).slice(0, 15)) {
    statsData.push({ 'Métrica': estado, 'Cantidad': count });
  }

  statsData.push({ 'Métrica': '', 'Cantidad': '' });
  statsData.push({ 'Métrica': 'Activos', 'Cantidad': estadisticas.activos || 0 });
  statsData.push({ 'Métrica': 'Inactivos', 'Cantidad': estadisticas.inactivos || 0 });

  const statsSheet = XLSX.utils.json_to_sheet(statsData);
  statsSheet.A1.font = { bold: true };
  statsSheet.B1.font = { bold: true };
  statsSheet.A1.fill = { fgColor: { rgb: 'FFD3D3D3' } };
  statsSheet.B1.fill = { fgColor: { rgb: 'FFD3D3D3' } };
  statsSheet['!cols'] = [{ wch: 30 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estadísticas');

  // Sheet 3: Contactos
  const contactsData = suscriptores.map(sub => ({
    'ID': sub.user_id || '',
    'Nombre': sub.nombre_completo || '',
    'Email': sub.email || '',
    'Teléfono': sub.numero_telefono || '',
    'País': sub.pais_codigo || '',
  }));

  const contactsSheet = XLSX.utils.json_to_sheet(contactsData);
  contactsSheet.A1.font = { bold: true };
  contactsSheet.B1.font = { bold: true };
  contactsSheet.C1.font = { bold: true };
  contactsSheet.D1.font = { bold: true };
  contactsSheet.E1.font = { bold: true };
  contactsSheet.A1.fill = { fgColor: { rgb: 'FFD3D3D3' } };
  contactsSheet.B1.fill = { fgColor: { rgb: 'FFD3D3D3' } };
  contactsSheet.C1.fill = { fgColor: { rgb: 'FFD3D3D3' } };
  contactsSheet.D1.fill = { fgColor: { rgb: 'FFD3D3D3' } };
  contactsSheet.E1.fill = { fgColor: { rgb: 'FFD3D3D3' } };
  contactsSheet['!cols'] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(workbook, contactsSheet, 'Contactos');

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  logger.info(`Excel exportado: ${suscriptores.length} suscriptores`);
  return buffer;
}

/**
 * Export subscribers to PDF format
 * @param {Array} suscriptores - Array of subscriber objects
 * @param {Object} estadisticas - Statistics object
 * @returns {Promise<Buffer>} PDF file buffer
 */
function exportarAPDF(suscriptores, estadisticas = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const now = new Date();
      const dateStr = now.toLocaleDateString('es-MX');

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text('Portal de Reformas Legales', { align: 'center' });
      doc.fontSize(14).font('Helvetica').text('Reporte de Suscriptores', { align: 'center' });
      doc.fontSize(10).text(`Generado: ${dateStr}`, { align: 'center' });
      doc.moveDown();

      // Subscriber table
      doc.fontSize(12).font('Helvetica-Bold').text('Suscriptores', { underline: true });
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 140;
      const col3 = 250;
      const col4 = 340;
      const col5 = 450;
      const rowHeight = 18;

      // Table headers
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Nombre', col1, tableTop);
      doc.text('Email', col2, tableTop);
      doc.text('Teléfono', col3, tableTop);
      doc.text('Materias', col4, tableTop);
      doc.text('Fuentes', col5, tableTop);

      doc.moveTo(50, tableTop + 12).lineTo(550, tableTop + 12).stroke();

      // Table rows
      doc.fontSize(8).font('Helvetica');
      let currentY = tableTop + 16;
      const pageHeight = doc.page.height - 80;

      for (const sub of suscriptores.slice(0, 25)) {
        if (currentY > pageHeight) {
          doc.addPage();
          currentY = 50;
          doc.fontSize(9).font('Helvetica-Bold');
          doc.text('Nombre', col1, currentY);
          doc.text('Email', col2, currentY);
          doc.text('Teléfono', col3, currentY);
          doc.text('Materias', col4, currentY);
          doc.text('Fuentes', col5, currentY);
          doc.moveTo(50, currentY + 12).lineTo(550, currentY + 12).stroke();
          currentY += 16;
          doc.fontSize(8).font('Helvetica');
        }

        doc.text(sub.nombre_completo || '', col1, currentY, { width: 80 });
        doc.text(sub.email || '', col2, currentY, { width: 100 });
        doc.text(sub.numero_telefono || '', col3, currentY, { width: 80 });
        doc.text((sub.materias_suscritas || []).join(', '), col4, currentY, { width: 90 });
        doc.text((sub.fuentes_suscritas || []).join(', '), col5, currentY, { width: 80 });
        currentY += rowHeight;
      }

      // Page 2: Statistics
      doc.addPage();
      doc.fontSize(12).font('Helvetica-Bold').text('Estadísticas', { underline: true });
      doc.moveDown();

      doc.fontSize(10).font('Helvetica-Bold').text(`Total de Suscriptores: ${suscriptores.length}`);
      doc.moveDown(0.5);

      if (Object.keys(estadisticas.por_materia || {}).length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').text('Por Materia Legal:');
        for (const [materia, count] of Object.entries(estadisticas.por_materia || {}).slice(0, 10)) {
          doc.fontSize(8).font('Helvetica').text(`  ${materia}: ${count}`);
        }
        doc.moveDown(0.5);
      }

      if (Object.keys(estadisticas.por_fuente || {}).length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').text('Por Fuente:');
        for (const [fuente, count] of Object.entries(estadisticas.por_fuente || {})) {
          doc.fontSize(8).font('Helvetica').text(`  ${fuente}: ${count}`);
        }
        doc.moveDown(0.5);
      }

      if (Object.keys(estadisticas.por_estado || {}).length > 0) {
        doc.fontSize(9).font('Helvetica-Bold').text('Por Estado:');
        for (const [estado, count] of Object.entries(estadisticas.por_estado || {}).slice(0, 15)) {
          doc.fontSize(8).font('Helvetica').text(`  ${estado}: ${count}`);
        }
        doc.moveDown(0.5);
      }

      doc.fontSize(9).font('Helvetica-Bold').text('Resumen:');
      doc.fontSize(8).font('Helvetica').text(`  Activos: ${estadisticas.activos || 0}`);
      doc.fontSize(8).font('Helvetica').text(`  Inactivos: ${estadisticas.inactivos || 0}`);

      // Footer with page numbers
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).font('Helvetica').text(
          `Página ${i + 1} de ${pageCount} | ${dateStr} | Documento confidencial`,
          50,
          doc.page.height - 30,
          { align: 'center' }
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Export subscribers to JSON format
 * @param {Array} suscriptores - Array of subscriber objects
 * @param {Object} estadisticas - Statistics object
 * @returns {string} JSON string
 */
function exportarAJSON(suscriptores, estadisticas = {}) {
  const now = new Date();
  const jsonData = {
    metadata: {
      fecha_generacion: now.toISOString(),
      total_suscriptores: suscriptores.length,
      generado_por: 'admin',
    },
    suscriptores: suscriptores.map(sub => ({
      user_id: sub.user_id,
      nombre_completo: sub.nombre_completo,
      email: sub.email,
      numero_telefono: sub.numero_telefono,
      pais_codigo: sub.pais_codigo,
      materias_suscritas: sub.materias_suscritas || [],
      fuentes_suscritas: sub.fuentes_suscritas || [],
      estados_suscritos: sub.estados_suscritos || [],
      fecha_registro: sub.fecha_registro,
      activo: sub.activo,
    })),
    estadisticas: {
      por_materia: estadisticas.por_materia || {},
      por_fuente: estadisticas.por_fuente || {},
      por_estado: estadisticas.por_estado || {},
      activos: estadisticas.activos || 0,
      inactivos: estadisticas.inactivos || 0,
    },
  };

  logger.info(`JSON exportado: ${suscriptores.length} suscriptores`);
  return JSON.stringify(jsonData, null, 2);
}

export {
  obtenerSuscriptoresConDetalles,
  obtenerEstadisticas,
  exportarACSV,
  exportarAExcel,
  exportarAPDF,
  exportarAJSON,
};
