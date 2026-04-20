/**
 * Scraper del Diario Oficial de la Federación (DOF)
 *
 * CORRECCIONES:
 * 1. CRÍTICO — fecha ignorada en la URL: obtenerSumarioDOF siempre
 *    hacía GET a DOF_URL sin usar el parámetro fecha. Siempre obtenía
 *    la portada del día actual, no la fecha solicitada.
 *    El DOF acepta ?fecha=DD-MM-YYYY para consultar una fecha específica.
 * 2. LÓGICA — Selector `a[href*="diario"]` demasiado genérico: capturaba
 *    links de navegación, menús y breadcrumbs con títulos de 1-2 palabras.
 *    Se filtra por `nota_detalle` en la URL (links de contenido real del DOF)
 *    y se exige título mínimo de 10 caracteres.
 * 3. MEJORA — User-Agent Chrome 91 (2021): detectado como bot en varios
 *    sitios. Actualizado a Chrome 120 (2024).
 * 4. CORRECCIÓN — campos faltantes: scrapeReformas omitía materia_legal,
 *    tipo_cambio, impacto, estado y nivel. Los necesita pocketbaseService.
 */

import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';

const DOF_BASE_URL = 'https://www.dof.gob.mx/index_113.php';
const MAX_RETRIES = 3;
const TIMEOUT_MS = 40_000;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const MATERIA_KEYWORDS = {
  Fiscal: [
    'código fiscal', 'ley de ingresos', 'ley del impuesto', 'contribuciones',
    'aduanera', 'derechos', 'aprovechamientos', 'tributar', 'recaudación', 'sat',
  ],
  Laboral: ['federal del trabajo', 'artículo 123', 'relaciones de trabajo', 'imss', 'infonavit'],
  Mercantil: ['procedimientos civiles', 'concursos mercantiles', 'sociedades mercantiles', 'competencia económica'],
  Penal: ['código penal', 'proceso penal', 'delincuencia organizada', 'extinción de dominio'],
  Salud: ['salud', 'seguro social', 'issste', 'epidemiología', 'medicamento'],
  Administrativo: ['desarrollo social', 'planeación', 'vivienda', 'adquisiciones', 'arrendamientos', 'transparencia'],
  Civil: ['código civil', 'familia', 'adopción', 'sucesiones'],
};

const TIPO_CAMBIO_KEYWORDS = {
  'Nueva ley/reglamento': ['expide la ley', 'expide el reglamento', 'nueva ley'],
  'Reforma': ['reforman', 'reforma', 'se modifica', 'modifican'],
  'Adición': ['adicionan', 'adiciona', 'se adiciona'],
  'Derogación/Abrogación': ['derogan', 'deroga', 'se deroga', 'abroga'],
};

function formatearFecha(fecha) {
  if (typeof fecha === 'string') return fecha;
  if (fecha instanceof Date) return fecha.toISOString().split('T')[0];
  throw new Error('Fecha debe ser Date object o string YYYY-MM-DD');
}

/** CORRECCIÓN: convierte YYYY-MM-DD → DD-MM-YYYY para el parámetro ?fecha= del DOF */
function fechaParaDOF(fechaISO) {
  const [yyyy, mm, dd] = fechaISO.split('-');
  return `${dd}-${mm}-${yyyy}`;
}

async function obtenerSumarioDOF(fecha) {
  const fechaISO = formatearFecha(fecha);
  // CORRECCIÓN: construir URL con fecha real
  const url = `${DOF_BASE_URL}?fecha=${fechaParaDOF(fechaISO)}`;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`DOF: obteniendo sumario ${fechaISO} (intento ${attempt}/${MAX_RETRIES})...`);
      const response = await axios.get(url, {
        timeout: TIMEOUT_MS,
        headers: { 'User-Agent': USER_AGENT }, // CORRECCIÓN: Chrome 120
      });
      logger.info(`DOF: sumario obtenido para ${fechaISO}`);
      return response.data;
    } catch (error) {
      lastError = error;
      logger.warn(`DOF intento ${attempt} falló: ${error.message}`);
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw new Error(`DOF: falló después de ${MAX_RETRIES} intentos — ${lastError?.message}`);
}

function extraerNotasRelevantes(html) {
  const $ = cheerio.load(html);
  const notas = [];

  // CORRECCIÓN: selector específico para artículos del DOF (nota_detalle en URL)
  $('a[href*="nota_detalle"]').each((_, el) => {
    const titulo = $(el).text().trim();
    const href = $(el).attr('href');

    // Filtrar links de navegación (títulos muy cortos)
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
  return 'Otras';
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

/** Función principal para el scheduler y scraper.js */
async function scrapeDOF(fecha) {
  const fechaISO = formatearFecha(fecha);
  const html = await obtenerSumarioDOF(fechaISO);
  const notas = extraerNotasRelevantes(html);

  const reformas = notas.map((nota) => {
    const materia = clasificarMateria(nota.titulo);
    return {
      titulo: nota.titulo,
      contenido: nota.titulo,
      descripcion_corta: nota.titulo.substring(0, 200),
      fecha_publicacion: fechaISO,
      fuente: 'DOF',
      nivel: 'Federal',
      estado: 'Federal',
      url_fuente: nota.url,
      materia_legal: materia,
      tipo_cambio: clasificarTipoCambio(nota.titulo), // CORRECCIÓN: campo faltante
      impacto: clasificarImpacto(materia),            // CORRECCIÓN: campo faltante
    };
  });

  logger.info(`DOF: ${reformas.length} reformas procesadas para ${fechaISO}`);
  return reformas;
}

/** Alias para compatibilidad con dofScheduler.js */
async function scrapeReformas(fecha) {
  return scrapeDOF(fecha);
}

export {
  scrapeDOF,
  scrapeReformas,
  obtenerSumarioDOF,
  extraerNotasRelevantes,
  clasificarMateria,
  clasificarTipoCambio,
  clasificarImpacto,
};
