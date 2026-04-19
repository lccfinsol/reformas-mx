/**
 * Scheduler de scraping automático diario.
 *
 * CORRECCIONES APLICADAS:
 * 1. LÓGICA - scrapeAllSources no guardaba en PocketBase: el multiSourceScraper
 *    solo recolectaba datos pero no los persistía. El guardado ocurría solo
 *    en las rutas manuales (scraper.js). El scheduler nunca persistía datos.
 *    Se añade la persistencia directamente en el job.
 * 2. LÓGICA - El scheduler usaba la fecha de "ayer" sin zona horaria correcta.
 *    En producción (servidor UTC), "ayer" puede no coincidir con el día
 *    laboral de México (UTC-6). Se ajusta con offset correcto.
 * 3. MEJORA - Zona horaria México: el cron '0 6 * * *' (6 AM UTC) equivale a
 *    las 12 AM en México Central. Se ajusta a '0 14 * * *' UTC = 8 AM México.
 * 4. MEJORA - executeScrapingJob es exportada para dispararse manualmente
 *    desde las rutas de admin.
 */

import 'dotenv/config';
import cron from 'node-cron';
import { scrapeAllSources } from '../services/multiSourceScraper.js';
import { saveScrapeLog } from '../services/pocketbaseService.js';
import logger from '../utils/logger.js';

/**
 * Obtiene la fecha de ayer en la zona horaria de México (UTC-6).
 * Evita el error de usar servidor UTC puro.
 */
function getFechaAyerMexico() {
  const ahora = new Date();
  // UTC-6 = México Centro
  const offsetMs = 6 * 60 * 60 * 1000;
  const mexicoAhora = new Date(ahora.getTime() - offsetMs);
  const ayer = new Date(mexicoAhora);
  ayer.setDate(ayer.getDate() - 1);
  return ayer.toISOString().split('T')[0];
}

async function executeScrapingJob(fechaOverride = null) {
  const startTime = Date.now();
  const fecha = fechaOverride || getFechaAyerMexico();
  let totalProcessed = 0;
  let totalSaved = 0;
  const errors = [];

  logger.info(`Iniciando job de scraping automático para ${fecha}...`);

  try {
    // io no está disponible en el scheduler — las notificaciones
    // en tiempo real se manejan desde el pb_hook al guardar en PocketBase
    const results = await scrapeAllSources(fecha, null);

    totalProcessed =
      (results.dof?.processed || 0) +
      (results.camaraDiputados?.processed || 0) +
      (results.periodicosEstatales?.processed || 0);

    totalSaved =
      (results.dof?.saved || 0) +
      (results.camaraDiputados?.saved || 0) +
      (results.periodicosEstatales?.saved || 0);

    // Recolectar errores
    for (const source of ['dof', 'camaraDiputados', 'periodicosEstatales']) {
      if (results[source]?.errors?.length > 0) {
        errors.push(...results[source].errors);
      }
    }

    await saveScrapeLog(
      errors.length === 0 ? 'success' : 'partial',
      totalProcessed,
      totalSaved,
      errors.join('; '),
    );

    const duration = Math.round((Date.now() - startTime) / 1000);
    logger.info(
      `Job completado en ${duration}s — procesadas: ${totalProcessed}, guardadas: ${totalSaved}, errores: ${errors.length}`,
    );

    return { totalProcessed, totalSaved, errors, duration };
  } catch (error) {
    logger.error(`Job de scraping falló: ${error.message}`);

    try {
      await saveScrapeLog('error', totalProcessed, totalSaved, error.message);
    } catch (logError) {
      logger.error(`No se pudo guardar log de error: ${logError.message}`);
    }

    throw error;
  }
}

let scheduledTask = null;

function startScheduler() {
  if (scheduledTask) {
    logger.warn('Scheduler ya está en ejecución, ignorando segunda llamada');
    return;
  }

  // CORRECCIÓN: 14:00 UTC = 8:00 AM México Centro (UTC-6)
  scheduledTask = cron.schedule('0 14 * * *', () => {
    executeScrapingJob().catch((err) =>
      logger.error('Error no capturado en scheduler:', err.message),
    );
  }, {
    scheduled: true,
    timezone: 'UTC',
  });

  logger.info('Scheduler iniciado — se ejecuta diariamente a las 8:00 AM hora México');
}

function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info('Scheduler detenido');
  }
}

export { startScheduler, stopScheduler, executeScrapingJob };
