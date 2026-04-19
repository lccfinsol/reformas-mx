import 'dotenv/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';

const MAX_RETRIES = 3;
const TIMEOUT_MS = 40000;

const ESTADOS_PERIODICOS = {
  'Aguascalientes': 'https://www.periodico.aguascalientes.gob.mx/',
  'Baja California': 'https://www.bajacalifornia.gob.mx/periodico/',
  'Baja California Sur': 'https://www.bcs.gob.mx/periodico/',
  'Campeche': 'https://www.campeche.gob.mx/periodico/',
  'Chiapas': 'https://www.chiapas.gob.mx/periodico/',
  'Chihuahua': 'https://www.chihuahua.gob.mx/periodico/',
  'CDMX': 'https://www.cdmx.gob.mx/periodico/',
  'Coahuila': 'https://www.coahuila.gob.mx/periodico/',
  'Colima': 'https://www.colima.gob.mx/periodico/',
  'Durango': 'https://www.durango.gob.mx/periodico/',
  'Estado de México': 'https://www.edomex.gob.mx/periodico/',
  'Guanajuato': 'https://www.guanajuato.gob.mx/periodico/',
  'Guerrero': 'https://www.guerrero.gob.mx/periodico/',
  'Hidalgo': 'https://www.hidalgo.gob.mx/periodico/',
  'Jalisco': 'https://www.jalisco.gob.mx/periodico/',
  'Michoacán': 'https://www.michoacan.gob.mx/periodico/',
  'Morelos': 'https://www.morelos.gob.mx/periodico/',
  'Nayarit': 'https://www.nayarit.gob.mx/periodico/',
  'Nuevo León': 'https://www.nuevoleon.gob.mx/periodico/',
  'Oaxaca': 'https://www.oaxaca.gob.mx/periodico/',
  'Puebla': 'https://www.puebla.gob.mx/periodico/',
  'Querétaro': 'https://www.queretaro.gob.mx/periodico/',
  'Quintana Roo': 'https://www.quintanaroo.gob.mx/periodico/',
  'San Luis Potosí': 'https://www.slp.gob.mx/periodico/',
  'Sinaloa': 'https://www.sinaloa.gob.mx/periodico/',
  'Sonora': 'https://www.sonora.gob.mx/periodico/',
  'Tabasco': 'https://www.tabasco.gob.mx/periodico/',
  'Tamaulipas': 'https://www.tamaulipas.gob.mx/periodico/',
  'Tlaxcala': 'https://www.tlaxcala.gob.mx/periodico/',
  'Veracruz': 'https://www.veracruz.gob.mx/periodico/',
  'Yucatán': 'https://www.yucatan.gob.mx/periodico/',
  'Zacatecas': 'https://www.zacatecas.gob.mx/periodico/',
};

const MATERIA_KEYWORDS = {
  Fiscal: ['código fiscal', 'ley de ingresos', 'ley del impuesto', 'contribuciones', 'aduanera', 'derechos', 'aprovechamientos'],
  Laboral: ['federal del trabajo', 'artículo 123', 'relaciones de trabajo'],
  Mercantil: ['procedimientos civiles', 'procedimientos penales', 'concursos mercantiles'],
  Penal: ['código penal'],
  Salud: ['salud', 'seguro social', 'issste'],
  Administrativo: ['desarrollo social', 'planeación', 'vivienda', 'adquisiciones', 'arrendamientos'],
};

const TIPO_CAMBIO_KEYWORDS = {
  'Nueva ley/reglamento': ['expide la ley'],
  'Reforma': ['reforman', 'reforma'],
  'Adición': ['adicionan', 'adiciona'],
  'Derogación/Abrogación': ['derogan', 'deroga'],
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

async function obtenerPaginaEstatal(url, estado) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info(`Obteniendo página de ${estado} (intento ${attempt}/${MAX_RETRIES})...`);

      const response = await axios.get(url, {
        timeout: TIMEOUT_MS,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      logger.info(`Página de ${estado} obtenida exitosamente`);
      return response.data;
    } catch (error) {
      lastError = error;
      logger.warn(`Intento ${attempt} para ${estado} falló: ${error.message}`);

      if (attempt < MAX_RETRIES) {
        const delayMs = Math.pow(2, attempt) * 1000;
        logger.info(`Reintentando en ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  logger.warn(`Falló obtener página de ${estado} después de ${MAX_RETRIES} intentos: ${lastError?.message}`);
  return null;
}

function extraerPublicaciones(html, estado) {
  if (!html) return [];

  const $ = cheerio.load(html);
  const publicaciones = [];
  const keywords = ['decreto', 'reforma', 'ley', 'reglamento'];

  $('a').each((index, element) => {
    const titulo = $(element).text().trim();
    const url = $(element).attr('href');

    if (titulo && url && keywords.some(keyword => titulo.toLowerCase().includes(keyword))) {
      const urlAbsoluta = url.startsWith('http') ? url : `https://${new URL(ESTADOS_PERIODICOS[estado]).hostname}${url}`;
      publicaciones.push({
        titulo,
        url: urlAbsoluta,
      });
    }
  });

  logger.debug(`Extraídas ${publicaciones.length} publicaciones de ${estado}`);
  return publicaciones;
}

function clasificarMateria(titulo) {
  const lowerTitulo = titulo.toLowerCase();

  for (const [materia, keywords] of Object.entries(MATERIA_KEYWORDS)) {
    if (keywords.some(keyword => lowerTitulo.includes(keyword))) {
      return materia;
    }
  }

  return 'Otro';
}

function clasificarTipoCambio(titulo) {
  const lowerTitulo = titulo.toLowerCase();

  for (const [tipo, keywords] of Object.entries(TIPO_CAMBIO_KEYWORDS)) {
    if (keywords.some(keyword => lowerTitulo.includes(keyword))) {
      return tipo;
    }
  }

  return 'Otro';
}

function clasificarImpacto(materia) {
  const altoMaterias = ['Fiscal', 'Laboral', 'Mercantil', 'Salud'];
  const medioMaterias = ['Administrativo', 'Penal'];

  if (altoMaterias.includes(materia)) {
    return 'Alto';
  }
  if (medioMaterias.includes(materia)) {
    return 'Medio';
  }
  return 'Bajo';
}

async function scrapePeriodicosEstatales(fecha) {
  const fechaFormato = formatearFecha(fecha);
  logger.info(`Procesando Periódicos Estatales para ${fechaFormato}...`);

  const todasLasPublicaciones = [];

  for (const [estado, url] of Object.entries(ESTADOS_PERIODICOS)) {
    try {
      const html = await obtenerPaginaEstatal(url, estado);
      const publicaciones = extraerPublicaciones(html, estado);

      const reformas = publicaciones.map(publicacion => {
        const materia = clasificarMateria(publicacion.titulo);
        const tipoCambio = clasificarTipoCambio(publicacion.titulo);
        const impacto = clasificarImpacto(materia);

        return {
          titulo: publicacion.titulo,
          url: publicacion.url,
          materia_legal: materia,
          tipo_cambio: tipoCambio,
          impacto,
          fecha_publicacion: fechaFormato,
          estado,
        };
      });

      todasLasPublicaciones.push(...reformas);
    } catch (error) {
      logger.error(`Error procesando ${estado}: ${error.message}`);
    }
  }

  logger.info(`Procesadas ${todasLasPublicaciones.length} publicaciones de periódicos estatales para ${fechaFormato}`);
  return todasLasPublicaciones;
}

export { scrapePeriodicosEstatales, obtenerPaginaEstatal, extraerPublicaciones, clasificarMateria, clasificarTipoCambio, clasificarImpacto };
