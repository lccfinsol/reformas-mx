/**
 * Router principal.
 *
 * CORRECCIÓN: El router de admin no estaba registrado.
 * Ninguna petición a /admin/* era procesada.
 */

import { Router } from 'express';
import healthCheck from './health-check.js';
import scraperRouter from './scraper.js';
import notificationsRouter from './notifications.js';
import subscriptionsRouter from './subscriptions.js';
import adminRouter from './admin.js';

const router = Router();

export default () => {
  router.get('/health', healthCheck);
  router.use('/scraper', scraperRouter);
  router.use('/notifications', notificationsRouter);
  router.use('/subscriptions', subscriptionsRouter);
  router.use('/admin', adminRouter); // CORRECCIÓN: ruta admin registrada

  return router;
};
