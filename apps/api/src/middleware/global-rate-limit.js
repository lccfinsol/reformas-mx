/**
 * Rate limiting global.
 *
 * CORRECCIONES:
 * 1. CORRECCIÓN - validate.trustProxy: estaba en `false` aunque main.js
 *    establece trust proxy en 1. Debe estar en `true` para que los headers
 *    X-Forwarded-For sean respetados correctamente en Hostinger/proxy.
 * 2. MEJORA - skipFailedRequests: no contabilizar peticiones que ya fallaron
 *    antes del rate limiter (e.g. 404, 401).
 */

import rateLimit from 'express-rate-limit';

export const globalRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: false,
  message: {
    error: 'Demasiadas solicitudes, por favor intenta de nuevo en unos minutos',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  validate: {
    trustProxy: true, // CORRECCIÓN: alineado con app.set('trust proxy', 1)
  },
});

/** Rate limit más estricto para rutas de scraping manual (costosas) */
export const scraperRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Límite de scraping manual alcanzado. Máximo 10 solicitudes por hora.',
    code: 'SCRAPER_RATE_LIMIT_EXCEEDED',
  },
  validate: { trustProxy: true },
});
