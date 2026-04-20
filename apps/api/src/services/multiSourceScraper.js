import 'dotenv/config';
import { scrapeDOF } from './dofScraper.js';
import { scrapeCamaraDiputados } from './camaraDiputadosScraper.js';
import { scrapePeriodicosEstatales } from './periodicosEstatalesScraper.js';
import { saveReforma } from './pocketbaseService.js';
import logger from '../utils/logger.js';

function formatearFecha(fecha) {
  if (typeof fecha === 'string') {
    return fecha;
  }
  if (fecha instanceof Date) {
    return fecha.toISOString().split('T')[0];
  }
  throw new Error('Fecha debe ser Date object o string YYYY-MM-DD');
}

async function scrapeAllSources(fecha) {
  const fechaFormato = formatearFecha(fecha);
  logger.info(`Iniciando scraping de todas las fuentes para ${fechaFormato}...`);

  const results = {
    dof: {
      processed: 0,
      saved: 0,
      errors: [],
    },
    camaraDiputados: {
      processed: 0,
      saved: 0,
      errors: [],
    },
    periodicosEstatales: {
      processed: 0,
      saved: 0,
      errors: [],
    },
  };

  // Execute all scrapers in parallel
  const [dofResults, camaraResults, periodicosResults] = await Promise.allSettled([
    scrapeDOF(fechaFormato),
    scrapeCamaraDiputados(fechaFormato),
    scrapePeriodicosEstatales(fechaFormato),
  ]).then(promises => [
    promises[0].status === 'fulfilled' ? promises[0].value : [],
    promises[1].status === 'fulfilled' ? promises[1].value : [],
    promises[2].status === 'fulfilled' ? promises[2].value : [],
  ]);

  // Track processed URLs to avoid duplicates
  const processedUrls = new Set();

  // Handle DOF results
  if (dofResults && Array.isArray(dofResults)) {
    results.dof.processed = dofResults.length;
    logger.info(`DOF: ${dofResults.length} registros procesados`);

    for (const reforma of dofResults) {
      try {
        if (!processedUrls.has(reforma.url_fuente)) {
          await saveReforma(reforma);
          results.dof.saved++;
          processedUrls.add(reforma.url_fuente);
        }
      } catch (error) {
        const errorMsg = `Error guardando reforma DOF: ${error.message}`;
        logger.error(errorMsg);
        results.dof.errors.push(errorMsg);
      }
    }
  }

  // Handle Cámara de Diputados results
  if (camaraResults && Array.isArray(camaraResults)) {
    results.camaraDiputados.processed = camaraResults.length;
    logger.info(`Cámara de Diputados: ${camaraResults.length} registros procesados`);

    for (const reforma of camaraResults) {
      try {
        if (!processedUrls.has(reforma.url_fuente)) {
          await saveReforma(reforma);
          results.camaraDiputados.saved++;
          processedUrls.add(reforma.url_fuente);
        }
      } catch (error) {
        const errorMsg = `Error guardando reforma Cámara: ${error.message}`;
        logger.error(errorMsg);
        results.camaraDiputados.errors.push(errorMsg);
      }
    }
  }

  // Handle Periódicos Estatales results
  if (periodicosResults && Array.isArray(periodicosResults)) {
    results.periodicosEstatales.processed = periodicosResults.length;
    logger.info(`Periódicos Estatales: ${periodicosResults.length} registros procesados`);

    for (const reforma of periodicosResults) {
      try {
        if (!processedUrls.has(reforma.url_fuente)) {
          await saveReforma(reforma);
          results.periodicosEstatales.saved++;
          processedUrls.add(reforma.url_fuente);
        }
      } catch (error) {
        const errorMsg = `Error guardando reforma Periódicos: ${error.message}`;
        logger.error(errorMsg);
        results.periodicosEstatales.errors.push(errorMsg);
      }
    }
  }

  const totalProcessed = results.dof.processed + results.camaraDiputados.processed + results.periodicosEstatales.processed;
  const totalSaved = results.dof.saved + results.camaraDiputados.saved + results.periodicosEstatales.saved;
  const totalErrors = results.dof.errors.length + results.camaraDiputados.errors.length + results.periodicosEstatales.errors.length;

  logger.info(`Scraping de todas las fuentes completado. Total: ${totalProcessed} procesadas, ${totalSaved} guardadas, ${totalErrors} errores`);

  return results;
}

export { scrapeAllSources };
