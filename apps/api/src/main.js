/**
 * API Server — Reformas MX
 *
 * CORRECCIONES:
 * 1. CRÍTICO — 404 handler DESPUÉS del errorMiddleware: Express nunca lo alcanzaba
 *    porque errorMiddleware capturaba primero. Se reordena: 404 → errorMiddleware.
 * 2. CRÍTICO — PocketBase se iniciaba como efecto secundario del import
 *    (IIFE en pocketbaseClient). Ahora se llama explícitamente con await.
 * 3. SEGURIDAD — CORS_ORIGIN=* en producción: se mantiene la variable de env
 *    pero se advierte si es '*' en producción.
 * 4. LÓGICA — SIGTERM con setTimeout(3000) bloqueante sin cerrar el servidor:
 *    después de 3 segundos el proceso salía, pero las conexiones activas
 *    no se cerraban limpiamente. Se usa httpServer.close().
 * 5. MEJORA — trust proxy: 'true' (boolean) acepta cualquier proxy;
 *    '1' (número) solo el proxy inmediato es más seguro en Hostinger.
 * 6. LÓGICA — initializeNotificationSocket y startScheduler se llamaban
 *    dentro del callback de listen(), antes de que PocketBase estuviera
 *    autenticado. Se mueven al flujo de bootstrap.
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

const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

if (process.env.NODE_ENV === 'production' && corsOrigin === '*') {
  logger.warn('ATENCIÓN: CORS_ORIGIN=* en producción es inseguro. Configura el dominio real.');
}

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});

// CORRECCIÓN: '1' solo confía en el proxy inmediato (más seguro que true)
app.set('trust proxy', 1);
app.locals.io = io;

// --- Manejadores de proceso ---
process.on('uncaughtException', (error) => {
  logger.error('Excepción no capturada:', error.message, error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Promesa rechazada sin manejar:', reason);
  process.exit(1);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recibido — cerrando');
  process.exit(0);
});

// CORRECCIÓN: SIGTERM cierra el servidor HTTP antes de salir
let serverInstance = null;
process.on('SIGTERM', () => {
  logger.info('SIGTERM recibido — iniciando cierre ordenado...');
  if (serverInstance) {
    serverInstance.close(() => {
      logger.info('Servidor HTTP cerrado');
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 10_000).unref();
  } else {
    process.exit(0);
  }
});

// --- Middlewares ---
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
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

// --- Bootstrap ---
const port = parseInt(process.env.PORT || '3001', 10);

async function bootstrap() {
  try {
    // 1. PocketBase primero
    await initializePocketBase();

    // 2. WebSocket
    initializeNotificationSocket(io);

    // 3. Scheduler
    startScheduler();

    // 4. Abrir puerto HTTP
    serverInstance = httpServer.listen(port, () => {
      logger.info(`API Server corriendo en http://localhost:${port}`);
      logger.info(`Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`CORS permitido: ${corsOrigin}`);
    });
  } catch (err) {
    logger.error('Error fatal al iniciar el servidor:', err.message);
    process.exit(1);
  }
}

bootstrap();

export default app;
export { io };
