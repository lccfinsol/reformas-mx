/**
 * Constantes compartidas del API.
 *
 * CORRECCIONES:
 * 1. CENTRALIZACIÓN - MATERIA_KEYWORDS y TIPO_CAMBIO_KEYWORDS estaban
 *    duplicadas en 3 scrapers distintos. Se centralizan aquí.
 * 2. MEJORA - Se añade FUENTES y NIVELES como constantes reutilizables.
 */

const NodeEnv = {
  Development: 'development',
  Production: 'production',
};

/** Límite de cuerpo HTTP: 20 MB */
const BodyLimit = 1024 * 1024 * 20;

/** Clasificación de materias legales por palabras clave */
const MATERIA_KEYWORDS = {
  Fiscal: [
    'código fiscal', 'ley de ingresos', 'ley del impuesto',
    'contribuciones', 'aduanera', 'derechos', 'aprovechamientos',
    'sat', 'tributar', 'recaudación',
  ],
  Laboral: [
    'federal del trabajo', 'artículo 123', 'relaciones de trabajo',
    'imss', 'infonavit', 'seguridad social',
  ],
  Mercantil: [
    'procedimientos civiles', 'concursos mercantiles', 'sociedades mercantiles',
    'comercio exterior', 'competencia económica',
  ],
  Penal: ['código penal', 'proceso penal', 'delincuencia organizada', 'extinción de dominio'],
  Salud: ['salud', 'seguro social', 'issste', 'epidemiología', 'medicamento'],
  Administrativo: [
    'desarrollo social', 'planeación', 'vivienda', 'adquisiciones',
    'arrendamientos', 'obras públicas', 'transparencia', 'anticorrupción',
  ],
  Civil: ['código civil', 'familia', 'adopción', 'sucesiones'],
};

/** Clasificación del tipo de cambio normativo */
const TIPO_CAMBIO_KEYWORDS = {
  'Nueva ley/reglamento': ['expide la ley', 'expide el reglamento', 'nueva ley'],
  'Reforma': ['reforman', 'reforma', 'se modifica', 'modifican'],
  'Adición': ['adicionan', 'adiciona', 'se adiciona'],
  'Derogación/Abrogación': ['derogan', 'deroga', 'se deroga', 'abroga'],
};

const FUENTES = {
  DOF: 'Diario Oficial de la Federación',
  CAMARA: 'Cámara de Diputados',
  PERIODICOS: 'Periódicos Oficiales de Estados',
};

const NIVELES = ['Federal', 'Estatal', 'Municipal'];

export { NodeEnv, BodyLimit, MATERIA_KEYWORDS, TIPO_CAMBIO_KEYWORDS, FUENTES, NIVELES };
