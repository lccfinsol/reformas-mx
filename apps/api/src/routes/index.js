import { Router } from 'express';
import healthCheck from './health-check.js';
import scraperRouter from './scraper.js';
import subscriptionsRouter from './subscriptions.js';
import notificationsRouter from './notifications.js';
import adminRouter from './admin.js';
import requireAdmin from '../middleware/requireAdmin.js';

const router = Router();

export default () => {
  router.get('/health', healthCheck);
  router.use('/', scraperRouter);
  router.use('/subscriptions', subscriptionsRouter);
  router.use('/notifications', notificationsRouter);
  router.use('/admin', requireAdmin, adminRouter);

  return router;
};
