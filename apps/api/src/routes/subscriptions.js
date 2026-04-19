import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

const MATERIAS = ['Fiscal', 'Laboral', 'Procesal y mercantil', 'Penal', 'Salud y seguridad social', 'Administrativo', 'Otras'];
const ESTADOS = [
  'Federal',
  'Aguascalientes',
  'Baja California',
  'Baja California Sur',
  'Campeche',
  'Chiapas',
  'Chihuahua',
  'CDMX',
  'Coahuila',
  'Colima',
  'Durango',
  'Estado de México',
  'Guanajuato',
  'Guerrero',
  'Hidalgo',
  'Jalisco',
  'Michoacán',
  'Morelos',
  'Nayarit',
  'Nuevo León',
  'Oaxaca',
  'Puebla',
  'Querétaro',
  'Quintana Roo',
  'San Luis Potosí',
  'Sinaloa',
  'Sonora',
  'Tabasco',
  'Tamaulipas',
  'Tlaxcala',
  'Veracruz',
  'Yucatán',
  'Zacatecas',
];
const FUENTES = ['DOF', 'Cámara de Diputados', 'Periódico Estatal', 'Todas'];

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.auth?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// POST /subscriptions - Create new subscription
router.post('/', requireAuth, async (req, res) => {
  const { materia_legal, estado, fuente, notificaciones_email, notificaciones_tiempo_real } = req.body;
  const userId = req.auth.id;

  if (!materia_legal || !estado || !fuente) {
    return res.status(400).json({ error: 'materia_legal, estado, and fuente are required' });
  }

  const subscription = await pb.collection('user_subscriptions').create({
    user_id: userId,
    materia_legal,
    estado,
    fuente,
    notificaciones_email: notificaciones_email || false,
    notificaciones_tiempo_real: notificaciones_tiempo_real || false,
    activa: true,
    fecha_creacion: new Date().toISOString(),
  });

  logger.info(`Subscription created for user ${userId}: ${subscription.id}`);

  res.json({ success: true, subscription });
});

// GET /subscriptions - List user subscriptions
router.get('/', requireAuth, async (req, res) => {
  const userId = req.auth.id;

  const subscriptions = await pb.collection('user_subscriptions').getFullList({
    filter: `user_id = "${userId}"`,
    sort: '-fecha_creacion',
  });

  res.json({ subscriptions });
});

// PUT /subscriptions/:id - Update subscription
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.auth.id;
  const { materia_legal, estado, fuente, notificaciones_email, notificaciones_tiempo_real, activa } = req.body;

  const subscription = await pb.collection('user_subscriptions').getOne(id);

  if (subscription.user_id !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const updated = await pb.collection('user_subscriptions').update(id, {
    materia_legal: materia_legal || subscription.materia_legal,
    estado: estado || subscription.estado,
    fuente: fuente || subscription.fuente,
    notificaciones_email: notificaciones_email !== undefined ? notificaciones_email : subscription.notificaciones_email,
    notificaciones_tiempo_real: notificaciones_tiempo_real !== undefined ? notificaciones_tiempo_real : subscription.notificaciones_tiempo_real,
    activa: activa !== undefined ? activa : subscription.activa,
  });

  logger.info(`Subscription updated for user ${userId}: ${id}`);

  res.json({ success: true, subscription: updated });
});

// DELETE /subscriptions/:id - Delete subscription
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.auth.id;

  const subscription = await pb.collection('user_subscriptions').getOne(id);

  if (subscription.user_id !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await pb.collection('user_subscriptions').delete(id);

  logger.info(`Subscription deleted for user ${userId}: ${id}`);

  res.json({ success: true });
});

// GET /subscriptions/available - Get available options (no auth required)
router.get('/available', (req, res) => {
  res.json({
    materias: MATERIAS,
    estados: ESTADOS,
    fuentes: FUENTES,
  });
});

export default router;
