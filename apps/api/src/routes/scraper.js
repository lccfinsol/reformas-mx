import express from 'express';
import { scrapeReformas } from '../services/dofScraper.js';
import { scrapeCamaraDiputados } from '../services/camaraDiputadosScraper.js';
import { scrapePeriodicosEstatales } from '../services/periodicosEstatalesScraper.js';
import { scrapeAllSources } from '../services/multiSourceScraper.js';
import { checkDuplicateByUrl, saveReforma, saveScrapeLog } from '../services/pocketbaseService.js';
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

function getCurrentTimestamp() {
  return new Date().toISOString();
}

// POST /scrape-dof - Manual DOF scraping trigger
router.post('/scrape-dof', async (req, res) => {
  let recordsProcessed = 0;
  let recordsSaved = 0;
  const errors = [];
  const fecha = req.query.fecha || getYesterdayDate();
  const timestamp = getCurrentTimestamp();

  logger.info(`Iniciando scraping manual DOF para ${fecha}...`);

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

  logger.info(`Scraping DOF completado. Procesadas: ${recordsProcessed}, Guardadas: ${recordsSaved}, Errores: ${errors.length}`);

  res.json({
    success: true,
    message: 'DOF scraping completed',
    data: {
      recordsProcessed,
      recordsSaved,
      errors,
    },
    timestamp,
  });
});

// POST /scrape-camara - Manual Cámara de Diputados scraping trigger
router.post('/scrape-camara', async (req, res) => {
  let recordsProcessed = 0;
  let recordsSaved = 0;
  const errors = [];
  const fecha = req.query.fecha || getYesterdayDate();
  const timestamp = getCurrentTimestamp();

  logger.info(`Iniciando scraping manual Cámara de Diputados para ${fecha}...`);

  const iniciativas = await scrapeCamaraDiputados(fecha);
  recordsProcessed = iniciativas.length;

  for (const iniciativa of iniciativas) {
    try {
      // Validate data
      if (!iniciativa.titulo || iniciativa.titulo.trim() === '') {
        errors.push(`Saltada iniciativa con título vacío`);
        continue;
      }

      if (!isValidUrl(iniciativa.url)) {
        errors.push(`Saltada iniciativa con URL inválida: ${iniciativa.url}`);
        continue;
      }

      // Check for duplicates
      const isDuplicate = await checkDuplicateByUrl(iniciativa.url);
      if (isDuplicate) {
        logger.debug(`Iniciativa duplicada saltada: ${iniciativa.url}`);
        continue;
      }

      // Save to PocketBase
      await saveReforma(iniciativa);
      recordsSaved++;
    } catch (error) {
      const errorMsg = `Error procesando iniciativa "${iniciativa.titulo}": ${error.message}`;
      logger.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  // Log execution
  await saveScrapeLog('success', recordsProcessed, recordsSaved, errors.length > 0 ? errors.join('; ') : '');

  logger.info(`Scraping Cámara completado. Procesadas: ${recordsProcessed}, Guardadas: ${recordsSaved}, Errores: ${errors.length}`);

  res.json({
    success: true,
    message: 'Cámara de Diputados scraping completed',
    data: {
      recordsProcessed,
      recordsSaved,
      errors,
    },
    timestamp,
  });
});

// POST /scrape-periodicos - Manual Periódicos Estatales scraping trigger
router.post('/scrape-periodicos', async (req, res) => {
  let recordsProcessed = 0;
  let recordsSaved = 0;
  const errors = [];
  const fecha = req.query.fecha || getYesterdayDate();
  const timestamp = getCurrentTimestamp();

  logger.info(`Iniciando scraping manual Periódicos Estatales para ${fecha}...`);

  const publicaciones = await scrapePeriodicosEstatales(fecha);
  recordsProcessed = publicaciones.length;

  for (const publicacion of publicaciones) {
    try {
      // Validate data
      if (!publicacion.titulo || publicacion.titulo.trim() === '') {
        errors.push(`Saltada publicación con título vacío`);
        continue;
      }

      if (!isValidUrl(publicacion.url)) {
        errors.push(`Saltada publicación con URL inválida: ${publicacion.url}`);
        continue;
      }

      // Check for duplicates
      const isDuplicate = await checkDuplicateByUrl(publicacion.url);
      if (isDuplicate) {
        logger.debug(`Publicación duplicada saltada: ${publicacion.url}`);
        continue;
      }

      // Save to PocketBase
      await saveReforma(publicacion);
      recordsSaved++;
    } catch (error) {
      const errorMsg = `Error procesando publicación "${publicacion.titulo}": ${error.message}`;
      logger.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  // Log execution
  await saveScrapeLog('success', recordsProcessed, recordsSaved, errors.length > 0 ? errors.join('; ') : '');

  logger.info(`Scraping Periódicos completado. Procesadas: ${recordsProcessed}, Guardadas: ${recordsSaved}, Errores: ${errors.length}`);

  res.json({
    success: true,
    message: 'Periódicos Estatales scraping completed',
    data: {
      recordsProcessed,
      recordsSaved,
      errors,
    },
    timestamp,
  });
});

// POST /scrape-all - Manual scraping trigger for all sources
router.post('/scrape-all', async (req, res) => {
  const fecha = req.query.fecha || getYesterdayDate();
  const timestamp = getCurrentTimestamp();

  logger.info(`Iniciando scraping manual de todas las fuentes para ${fecha}...`);

  const results = await scrapeAllSources(fecha);

  const totalProcessed = (results.dof?.processed || 0) + (results.camaraDiputados?.processed || 0) + (results.periodicosEstatales?.processed || 0);
  const totalSaved = (results.dof?.saved || 0) + (results.camaraDiputados?.saved || 0) + (results.periodicosEstatales?.saved || 0);
  const totalErrors = (results.dof?.errors?.length || 0) + (results.camaraDiputados?.errors?.length || 0) + (results.periodicosEstatales?.errors?.length || 0);

  // Log consolidated execution
  const consolidatedErrors = [
    ...(results.dof?.errors || []),
    ...(results.camaraDiputados?.errors || []),
    ...(results.periodicosEstatales?.errors || []),
  ];
  await saveScrapeLog('success', totalProcessed, totalSaved, consolidatedErrors.length > 0 ? consolidatedErrors.join('; ') : '');

  logger.info(`Scraping de todas las fuentes completado. Total procesadas: ${totalProcessed}, Guardadas: ${totalSaved}, Errores: ${totalErrors}`);

  res.json({
    success: true,
    message: 'All sources scraping completed',
    data: {
      totalProcessed,
      totalSaved,
      totalErrors,
      sources: results,
    },
    timestamp,
  });
});

// GET /scrape-status - Get last scrape status
router.get('/scrape-status', async (req, res) => {
  const timestamp = getCurrentTimestamp();
  const lastExecution = await pb.collection('scrape_logs').getFirstListItem('', {
    sort: '-timestamp',
  }).catch(() => null);

  const recentLogs = await pb.collection('scrape_logs').getList(1, 5, {
    sort: '-timestamp',
  });

  res.json({
    success: true,
    message: 'Scrape status retrieved',
    data: {
      lastExecution: lastExecution ? {
        timestamp: lastExecution.timestamp,
        status: lastExecution.status,
        recordsProcessed: lastExecution.records_processed,
        recordsSaved: lastExecution.records_saved,
      } : null,
      recentLogs: recentLogs.items.map(log => ({
        timestamp: log.timestamp,
        status: log.status,
        recordsProcessed: log.records_processed,
        recordsSaved: log.records_saved,
        errorMessage: log.error_message,
      })),
    },
    timestamp,
  });
});

// GET /scrape-logs - Get logs from last 30 days
router.get('/scrape-logs', async (req, res) => {
  const timestamp = getCurrentTimestamp();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  const logs = await pb.collection('scrape_logs').getFullList({
    filter: `timestamp >= "${thirtyDaysAgoISO}"`,
    sort: '-timestamp',
  });

  res.json({
    success: true,
    message: 'Scrape logs retrieved',
    data: {
      logs: logs.map(log => ({
        timestamp: log.timestamp,
        status: log.status,
        recordsProcessed: log.records_processed,
        recordsSaved: log.records_saved,
        errorMessage: log.error_message,
      })),
      totalRecords: logs.length,
    },
    timestamp,
  });
});

export default router;
