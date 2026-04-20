import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

/**
 * Check if a reforma with the given URL already exists
 * @param {string} url - The URL to check
 * @returns {Promise<boolean>} True if exists, false otherwise
 */
async function checkDuplicateByUrl(url) {
  try {
    const escapedUrl = url.replace(/"/g, '\\"');
    const result = await pb.collection('reformas').getList(1, 1, {
      filter: `url_fuente = "${escapedUrl}"`,
    });

    const isDuplicate = result.items && result.items.length > 0;
    logger.debug(`Duplicate check for URL ${url}: ${isDuplicate ? 'found' : 'not found'}`);
    return isDuplicate;
  } catch (error) {
    logger.error(`Error checking duplicate by URL: ${error.message}`);
    throw error;
  }
}

/**
 * Save a reforma to PocketBase
 * @param {Object} datosReforma - Reforma data object
 * @returns {Promise<Object>} Created record
 */
async function saveReforma(datosReforma) {
  try {
    // Check for duplicate by URL
    const isDuplicate = await checkDuplicateByUrl(datosReforma.url_fuente);
    if (isDuplicate) {
      logger.debug(`Reforma duplicada encontrada: ${datosReforma.url_fuente}`);
      return null;
    }

    const record = await pb.collection('reformas').create({
      titulo: datosReforma.titulo,
      contenido: datosReforma.contenido || datosReforma.titulo,
      url_fuente: datosReforma.url_fuente,
      materia_legal: datosReforma.materia_legal || 'Otras',
      fecha_publicacion: datosReforma.fecha_publicacion,
      fuente: datosReforma.fuente,
      nivel: datosReforma.nivel,
      estado: datosReforma.estado || '',
    });

    logger.debug(`Reforma guardada en PocketBase: ${record.id}`);
    return record;
  } catch (error) {
    logger.error(`Error guardando reforma en PocketBase: ${error.message}`);
    throw error;
  }
}

/**
 * Save a scrape log entry
 * @param {string} status - Status of the scrape (success/error)
 * @param {number} recordsProcessed - Number of records processed
 * @param {number} recordsSaved - Number of records saved
 * @param {string} errorMessage - Error message if any
 * @returns {Promise<Object>} Created log record
 */
async function saveScrapeLog(status, recordsProcessed, recordsSaved, errorMessage = '') {
  try {
    const record = await pb.collection('scrape_logs').create({
      status,
      records_processed: recordsProcessed,
      records_saved: recordsSaved,
      error_message: errorMessage,
      timestamp: new Date().toISOString(),
    });

    logger.info(`Scrape log saved: ${record.id} (status: ${status})`);
    return record;
  } catch (error) {
    logger.error(`Error saving scrape log: ${error.message}`);
    throw error;
  }
}

/**
 * Get the last scrape status
 * @returns {Promise<Object|null>} Latest scrape log record or null if none exists
 */
async function getLastScrapeStatus() {
  try {
    const result = await pb.collection('scrape_logs').getList(1, 1, {
      sort: '-timestamp',
    });

    if (result.items && result.items.length > 0) {
      const lastLog = result.items[0];
      logger.debug(`Last scrape status retrieved: ${lastLog.id}`);
      return lastLog;
    }

    logger.debug('No scrape logs found');
    return null;
  } catch (error) {
    logger.error(`Error getting last scrape status: ${error.message}`);
    throw error;
  }
}

export { checkDuplicateByUrl, saveReforma, saveScrapeLog, getLastScrapeStatus };
