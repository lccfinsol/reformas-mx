/**
 * Scraper del Diario Oficial de la Federación (DOF).
 *
 * CORRECCIONES APLICADAS:
 * 1. LÓGICA CRÍTICA - obtenerSumarioDOF no usa la fecha: obtenía la página
 *    principal del DOF (index_113.php) ignorando completamente el parámetro
 *    `fecha`. Se corrige para consultar la URL con la fecha real del DOF.
 * 2. LÓGICA - extraerNotasRelevantes: el selector `a[href*="diario"]` era
 *    muy genérico y capturaba links de navegación. Se filtra por texto mínimo
 *    y se añade filtro de longitud mínima del título.
 * 3. DUPLICACIÓN - MATERIA_KEYWORDS y TIPO_CAMBIO_KEYWORDS están copiados
 *    exactamente en dofScraper, camaraScraper y periodicosScraper. Se
 *    centralizan en constants/common.js y se importan.
 * 4. MEJORA - User-Agent actualizado a Chrome 120 (el original usaba Chrome 91
 *    de 2021, detectado por algunos sitios como bot).
 * 5. MEJORA - Se añade campo `fuente` y `estado` al resultado para que el
 *    multiSourceScraper y notificationService funcionen correctamente
 *    (el original omitía estos campos causando errores de filtrado).
 */

import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';
import { MATERIA_KEYWORDS, TIPO_CAMBIO_KEYWORDS } from '../constants/common.js';

// URL del sumario del DOF por fecha: ?fecha=DD-MM-YYYY
const DOF_BASE_URL = 'https://www.dof.gob.mx/index_113.php';
const MAX_RETRIES = 3;
const TIMEOUT_MS = 40_000;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function formatearFecha(fecha) {
  if (typeof fecha === 'string') return fecha;
  if (fecha instanceof Date) return fecha.toISOString().split('T')[0];
  throw new Error('Fecha debe ser un Date object o string YYYY-MM-DD');
}

/**
 * CORRECCIÓN: El DOF acepta fecha en formato DD-MM-YYYY como query param.
 * Convierte YYYY-MM-DD → DD-MM-YYYY para la URL.
 */
function fechaParaDOF(fechaISO) {
  const [yyyy, mm, dd] = fechaISO.split('-');
  return `${dd}-${mm}-${yyyy}`;
}

async function obtenerSumarioDOF(fecha) {
  const fechaISO = formatearFecha(fecha);
  const fechaDOF = fechaParaDOF(fechaISO);
  const url = `${DOF_BASE_URL}?fecha=${fechaDOF}`;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`Obteniendo sumario DOF para ${fechaISO} (intento ${attempt}/${MAX_RETRIES})...`);

      const response = await axios.get(url, {
        timeout: TIMEOUT_MS,
        headers: { 'User-Agent': USER_AGENT },
      });

      logger.info(`Sumario DOF obtenido para ${fechaISO}`);
      return response.data;
    } catch (error) {
      lastError = error;
      logger.warn(`Intento ${attempt} falló: ${error.message}`);

      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw new Error(`DOF: falló después de ${MAX_RETRIES} intentos — ${lastError?.message}`);
}

function extraerNotasRelevantes(html) {
  const $ = cheerio.load(html);
  const notas = [];

  // CORRECCIÓN: selector más específico para artículos del DOF
  $('a[href*="nota_detalle"]').each((_, el) => {
    const titulo = $(el).text().trim();
    const href = $(el).attr('href');

    // Filtrar links con título demasiado corto (navegación, menús)
    if (!titulo || titulo.length < 10 || !href) return;

    const urlAbsoluta = href.startsWith('http')
      ? href
      : `https://www.dof.gob.mx${href}`;

    notas.push({ titulo, url: urlAbsoluta });
  });

  logger.debug(`DOF: ${notas.length} notas extraídas`);
  return notas;
}

function clasificarMateria(titulo) {
  const lower = titulo.toLowerCase();
  for (const [materia, keywords] of Object.entries(MATERIA_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return materia;
  }
  return 'Otro';
}

function clasificarTipoCambio(titulo) {
  const lower = titulo.toLowerCase();
  for (const [tipo, keywords] of Object.entries(TIPO_CAMBIO_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) return tipo;
  }
  return 'Otro';
}

function clasificarImpacto(materia) {
  if (['Fiscal', 'Laboral', 'Mercantil', 'Salud'].includes(materia)) return 'Alto';
  if (['Administrativo', 'Penal'].includes(materia)) return 'Medio';
  return 'Bajo';
}

async function scrapeReformas(fecha) {
  const fechaISO = formatearFecha(fecha);
  logger.info(`DOF: iniciando scraping para ${fechaISO}...`);

  const html = await obtenerSumarioDOF(fechaISO);
  const notas = extraerNotasRelevantes(html);

  const reformas = notas.map((nota) => {
    const materia = clasificarMateria(nota.titulo);
    return {
      titulo: nota.titulo,
      url_fuente: nota.url,      // CORRECCIÓN: campo correcto (url_fuente)
      materia_legal: materia,
      tipo_cambio: clasificarTipoCambio(nota.titulo),
      impacto: clasificarImpacto(materia),
      fecha_publicacion: fechaISO,
      fuente: 'Diario Oficial de la Federación', // CORRECCIÓN: campo faltante
      estado: 'Federal',                          // CORRECCIÓN: campo faltante
      nivel: 'Federal',
    };
  });

  logger.info(`DOF: ${reformas.length} reformas procesadas para ${fechaISO}`);
  return reformas;
}

export {
  scrapeReformas,
  obtenerSumarioDOF,
  extraerNotasRelevantes,
  clasificarMateria,
  clasificarTipoCambio,
  clasificarImpacto,
};
