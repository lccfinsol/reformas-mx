/**
 * Scraper de la Cámara de Diputados.
 *
 * CORRECCIONES APLICADAS:
 * 1. LÓGICA - La Cámara no tiene un endpoint de iniciativas por fecha accesible
 *    desde la página principal. Se apunta al buscador de iniciativas con
 *    parámetros de fecha para obtener resultados relevantes.
 * 2. DUPLICACIÓN - MATERIA_KEYWORDS y TIPO_CAMBIO_KEYWORDS centralizados.
 * 3. CORRECCIÓN - Campo `url` → `url_fuente` consistente con la BD.
 * 4. MEJORA - Se añaden campos `fuente`, `estado`, `nivel` faltantes.
 */

import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';
import { MATERIA_KEYWORDS, TIPO_CAMBIO_KEYWORDS, FUENTES } from '../constants/common.js';

// URL del buscador de iniciativas por fecha
const CAMARA_BASE_URL = 'https://sitl.diputados.gob.mx/LXV_leg/listado_tipobuscainiciativas_xfecha.php';
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

async function obtenerPaginaCamara(fecha) {
  const fechaISO = formatearFecha(fecha);
  const [yyyy, mm, dd] = fechaISO.split('-');
  // La Cámara usa formato DD/MM/YYYY en el buscador
  const params = new URLSearchParams({
    fecha_ini: `${dd}/${mm}/${yyyy}`,
    fecha_fin: `${dd}/${mm}/${yyyy}`,
  });
  const url = `${CAMARA_BASE_URL}?${params.toString()}`;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`Cámara: obteniendo iniciativas para ${fechaISO} (intento ${attempt}/${MAX_RETRIES})...`);

      const response = await axios.get(url, {
        timeout: TIMEOUT_MS,
        headers: { 'User-Agent': USER_AGENT },
      });

      logger.info(`Cámara: página obtenida para ${fechaISO}`);
      return response.data;
    } catch (error) {
      lastError = error;
      logger.warn(`Cámara intento ${attempt} falló: ${error.message}`);

      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw new Error(`Cámara: falló después de ${MAX_RETRIES} intentos — ${lastError?.message}`);
}

function extraerIniciativas(html) {
  const $ = cheerio.load(html);
  const iniciativas = [];
  const keywords = ['iniciativa', 'decreto', 'reforma', 'ley', 'adición', 'derogación'];

  $('a').each((_, el) => {
    const titulo = $(el).text().trim();
    const href = $(el).attr('href');

    if (!titulo || titulo.length < 10 || !href) return;

    const tituloLower = titulo.toLowerCase();
    if (!keywords.some((k) => tituloLower.includes(k))) return;

    const urlAbsoluta = href.startsWith('http')
      ? href
      : `https://sitl.diputados.gob.mx${href}`;

    iniciativas.push({ titulo, url: urlAbsoluta });
  });

  logger.debug(`Cámara: ${iniciativas.length} iniciativas extraídas`);
  return iniciativas;
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

async function scrapeCamaraDiputados(fecha) {
  const fechaISO = formatearFecha(fecha);
  logger.info(`Cámara: iniciando scraping para ${fechaISO}...`);

  const html = await obtenerPaginaCamara(fechaISO);
  const iniciativas = extraerIniciativas(html);

  const reformas = iniciativas.map((iniciativa) => {
    const materia = clasificarMateria(iniciativa.titulo);
    return {
      titulo: iniciativa.titulo,
      url_fuente: iniciativa.url,    // CORRECCIÓN: campo correcto
      materia_legal: materia,
      tipo_cambio: clasificarTipoCambio(iniciativa.titulo),
      impacto: clasificarImpacto(materia),
      fecha_publicacion: fechaISO,
      fuente: FUENTES.CAMARA,        // CORRECCIÓN: campo faltante
      estado: 'Federal',             // CORRECCIÓN: campo faltante
      nivel: 'Federal',
    };
  });

  logger.info(`Cámara: ${reformas.length} reformas procesadas para ${fechaISO}`);
  return reformas;
}

export {
  scrapeCamaraDiputados,
  obtenerPaginaCamara,
  extraerIniciativas,
  clasificarMateria,
  clasificarTipoCambio,
  clasificarImpacto,
};
