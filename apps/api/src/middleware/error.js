/**
 * Middleware global de manejo de errores.
 *
 * CORRECCIONES:
 * 1. MEJORA - Se respeta el status code del error (err.status o err.statusCode).
 *    El original siempre devolvía 500.
 * 2. SEGURIDAD - Stack trace solo en desarrollo (ya estaba, se mantiene).
 * 3. MEJORA - Se añade código de error normalizado para el cliente.
 */

import logger from '../utils/logger.js';
import { NodeEnv } from '../constants/common.js';

const errorMiddleware = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== NodeEnv.Production;

  logger.error(`[${status}] ${req.method} ${req.path} — ${err.message}`);

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({
    error: err.message || 'Ocurrió un error inesperado',
    code: err.code || 'INTERNAL_ERROR',
    ...(isDev && {
      debug: {
        name: err.name,
        stack: err.stack,
      },
    }),
  });
};

export default errorMiddleware;
export { errorMiddleware };
