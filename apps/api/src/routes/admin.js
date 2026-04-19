import express from 'express';
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

/**
 * GET /subscribers
 * List subscribers with pagination and filters
 */
router.get('/subscribers', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 50);
  const materia = req.query.materia;
  const fuente = req.query.fuente;
  const estado = req.query.estado;
  const busqueda = req.query.busqueda;

  const filtros = {
    materia_legal: materia,
    fuente,
    estado,
    busqueda,
    page,
    limit,
  };

  const result = await obtenerSuscriptoresConDetalles(filtros, pb);

  logger.info('Admin action', {
    action: 'subscribers_list',
    user_id: req.user.id,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    subscribers: result.subscribers,
    total: result.total,
    page: result.page,
    limit: result.limit,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /subscribers/statistics
 * Get subscriber statistics
 */
router.get('/subscribers/statistics', async (req, res) => {
  const estadisticas = await obtenerEstadisticas(pb);

  logger.info('Admin action', {
    action: 'subscribers_statistics',
    user_id: req.user.id,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    statistics: {
      total_suscriptores: estadisticas.total_suscriptores,
      por_materia: estadisticas.por_materia,
      por_fuente: estadisticas.por_fuente,
      por_estado: estadisticas.por_estado,
      activos: estadisticas.activos,
      inactivos: estadisticas.inactivos,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /subscribers/export
 * Export subscribers in various formats
 */
router.get('/subscribers/export', async (req, res) => {
  const formato = req.query.formato || '';
  const materia = req.query.materia;
  const fuente = req.query.fuente;
  const estado = req.query.estado;

  // Validate formato
  if (!['csv', 'excel', 'xlsx', 'pdf', 'json'].includes(formato.toLowerCase())) {
    return res.status(400).json({ success: false, message: 'Formato inválido' });
  }

  const filtros = {
    materia_legal: materia,
    fuente,
    estado,
    page: 1,
    limit: 10000, // Get all records for export
  };

  const result = await obtenerSuscriptoresConDetalles(filtros, pb);
  const suscriptores = result.subscribers;
  const estadisticas = await obtenerEstadisticas(pb);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  let buffer;
  let contentType;
  let extension;

  switch (formato.toLowerCase()) {
    case 'csv':
      buffer = Buffer.from(exportarACSV(suscriptores, estadisticas), 'utf-8');
      contentType = 'text/csv; charset=utf-8';
      extension = 'csv';
      break;

    case 'excel':
    case 'xlsx':
      buffer = exportarAExcel(suscriptores, estadisticas);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
      break;

    case 'pdf':
      buffer = await exportarAPDF(suscriptores, estadisticas);
      contentType = 'application/pdf';
      extension = 'pdf';
      break;

    case 'json':
      buffer = Buffer.from(exportarAJSON(suscriptores, estadisticas), 'utf-8');
      contentType = 'application/json; charset=utf-8';
      extension = 'json';
      break;
  }

  const filename = `subscribers_${dateStr}.${extension}`;

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);

  logger.info('Admin action', {
    action: 'subscribers_export',
    user_id: req.user.id,
    formato,
    timestamp: new Date().toISOString(),
  });

  res.send(buffer);
});

/**
 * GET /subscribers/:id
 * Get detailed subscriber information
 */
router.get('/subscribers/:id', async (req, res) => {
  const { id } = req.params;

  const user = await pb.collection('users').getOne(id).catch(() => null);

  if (!user) {
    return res.status(404).json({ success: false, message: 'Suscriptor no encontrado' });
  }

  const subscriptions = await pb.collection('user_subscriptions').getFullList({
    filter: `user_id = "${id}"`,
    sort: '-fecha_creacion',
  });

  const notifications = await pb.collection('notification_history').getFullList({
    filter: `user_id = "${id}"`,
    sort: '-fecha_envio',
    limit: 20,
  });

  logger.info('Admin action', {
    action: 'subscribers_get_details',
    user_id: req.user.id,
    subscriber_id: id,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    subscriber: {
      id: user.id,
      nombre_completo: user.nombre || user.name,
      email: user.email,
      numero_telefono: user.numero_telefono,
      pais_codigo: user.pais_codigo,
      activo: user.activo,
      fecha_registro: user.created,
    },
    subscriptions: subscriptions.map(sub => ({
      id: sub.id,
      materia_legal: sub.materia_legal,
      fuente: sub.fuente,
      estado: sub.estado,
      notificaciones_email: sub.notificaciones_email,
      notificaciones_tiempo_real: sub.notificaciones_tiempo_real,
      activa: sub.activa,
      fecha_creacion: sub.fecha_creacion,
    })),
    notifications: notifications.map(notif => ({
      id: notif.id,
      tipo_notificacion: notif.tipo_notificacion,
      fecha_envio: notif.fecha_envio,
      leida: notif.leida,
    })),
    timestamp: new Date().toISOString(),
  });
});

/**
 * PUT /subscribers/:id
 * Update subscriber information
 */
router.put('/subscribers/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre_completo, numero_telefono, pais_codigo } = req.body;

  // Validate required field
  if (!nombre_completo || typeof nombre_completo !== 'string' || nombre_completo.trim() === '') {
    return res.status(400).json({ success: false, message: 'Validación fallida: nombre_completo inválido' });
  }

  // Validate phone number if provided
  if (numero_telefono) {
    const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
    if (!phoneRegex.test(numero_telefono)) {
      return res.status(400).json({ success: false, message: 'Validación fallida: numero_telefono inválido' });
    }
  }

  // Validate pais_codigo if provided
  if (pais_codigo && typeof pais_codigo !== 'string') {
    return res.status(400).json({ success: false, message: 'Validación fallida: pais_codigo inválido' });
  }

  const updateData = {
    nombre: nombre_completo.trim(),
  };

  if (numero_telefono) updateData.numero_telefono = numero_telefono;
  if (pais_codigo) updateData.pais_codigo = pais_codigo;

  const updated = await pb.collection('users').update(id, updateData);

  logger.info('Admin action', {
    action: 'subscribers_update',
    user_id: req.user.id,
    subscriber_id: id,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    subscriber: {
      id: updated.id,
      nombre_completo: updated.nombre || updated.name,
      email: updated.email,
      numero_telefono: updated.numero_telefono,
      pais_codigo: updated.pais_codigo,
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * DELETE /subscribers/:id
 * Soft delete subscriber (set activo=false)
 */
router.delete('/subscribers/:id', async (req, res) => {
  const { id } = req.params;

  await pb.collection('users').update(id, { activo: false });

  logger.info('Admin action', {
    action: 'subscribers_delete',
    user_id: req.user.id,
    subscriber_id: id,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /bulk-action
 * Perform bulk actions on subscribers
 */
router.post('/bulk-action', async (req, res) => {
  const { action, subscriber_ids } = req.body;

  // Validate input
  if (!action || typeof action !== 'string') {
    return res.status(400).json({ success: false, message: 'Validación fallida: action inválido' });
  }

  if (!subscriber_ids || !Array.isArray(subscriber_ids) || subscriber_ids.length === 0) {
    return res.status(400).json({ success: false, message: 'Validación fallida: subscriber_ids inválido' });
  }

  if (!['activate', 'deactivate', 'delete'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Validación fallida: action inválido' });
  }

  let updatedCount = 0;

  for (const subscriberId of subscriber_ids) {
    const updateData = {};

    switch (action) {
      case 'activate':
        updateData.activo = true;
        break;
      case 'deactivate':
      case 'delete':
        updateData.activo = false;
        break;
    }

    await pb.collection('users').update(subscriberId, updateData);
    updatedCount++;
  }

  logger.info('Admin action', {
    action: 'subscribers_bulk_action',
    user_id: req.user.id,
    bulk_action: action,
    count: updatedCount,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    updated_count: updatedCount,
    timestamp: new Date().toISOString(),
  });
});

export default router;
