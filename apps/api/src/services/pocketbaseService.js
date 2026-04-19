/**
 * Servicio de acceso a PocketBase.
 *
 * CORRECCIONES APLICADAS:
 * 1. LÓGICA CRÍTICA - checkDuplicateByUrl: buscaba por campo `url` pero la
 *    colección `reformas` usa `url_fuente`. La deduplicación nunca funcionaba.
 * 2. LÓGICA - saveReforma: el campo `url` se enviaba como `url_fuente` en la
 *    migración pero el scraper original usaba `url`. Se normaliza aquí.
 * 3. MEJORA - saveScrapeLog: se añade campo `fecha` para facilitar consultas.
 * 4. SEGURIDAD - Try/catch explícito en todas las operaciones críticas.
 */

import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

/**
 * Verifica si ya existe una reforma con la misma URL fuente.
 * CORRECCIÓN: usa url_fuente (nombre correcto en la BD).
 */
async function checkDuplicateByUrl(urlFuente) {
  if (!urlFuente) return false;

  try {
    const escaped = urlFuente.replace(/"/g, '\\"');
    const result = await pb.collection('reformas').getList(1, 1, {
      filter: `url_fuente = "${escaped}"`,
    });
    return result.totalItems > 0;
  } catch (error) {
    logger.error('Error verificando duplicado:', error.message);
    return false; // En caso de error, no bloquear el guardado
  }
}

/**
 * Guarda una reforma en PocketBase.
 * Normaliza los campos para que coincidan con el schema de la BD.
 */
async function saveReforma(reforma) {
  const payload = {
    titulo: reforma.titulo,
    // CORRECCIÓN: descripcion_corta como resumen truncado si no existe
    descripcion_corta: reforma.descripcion_corta || reforma.titulo.substring(0, 200),
    contenido: reforma.contenido || reforma.titulo,
    fecha_publicacion: reforma.fecha_publicacion,
    fuente: reforma.fuente || 'Otros',
    nivel: reforma.nivel || 'Federal',
    materia_legal: reforma.materia_legal || 'Otro',
    url_fuente: reforma.url_fuente || reforma.url || '',   // CORRECCIÓN: normalización
    tipo_cambio: reforma.tipo_cambio || 'Otro',
    impacto: reforma.impacto || 'Bajo',
    estado: reforma.estado || 'Federal',
    resumen_extraido: reforma.resumen_extraido || '',
    ordenamiento_afectado: reforma.ordenamiento_afectado || '',
    ambito: reforma.ambito || '',
  };

  try {
    const record = await pb.collection('reformas').create(payload);
    logger.debug(`Reforma guardada: ${record.id} — ${payload.titulo.substring(0, 60)}`);
    return record;
  } catch (error) {
    logger.error(`Error guardando reforma "${payload.titulo.substring(0, 60)}":`, error.message);
    throw error;
  }
}

/**
 * Guarda un log de ejecución del scraper.
 */
async function saveScrapeLog(status, processed, saved, errorMsg = '') {
  try {
    const record = await pb.collection('scrape_logs').create({
      status,
      records_processed: processed,
      records_saved: saved,
      error_message: errorMsg,
      fecha: new Date().toISOString().split('T')[0], // MEJORA: campo fecha
      executed_at: new Date().toISOString(),
    });
    logger.debug(`Scrape log guardado: ${record.id}`);
    return record;
  } catch (error) {
    // No lanzar — el log fallido no debe interrumpir el flujo principal
    logger.error('Error guardando scrape log:', error.message);
    return null;
  }
}

/**
 * Obtiene lista de reformas con filtros opcionales.
 */
async function getReformas({ page = 1, limit = 20, filter = '', sort = '-fecha_publicacion' } = {}) {
  return pb.collection('reformas').getList(page, limit, { filter, sort });
}

/**
 * Obtiene una reforma por ID.
 */
async function getReformaById(id) {
  return pb.collection('reformas').getOne(id);
}

export {
  checkDuplicateByUrl,
  saveReforma,
  saveScrapeLog,
  getReformas,
  getReformaById,
};
