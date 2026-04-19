/**
 * Orquestador multi-fuente de scraping.
 *
 * CORRECCIONES APLICADAS:
 * 1. LÓGICA CRÍTICA - scrapeAllSources no persistía datos: recolectaba reformas
 *    de los 3 scrapers pero nunca llamaba a saveReforma ni checkDuplicateByUrl.
 *    Los datos se perdían en memoria. Se añade el guardado con deduplicación.
 * 2. LÓGICA - Promise.allSettled mal utilizada: usaba .then() encadenado sobre
 *    el resultado de Promise.allSettled, perdiendo el estado rejected. Se
 *    corrige para manejar correctamente el resultado de cada promesa.
 * 3. MEJORA - Se exporta notificarUsuarios para uso desde rutas de admin.
 */

import 'dotenv/config';
import { scrapeReformas } from './dofScraper.js';
import { scrapeCamaraDiputados } from './camaraDiputadosScraper.js';
import { scrapePeriodicosEstatales } from './periodicosEstatalesScraper.js';
import {
  obtenerSuscriptoresParaReforma,
  enviarNotificacionEmail,
  crearRegistroNotificacion,
  notificarEnTiempoReal,
} from './notificationService.js';
import { checkDuplicateByUrl, saveReforma } from './pocketbaseService.js';
import logger from '../utils/logger.js';

function formatearFecha(fecha) {
  if (typeof fecha === 'string') return fecha;
  if (fecha instanceof Date) return fecha.toISOString().split('T')[0];
  throw new Error('Fecha debe ser Date object o string YYYY-MM-DD');
}

async function notificarUsuarios(reforma, io) {
  try {
    const subscribers = await obtenerSuscriptoresParaReforma(reforma);
    const emailSubscribers = subscribers.filter((s) => s.notificaciones_email);
    const realtimeSubscribers = subscribers.filter((s) => s.notificaciones_tiempo_real);

    for (const subscriber of emailSubscribers) {
      await enviarNotificacionEmail(subscriber, reforma);
    }

    if (realtimeSubscribers.length > 0 && io) {
      const userIds = realtimeSubscribers.map((s) => s.userId);
      notificarEnTiempoReal(userIds, reforma, io);

      for (const userId of userIds) {
        await crearRegistroNotificacion(userId, reforma.id, 'tiempo_real');
      }
    }

    logger.info(
      `Notificaciones para "${reforma.titulo}": ${emailSubscribers.length} email, ${realtimeSubscribers.length} tiempo real`,
    );
  } catch (error) {
    logger.error('Error en notificarUsuarios:', error.message);
  }
}

/**
 * CORRECCIÓN: Procesa y persiste un array de reformas de una fuente.
 * Retorna estadísticas { processed, saved, errors }.
 */
async function procesarYGuardarReformas(reformas, io) {
  let saved = 0;
  const errors = [];

  for (const reforma of reformas) {
    try {
      if (!reforma.titulo?.trim()) {
        errors.push('Reforma sin título omitida');
        continue;
      }

      // Deduplicación por URL fuente
      if (reforma.url_fuente) {
        const isDuplicate = await checkDuplicateByUrl(reforma.url_fuente);
        if (isDuplicate) {
          logger.debug(`Duplicado omitido: ${reforma.url_fuente}`);
          continue;
        }
      }

      const record = await saveReforma(reforma);
      saved++;

      // Notificar usuarios si hay io disponible
      if (io && record) {
        await notificarUsuarios({ ...reforma, id: record.id }, io);
      }
    } catch (error) {
      const msg = `Error guardando reforma "${reforma.titulo?.substring(0, 40)}": ${error.message}`;
      logger.error(msg);
      errors.push(msg);
    }
  }

  return { processed: reformas.length, saved, errors };
}

async function scrapeAllSources(fecha, io = null) {
  const fechaFormato = formatearFecha(fecha);
  logger.info(`Iniciando scraping de todas las fuentes para ${fechaFormato}...`);

  // CORRECCIÓN: Promise.allSettled correcto
  const [dofResult, camaraResult, periodicosResult] = await Promise.allSettled([
    scrapeReformas(fechaFormato),
    scrapeCamaraDiputados(fechaFormato),
    scrapePeriodicosEstatales(fechaFormato),
  ]);

  const results = {
    dof: { data: [], processed: 0, saved: 0, errors: [] },
    camaraDiputados: { data: [], processed: 0, saved: 0, errors: [] },
    periodicosEstatales: { data: [], processed: 0, saved: 0, errors: [] },
  };

  // DOF
  if (dofResult.status === 'fulfilled') {
    results.dof.data = dofResult.value;
    const stats = await procesarYGuardarReformas(dofResult.value, io);
    Object.assign(results.dof, stats);
    logger.info(`DOF: ${stats.processed} procesadas, ${stats.saved} guardadas`);
  } else {
    const msg = `DOF scraper falló: ${dofResult.reason?.message}`;
    logger.error(msg);
    results.dof.errors.push(msg);
  }

  // Cámara de Diputados
  if (camaraResult.status === 'fulfilled') {
    results.camaraDiputados.data = camaraResult.value;
    const stats = await procesarYGuardarReformas(camaraResult.value, io);
    Object.assign(results.camaraDiputados, stats);
    logger.info(`Cámara: ${stats.processed} procesadas, ${stats.saved} guardadas`);
  } else {
    const msg = `Cámara scraper falló: ${camaraResult.reason?.message}`;
    logger.error(msg);
    results.camaraDiputados.errors.push(msg);
  }

  // Periódicos Estatales
  if (periodicosResult.status === 'fulfilled') {
    results.periodicosEstatales.data = periodicosResult.value;
    const stats = await procesarYGuardarReformas(periodicosResult.value, io);
    Object.assign(results.periodicosEstatales, stats);
    logger.info(`Periódicos Estatales: ${stats.processed} procesadas, ${stats.saved} guardadas`);
  } else {
    const msg = `Periódicos scraper falló: ${periodicosResult.reason?.message}`;
    logger.error(msg);
    results.periodicosEstatales.errors.push(msg);
  }

  const total =
    results.dof.processed + results.camaraDiputados.processed + results.periodicosEstatales.processed;
  const totalSaved =
    results.dof.saved + results.camaraDiputados.saved + results.periodicosEstatales.saved;

  logger.info(`Scraping completado. Total: ${total} procesadas, ${totalSaved} guardadas`);
  return results;
}

export { scrapeAllSources, notificarUsuarios };
