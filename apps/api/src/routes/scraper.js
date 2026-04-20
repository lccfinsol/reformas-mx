import express from 'express';
import { scrapeAllSources } from '../services/multiSourceScraper.js';
import { scrapeDOF } from '../services/dofScraper.js';
import { scrapeCamaraDiputados } from '../services/camaraDiputadosScraper.js';
import { scrapePeriodicosEstatales } from '../services/periodicosEstatalesScraper.js';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

// Middleware to check admin access
const requireAdmin = (req, res, next) => {
  if (!req.user?.is_admin) {
    const error = new Error('Admin access required');
    error.status = 403;
    throw error;
  }
  next();
};

// POST /scraper/manual - Manually trigger scraper execution
router.post('/manual', requireAdmin, async (req, res) => {
  const fecha = req.query.fecha || getYesterdayDate();
  logger.info(`Manual scraper trigger for ${fecha}`);

  const results = await scrapeAllSources(fecha);

  const totalProcessed = results.dof.processed + results.camaraDiputados.processed + results.periodicosEstatales.processed;
  const totalSaved = results.dof.saved + results.camaraDiputados.saved + results.periodicosEstatales.saved;
  const totalErrors = results.dof.errors.length + results.camaraDiputados.errors.length + results.periodicosEstatales.errors.length;

  res.json({
    success: true,
    processed: totalProcessed,
    saved: totalSaved,
    errors: totalErrors,
    details: results,
  });
});

// GET /scraper/logs - Fetch recent scrape logs
router.get('/logs', requireAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const result = await pb.collection('scrape_logs').getList(page, limit, {
    sort: '-timestamp',
  });

  res.json({
    success: true,
    logs: result.items.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      status: log.status,
      records_processed: log.records_processed,
      records_saved: log.records_saved,
      error_message: log.error_message,
    })),
    total: result.total,
    page,
    limit,
  });
});

// POST /scraper/test - Test individual scraper
router.post('/test', requireAdmin, async (req, res) => {
  const { scraper } = req.body;
  const fecha = req.query.fecha || getYesterdayDate();

  if (!['dof', 'camara', 'periodicos'].includes(scraper)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid scraper. Must be one of: dof, camara, periodicos',
    });
  }

  logger.info(`Testing scraper: ${scraper} for ${fecha}`);

  let results;
  switch (scraper) {
    case 'dof':
      results = await scrapeDOF(fecha);
      break;
    case 'camara':
      results = await scrapeCamaraDiputados(fecha);
      break;
    case 'periodicos':
      results = await scrapePeriodicosEstatales(fecha);
      break;
  }

  res.json({
    success: true,
    scraper,
    fecha,
    count: results.length,
    results: results.slice(0, 5),
  });
});

export default router;
