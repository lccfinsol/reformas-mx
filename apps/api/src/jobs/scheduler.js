import 'dotenv/config';
import cron from 'node-cron';
import { scrapeAllSources } from '../services/multiSourceScraper.js';
import logger from '../utils/logger.js';

function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

async function executeScrapingJob() {
  const startTime = new Date();
  const fecha = getYesterdayDate();

  logger.info(`Iniciando job de scraping automático para ${fecha}...`);

  const results = await scrapeAllSources(fecha);

  const totalProcessed = results.dof.processed + results.camaraDiputados.processed + results.periodicosEstatales.processed;
  const totalSaved = results.dof.saved + results.camaraDiputados.saved + results.periodicosEstatales.saved;
  const totalErrors = results.dof.errors.length + results.camaraDiputados.errors.length + results.periodicosEstatales.errors.length;

  const duration = Math.round((new Date() - startTime) / 1000);
  logger.info(
    `Job de scraping completado en ${duration}s. Procesadas: ${totalProcessed}, Guardadas: ${totalSaved}, Errores: ${totalErrors}`
  );
}

let scheduledTask = null;

function startScheduler() {
  if (scheduledTask) {
    logger.warn('Scheduler ya está ejecutándose');
    return;
  }

  // Schedule for 14:00 UTC (8:00 AM Mexico time) - '0 14 * * *'
  scheduledTask = cron.schedule('0 14 * * *', executeScrapingJob, {
    scheduled: true,
  });

  logger.info('Scheduler de scraping iniciado (diariamente a las 14:00 UTC / 8:00 AM México)');
}

function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('Scheduler de scraping detenido');
  }
}

export { startScheduler, stopScheduler, executeScrapingJob };
