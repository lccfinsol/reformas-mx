import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';

const CAMARA_URL = 'https://www.diputados.gob.mx/';
const MAX_RETRIES = 3;
const TIMEOUT_MS = 40000;

const MATERIA_KEYWORDS = {
  Fiscal: ['código fiscal', 'ley de ingresos', 'ley del impuesto', 'contribuciones', 'aduanera', 'derechos', 'aprovechamientos'],
  Laboral: ['federal del trabajo', 'artículo 123', 'relaciones de trabajo'],
  Mercantil: ['procedimientos civiles', 'procedimientos penales', 'concursos mercantiles'],
  Penal: ['código penal'],
  Salud: ['salud', 'seguro social', 'issste'],
  Administrativo: ['desarrollo social', 'planeación', 'vivienda', 'adquisiciones', 'arrendamientos'],
};

function formatearFecha(fecha) {
  if (typeof fecha === 'string') {
    return fecha;
  }
  if (fecha instanceof Date) {
    return fecha.toISOString().split('T')[0];
  }
  throw new Error('Fecha debe ser Date object o string YYYY-MM-DD');
}

async function obtenerPaginaCamara(fecha) {
  const fechaFormato = formatearFecha(fecha);
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`Obteniendo página Cámara de Diputados para ${fechaFormato} (intento ${attempt}/${MAX_RETRIES})...`);

      const response = await axios.get(CAMARA_URL, {
        timeout: TIMEOUT_MS,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      logger.info(`Página Cámara obtenida exitosamente para ${fechaFormato}`);
      return response.data;
    } catch (error) {
      lastError = error;
      logger.warn(`Intento ${attempt} falló: ${error.message}`);

      if (attempt < MAX_RETRIES) {
        const delayMs = Math.pow(2, attempt) * 1000;
        logger.info(`Reintentando en ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  const errorMsg = `Falló obtener página Cámara después de ${MAX_RETRIES} intentos: ${lastError?.message}`;
  logger.error(errorMsg);
  throw new Error(errorMsg);
}

function extraerIniciativas(html) {
  const $ = cheerio.load(html);
  const iniciativas = [];
  const keywords = ['iniciativa', 'decreto', 'reforma', 'ley'];

  $('a').each((index, element) => {
    const titulo = $(element).text().trim();
    const url = $(element).attr('href');

    if (titulo && url && keywords.some(keyword => titulo.toLowerCase().includes(keyword))) {
      const urlAbsoluta = url.startsWith('http') ? url : `https://www.diputados.gob.mx${url}`;
      iniciativas.push({
        titulo,
        url: urlAbsoluta,
      });
    }
  });

  logger.debug(`Extraídas ${iniciativas.length} iniciativas del HTML`);
  return iniciativas;
}

function clasificarMateria(titulo) {
  const lowerTitulo = titulo.toLowerCase();

  for (const [materia, keywords] of Object.entries(MATERIA_KEYWORDS)) {
    if (keywords.some(keyword => lowerTitulo.includes(keyword))) {
      return materia;
    }
  }

  return 'Otras';
}

async function scrapeCamaraDiputados(fecha) {
  const fechaFormato = formatearFecha(fecha);
  logger.info(`Procesando Cámara de Diputados para ${fechaFormato}...`);

  const html = await obtenerPaginaCamara(fechaFormato);
  const iniciativas = extraerIniciativas(html);

  const reformas = iniciativas.map(iniciativa => ({
    titulo: iniciativa.titulo,
    contenido: iniciativa.titulo,
    fecha_publicacion: fechaFormato,
    fuente: 'Cámara de Diputados',
    nivel: 'Federal',
    url_fuente: iniciativa.url,
    materia_legal: clasificarMateria(iniciativa.titulo),
  }));

  logger.info(`Procesadas ${reformas.length} iniciativas para ${fechaFormato}`);
  return reformas;
}

export { scrapeCamaraDiputados, obtenerPaginaCamara, extraerIniciativas, clasificarMateria };
