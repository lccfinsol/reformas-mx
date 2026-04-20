/**
 * Rutas de notificaciones.
 *
 * CORRECCIONES:
 * 1. CRÍTICO — req.auth nunca definido: el middleware requireAuth chequeaba
 *    req.auth?.id pero nada lo establecía → todas las rutas devolvían 401.
 *    Se implementa verificación real del Bearer token contra PocketBase.
 * 2. LÓGICA — /unread-count registrada DESPUÉS de /:id: Express interpretaba
 *    "unread-count" como un :id param → ruta equivocada siempre.
 * 3. RENDIMIENTO — getFullList en /unread-count carga TODOS los registros
 *    en memoria solo para contar. Se usa getList(1,1) + totalItems.
 * 4. CORRECCIÓN — result.total no existe en PocketBase SDK: es result.totalItems.
 */

import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

/** Verifica Bearer token de usuario normal contra PocketBase */
async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado — token requerido' });
  }

  const token = authHeader.substring(7);

  try {
    pb.authStore.save(token, null);
    const authData = await pb.collection('users').authRefresh({ $autoCancel: false });
    req.auth = authData.record; // inyectar usuario en request
    next();
  } catch {
    return res.status(401).json({ error: 'No autorizado — token inválido o expirado' });
  }
}

// CORRECCIÓN: /unread-count ANTES de /:id para evitar conflicto de parámetro
router.get('/unread-count', requireAuth, async (req, res) => {
  const userId = req.auth.id;

  // CORRECCIÓN: getList(1,1) es eficiente — solo lee 1 fila para obtener el total
  const result = await pb.collection('notification_history').getList(1, 1, {
    filter: `user_id = "${userId}" && leida = false`,
  });

  res.json({ success: true, unreadCount: result.totalItems });
});

// GET /notifications — Lista de notificaciones del usuario autenticado
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
    success: true,
    notifications,
    total: result.totalItems,  // CORRECCIÓN: totalItems, no total
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
