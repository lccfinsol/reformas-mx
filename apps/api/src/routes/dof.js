import express from 'express';
import { scrapeReformas } from '../services/dofScraper.js';
import { checkDuplicateByUrl, saveReforma, saveScrapeLog, getLastScrapeStatus } from '../services/pocketbaseService.js';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

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

// POST /scrape-dof - Manual scraping trigger
router.post('/scrape-dof', async (req, res) => {
  let recordsProcessed = 0;
  let recordsSaved = 0;
  const errors = [];
  const fecha = req.query.fecha || getYesterdayDate();

  logger.info(`Iniciando scraping manual para ${fecha}...`);

  const reformas = await scrapeReformas(fecha);
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

  logger.info(`Scraping completado. Procesadas: ${recordsProcessed}, Guardadas: ${recordsSaved}, Errores: ${errors.length}`);

  res.json({
    success: true,
    recordsProcessed,
    recordsSaved,
    errors,
  });
});

// GET /scrape-dof/status - Get last scrape status
router.get('/scrape-dof/status', async (req, res) => {
  const lastExecution = await getLastScrapeStatus();

  const recentLogs = await pb.collection('scrape_logs').getList(1, 5, {
    sort: '-timestamp',
  });

  res.json({
    lastExecution,
    recentLogs: recentLogs.items.map(log => ({
      timestamp: log.timestamp,
      status: log.status,
      recordsProcessed: log.records_processed,
      recordsSaved: log.records_saved,
      errorMessage: log.error_message,
    })),
  });
});

// GET /scrape-dof/logs - Get logs from last 30 days
router.get('/scrape-dof/logs', async (req, res) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  const logs = await pb.collection('scrape_logs').getFullList({
    filter: `timestamp >= "${thirtyDaysAgoISO}"`,
    sort: '-timestamp',
  });

  res.json({
    logs: logs.map(log => ({
      timestamp: log.timestamp,
      status: log.status,
      recordsProcessed: log.records_processed,
      recordsSaved: log.records_saved,
      errorMessage: log.error_message,
    })),
    totalRecords: logs.length,
  });
});

export default router;
