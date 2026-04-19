/**
 * Logger estructurado con niveles y timestamps.
 * CORRECCIÓN: El logger original usaba console.log para errores (incorrecto).
 * Los errores deben ir a stderr. Se añade timestamp y soporte de entorno.
 */

const isDev = process.env.NODE_ENV !== 'production';

function timestamp() {
  return new Date().toISOString();
}

function formatMsg(level, args) {
  const prefix = `[${timestamp()}] [${level}]`;
  return [prefix, ...args];
}

const logger = {
  error: (...args) => {
    // CORRECCIÓN: errores a stderr, no a stdout
    console.error(...formatMsg('ERROR', args));
  },
  fatal: (...args) => {
    console.error(...formatMsg('FATAL', args));
  },
  warn: (...args) => {
    console.warn(...formatMsg('WARN', args));
  },
  info: (...args) => {
    console.log(...formatMsg('INFO', args));
  },
  debug: (...args) => {
    // CORRECCIÓN: debug solo en desarrollo
    if (isDev) {
      console.log(...formatMsg('DEBUG', args));
    }
  },
};

export default logger;
export { logger };
