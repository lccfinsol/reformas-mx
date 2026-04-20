/**
 * Rutas de administración.
 *
 * CORRECCIONES:
 * 1. CRÍTICO — Todas las rutas accesibles sin auth: ninguna ruta tenía
 *    requireAdmin aplicado → cualquier usuario (o anónimo) podía acceder
 *    a datos de suscriptores, exportar y hacer bulk actions.
 * 2. LÓGICA — req.user.id accedido directamente sin verificar que req.user
 *    exista: si requireAdmin fallaba silenciosamente, crasheaba con TypeError.
 * 3. CORRECCIÓN — routes/index.js no registraba el router de admin:
 *    /admin/* no era accesible. Se añade aquí y se actualiza index.js.
 */

import express from 'express';
import requireAdmin from '../middleware/requireAdmin.js';
import {
  obtenerSuscriptoresConDetalles,
  obtenerEstadisticas,
  exportarACSV,
  exportarAExcel,
  exportarAPDF,
  exportarAJSON,
} from '../services/exportService.js';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// CORRECCIÓN: requireAdmin en TODAS las rutas del router
router.use(requireAdmin);

/** GET /admin/subscribers — Lista con paginación y filtros */
router.get('/subscribers', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, Math.min(200, parseInt(req.query.limit) || 50));

  const filtros = {
    materia_legal: req.query.materia,
    fuente: req.query.fuente,
    estado: req.query.estado,
    busqueda: req.query.busqueda,
    page,
    limit,
  };

  const result = await obtenerSuscriptoresConDetalles(filtros, pb);

  logger.info('Admin: subscribers_list', { userId: req.user.id });

  res.json({
    success: true,
    subscribers: result.subscribers,
    total: result.total,
    page: result.page,
    limit: result.limit,
    timestamp: new Date().toISOString(),
  });
});

/** GET /admin/subscribers/statistics */
router.get('/subscribers/statistics', async (req, res) => {
  const estadisticas = await obtenerEstadisticas(pb);

  logger.info('Admin: subscribers_statistics', { userId: req.user.id });

  res.json({
    success: true,
    statistics: estadisticas,
    timestamp: new Date().toISOString(),
  });
});

/** GET /admin/subscribers/export */
router.get('/subscribers/export', async (req, res) => {
  const formato = (req.query.formato || '').toLowerCase();

  if (!['csv', 'excel', 'xlsx', 'pdf', 'json'].includes(formato)) {
    return res.status(400).json({ success: false, message: 'Formato inválido. Usa: csv, excel, xlsx, pdf, json' });
  }

  const filtros = {
    materia_legal: req.query.materia,
    fuente: req.query.fuente,
    estado: req.query.estado,
    page: 1,
    limit: 10_000,
  };

  const result = await obtenerSuscriptoresConDetalles(filtros, pb);
  const estadisticas = await obtenerEstadisticas(pb);
  const dateStr = new Date().toISOString().split('T')[0];

  let buffer, contentType, extension;

  switch (formato) {
    case 'csv':
      buffer = Buffer.from(exportarACSV(result.subscribers, estadisticas), 'utf-8');
      contentType = 'text/csv; charset=utf-8';
      extension = 'csv';
      break;
    case 'excel':
    case 'xlsx':
      buffer = exportarAExcel(result.subscribers, estadisticas);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
      break;
    case 'pdf':
      buffer = await exportarAPDF(result.subscribers, estadisticas);
      contentType = 'application/pdf';
      extension = 'pdf';
      break;
    case 'json':
      buffer = Buffer.from(exportarAJSON(result.subscribers, estadisticas), 'utf-8');
      contentType = 'application/json; charset=utf-8';
      extension = 'json';
      break;
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="subscribers_${dateStr}.${extension}"`);
  res.setHeader('Content-Length', buffer.length);

  logger.info('Admin: subscribers_export', { userId: req.user.id, formato });
  res.send(buffer);
});

/** GET /admin/subscribers/:id */
router.get('/subscribers/:id', async (req, res) => {
  const { id } = req.params;

  const user = await pb.collection('users').getOne(id).catch(() => null);
  if (!user) return res.status(404).json({ success: false, message: 'Suscriptor no encontrado' });

  const [subscriptions, notifications] = await Promise.all([
    pb.collection('user_subscriptions').getFullList({ filter: `user_id = "${id}"`, sort: '-created' }),
    pb.collection('notification_history').getList(1, 20, { filter: `user_id = "${id}"`, sort: '-fecha_envio' }),
  ]);

  res.json({
    success: true,
    subscriber: {
      id: user.id,
      nombre_completo: user.nombre_completo || user.nombre || user.name,
      email: user.email,
      numero_telefono: user.numero_telefono,
      pais_codigo: user.pais_codigo,
      activo: user.activo,
      is_admin: user.is_admin,
      fecha_registro: user.created,
    },
    subscriptions: subscriptions.map((s) => ({
      id: s.id,
      materia_legal: s.materia_legal,
      fuente: s.fuente,
      estado: s.estado,
      notificaciones_email: s.notificaciones_email,
      notificaciones_tiempo_real: s.notificaciones_tiempo_real,
      activa: s.activa,
    })),
    notifications: notifications.items.map((n) => ({
      id: n.id,
      tipo_notificacion: n.tipo_notificacion,
      fecha_envio: n.fecha_envio,
      leida: n.leida,
    })),
    timestamp: new Date().toISOString(),
  });
});

/** PUT /admin/subscribers/:id */
router.put('/subscribers/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_completo, numero_telefono, pais_codigo } = req.body;

  if (!nombre_completo?.trim()) {
    return res.status(400).json({ success: false, message: 'nombre_completo es requerido' });
  }

  if (numero_telefono && !/^[0-9+\-\s()]{8,20}$/.test(numero_telefono)) {
    return res.status(400).json({ success: false, message: 'numero_telefono inválido' });
  }

  const updateData = { nombre_completo: nombre_completo.trim() };
  if (numero_telefono) updateData.numero_telefono = numero_telefono;
  if (pais_codigo) updateData.pais_codigo = String(pais_codigo);

  const updated = await pb.collection('users').update(id, updateData);
  logger.info('Admin: subscriber_update', { userId: req.user.id, targetId: id });

  res.json({
    success: true,
    subscriber: { id: updated.id, nombre_completo: updated.nombre_completo, email: updated.email },
  });
});

/** DELETE /admin/subscribers/:id (soft delete) */
router.delete('/subscribers/:id', async (req, res) => {
  const { id } = req.params;
  await pb.collection('users').update(id, { activo: false });
  logger.info('Admin: subscriber_soft_delete', { userId: req.user.id, targetId: id });
  res.json({ success: true, timestamp: new Date().toISOString() });
});

/** POST /admin/bulk-action */
router.post('/bulk-action', async (req, res) => {
  const { action, subscriber_ids } = req.body;

  if (!['activate', 'deactivate', 'delete'].includes(action)) {
    return res.status(400).json({ success: false, message: 'action inválido. Usa: activate, deactivate, delete' });
  }
  if (!Array.isArray(subscriber_ids) || subscriber_ids.length === 0) {
    return res.status(400).json({ success: false, message: 'subscriber_ids debe ser un array no vacío' });
  }

  const activo = action === 'activate';
  let updatedCount = 0;

  for (const sid of subscriber_ids) {
    await pb.collection('users').update(sid, { activo });
    updatedCount++;
  }

  logger.info('Admin: bulk_action', { userId: req.user.id, action, count: updatedCount });
  res.json({ success: true, updated_count: updatedCount });
});

export default router;
