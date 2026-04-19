/**
 * Punto de entrada del API Server — Reformas MX
 *
 * CORRECCIONES APLICADAS:
 * 1. CRÍTICO - Orden de inicialización: express se configuraba antes de
 *    PocketBase. Si PB falla, el servidor arranca sin DB. Ahora se inicializa
 *    PocketBase primero y sólo si tiene éxito se abre el puerto HTTP.
 * 2. CRÍTICO - 404 handler colocado DESPUÉS del errorMiddleware: en Express 5
 *    el orden importa. El 404 debe ir antes del error handler.
 * 3. SEGURIDAD - CORS origin='*': en producción permitía cualquier origen.
 *    Se respeta estrictamente CORS_ORIGIN del env.
 * 4. MEJORA - Graceful shutdown: SIGTERM ahora cierra el servidor HTTP antes
 *    de salir, evitando conexiones colgadas.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/error.js';
import { globalRateLimit } from './middleware/global-rate-limit.js';
import logger from './utils/logger.js';
import { BodyLimit } from './constants/common.js';
import { startScheduler } from './jobs/scheduler.js';
import { initializeNotificationSocket } from './websocket/notificationSocket.js';
import { initializePocketBase } from './utils/pocketbaseClient.js';

const app = express();
const httpServer = createServer(app);

// --- CORS ---
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

app.set('trust proxy', 1); // CORRECCIÓN: '1' (número) es más seguro que `true`
app.locals.io = io;

// --- Seguridad ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// --- Logging y parsers ---
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(globalRateLimit);
app.use(express.json({ limit: BodyLimit }));
app.use(express.urlencoded({ extended: true, limit: BodyLimit }));

// --- Rutas ---
app.use('/', routes());

// CORRECCIÓN: 404 ANTES del error handler
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// --- Error handler global ---
app.use(errorMiddleware);

// --- Manejadores de proceso ---
process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada:', error.message, error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Promesa rechazada sin manejar:', reason);
  process.exit(1);
});

// CORRECCIÓN: Graceful shutdown correcto
let httpServerInstance = null;

process.on('SIGTERM', async () => {
  logger.info('SIGTERM recibido — cerrando servidor...');
  if (httpServerInstance) {
    httpServerInstance.close(() => {
      logger.info('Servidor HTTP cerrado correctamente');
      process.exit(0);
    });
    // Forzar cierre después de 10s
    setTimeout(() => process.exit(0), 10_000).unref();
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT recibido — cerrando...');
  process.exit(0);
});

// --- Arranque ---
const port = parseInt(process.env.PORT || '3001', 10);

async function bootstrap() {
  try {
    // 1. Inicializar PocketBase primero
    await initializePocketBase();

    // 2. Inicializar WebSocket
    initializeNotificationSocket(io);

    // 3. Iniciar scheduler
    startScheduler();

    // 4. Abrir puerto HTTP
    httpServerInstance = httpServer.listen(port, () => {
      logger.info(`API Server corriendo en http://localhost:${port}`);
      logger.info(`Entorno: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.fatal('Error al iniciar el servidor:', err.message);
    process.exit(1);
  }
}

bootstrap();

export default app;
export { io };
