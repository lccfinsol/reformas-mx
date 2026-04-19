import 'dotenv/config';
import cron from 'node-cron';
import { scrapeReformas } from './dofScraper.js';
import { checkDuplicateByUrl, saveReforma, saveScrapeLog } from './pocketbaseService.js';
import logger from '../utils/logger.js';

function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

async function executeScrapingJob() {
  const startTime = new Date();
  let recordsProcessed = 0;
  let recordsSaved = 0;
  const errors = [];

  try {
    const yesterday = getYesterdayDate();
    logger.info(`Iniciando job de scraping automático para ${yesterday}...`);

    const reformas = await scrapeReformas(yesterday);
    recordsProcessed = reformas.length;

    for (const reforma of reformas) {
      try {
        // Validate data
        if (!reforma.titulo || reforma.titulo.trim() === '') {
          errors.push(`Saltada reforma con título vacío`);
          continue;
        }

        if (!isValidUrl(reforma.url)) {
          errors.push(`Saltada reforma con URL inválida: ${reforma.url}`);
          continue;
        }

        // Check for duplicates
        const isDuplicate = await checkDuplicateByUrl(reforma.url);
        if (isDuplicate) {
          logger.debug(`Reforma duplicada saltada: ${reforma.url}`);
          continue;
        }

        // Save to PocketBase
        await saveReforma(reforma);
        recordsSaved++;
      } catch (error) {
        const errorMsg = `Error procesando reforma "${reforma.titulo}": ${error.message}`;
        logger.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Log execution
    await saveScrapeLog('success', recordsProcessed, recordsSaved, errors.length > 0 ? errors.join('; ') : '');

    const duration = Math.round((new Date() - startTime) / 1000);
    logger.info(
      `Job de scraping completado en ${duration}s. Procesadas: ${recordsProcessed}, Guardadas: ${recordsSaved}, Errores: ${errors.length}`
    );
  } catch (error) {
    logger.error(`Job de scraping falló: ${error.message}`);

    try {
      await saveScrapeLog('error', recordsProcessed, recordsSaved, error.message);
    } catch (logError) {
      logger.error(`Falló guardar log de error: ${logError.message}`);
    }
  }
}

let scheduledTask = null;

function startScheduler() {
  if (scheduledTask) {
    logger.warn('Scheduler ya está ejecutándose');
    return;
  }

  // Schedule for 6 AM daily (0 6 * * *)
  scheduledTask = cron.schedule('0 6 * * *', executeScrapingJob, {
    scheduled: true,
  });

  logger.info('Scheduler de scraping DOF iniciado (diariamente a las 6 AM)');
}

function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('Scheduler de scraping DOF detenido');
  }
}

export { startScheduler, stopScheduler, executeScrapingJob };
