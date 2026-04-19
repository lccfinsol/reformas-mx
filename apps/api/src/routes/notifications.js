/**
 * Rutas de notificaciones.
 *
 * CORRECCIONES APLICADAS:
 * 1. CRÍTICO - requireAuth siempre falla: el middleware verificaba `req.auth?.id`
 *    pero NADA en el pipeline establecía `req.auth`. En Express puro (sin
 *    PocketBase middleware) siempre era undefined → todas las rutas devolvían 401.
 *    Se implementa verificación real del token Bearer contra PocketBase.
 * 2. LÓGICA - /unread-count debe registrarse ANTES de /:id para evitar que
 *    Express interprete "unread-count" como un :id param.
 * 3. MEJORA - Paginación correcta en unread-count: no cargar TODA la lista,
 *    usar getList con limit 1 y aprovechar el total de la respuesta.
 * 4. MEJORA - Try/catch en todos los handlers (Express 5 propaga automáticamente
 *    pero es buena práctica para manejo explícito).
 */

import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * Middleware de autenticación para rutas de usuario.
 * Verifica el Bearer token contra PocketBase.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado — token requerido' });
  }

  const token = authHeader.substring(7);

  try {
    pb.authStore.save(token, null);
    const authData = await pb.collection('users').authRefresh();
    req.auth = authData.record; // Inyectar en request
    next();
  } catch {
    return res.status(401).json({ error: 'No autorizado — token inválido o expirado' });
  }
}

// CORRECCIÓN: /unread-count ANTES de /:id
// GET /notifications/unread-count
router.get('/unread-count', requireAuth, async (req, res) => {
  const userId = req.auth.id;

  // CORRECCIÓN: getList(1,1) + total es más eficiente que getFullList
  const result = await pb.collection('notification_history').getList(1, 1, {
    filter: `user_id = "${userId}" && leida = false`,
  });

  res.json({ unreadCount: result.totalItems });
});

// GET /notifications — Lista de notificaciones del usuario
router.get('/', requireAuth, async (req, res) => {
  const userId = req.auth.id;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  const result = await pb.collection('notification_history').getList(page, limit, {
    filter: `user_id = "${userId}"`,
    sort: '-fecha_envio',
    expand: 'reforma_id',
  });

  const notifications = result.items.map((notif) => ({
    id: notif.id,
    tipo_notificacion: notif.tipo_notificacion,
    fecha_envio: notif.fecha_envio,
    leida: notif.leida,
    fecha_lectura: notif.fecha_lectura,
    reforma: notif.expand?.reforma_id
      ? {
          id: notif.expand.reforma_id.id,
          titulo: notif.expand.reforma_id.titulo,
          materia_legal: notif.expand.reforma_id.materia_legal,
          fuente: notif.expand.reforma_id.fuente,
        }
      : null,
  }));

  res.json({
    notifications,
    total: result.totalItems,
    page,
    limit,
    totalPages: result.totalPages,
  });
});

// PUT /notifications/:id/read — Marcar como leída
router.put('/:id/read', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.auth.id;

  const notification = await pb.collection('notification_history').getOne(id);

  if (notification.user_id !== userId) {
    return res.status(403).json({ error: 'Prohibido' });
  }

  await pb.collection('notification_history').update(id, {
    leida: true,
    fecha_lectura: new Date().toISOString(),
  });

  logger.info(`Notificación marcada como leída: ${id}`);
  res.json({ success: true });
});

// DELETE /notifications/:id — Eliminar notificación
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const userId = req.auth.id;

  const notification = await pb.collection('notification_history').getOne(id);

  if (notification.user_id !== userId) {
    return res.status(403).json({ error: 'Prohibido' });
  }

  await pb.collection('notification_history').delete(id);
  logger.info(`Notificación eliminada: ${id}`);
  res.json({ success: true });
});

export default router;
