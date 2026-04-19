/**
 * Servicio de notificaciones.
 *
 * CORRECCIONES APLICADAS:
 * 1. CRÍTICO - reforma.fuente podía ser undefined: el filtro PocketBase
 *    incluía `reforma.fuente` que no existía en las reformas del scraper
 *    original (solo tenían `url`, no `url_fuente` ni `fuente`).
 *    Se añade valor por defecto y validación.
 * 2. LÓGICA - obtenerSuscriptoresParaReforma: el filtro PocketBase tenía
 *    comillas mal escapadas con replace(/"/g, '\\"') pero PocketBase
 *    usa su propio lenguaje de filtros. Se usa encodeURIComponent o
 *    se sanitiza el valor.
 * 3. LÓGICA - enviarNotificacionEmail: solo creaba un registro en
 *    notification_history pero NO enviaba email real. El envío de email
 *    real ocurre en el pb_hook. Se documenta esto claramente.
 * 4. MEJORA - notificarEnTiempoReal: se valida que `io` exista antes de
 *    usar namespace para evitar crash silencioso.
 */

import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

/**
 * Escapa valores para filtros PocketBase.
 * PocketBase usa ~ para contains, = para equals, y comillas simples o dobles.
 */
function escapePBValue(value) {
  if (typeof value !== 'string') return String(value);
  return value.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

async function obtenerSuscriptoresParaReforma(reforma) {
  const materia = escapePBValue(reforma.materia_legal || '');
  const fuente = escapePBValue(reforma.fuente || 'Todas');
  const estado = escapePBValue(reforma.estado || 'Federal');

  const filter = [
    `(materia_legal = "${materia}" || materia_legal = "Todas")`,
    `(fuente = "Todas" || fuente = "${fuente}")`,
    `(estado = "Federal" || estado = "${estado}")`,
    `activa = true`,
    `(notificaciones_email = true || notificaciones_tiempo_real = true)`,
  ].join(' && ');

  try {
    const subscriptions = await pb.collection('user_subscriptions').getFullList({
      filter,
      expand: 'user_id',
    });

    const subscribers = subscriptions.map((sub) => ({
      userId: sub.user_id,
      email: sub.expand?.user_id?.email || null,
      nombre: sub.expand?.user_id?.nombre_completo || sub.expand?.user_id?.name || '',
      notificaciones_email: sub.notificaciones_email,
      notificaciones_tiempo_real: sub.notificaciones_tiempo_real,
    }));

    logger.info(`${subscribers.length} suscriptores encontrados para: ${reforma.titulo}`);
    return subscribers;
  } catch (error) {
    logger.error('Error obteniendo suscriptores:', error.message);
    return [];
  }
}

/**
 * Registra la notificación de email en el historial.
 * NOTA: El envío real del email ocurre automáticamente en el pb_hook
 * `send-reforma-notification-email.pb.js` al crear el registro en `reformas`.
 * Esta función solo registra el intento en notification_history.
 */
async function enviarNotificacionEmail(usuario, reforma) {
  if (!usuario.email) {
    logger.warn(`Usuario ${usuario.userId} no tiene email configurado`);
    return { success: false, reason: 'no_email' };
  }

  try {
    const record = await pb.collection('notification_history').create({
      user_id: usuario.userId,
      reforma_id: reforma.id,
      tipo_notificacion: 'email',
      fecha_envio: new Date().toISOString(),
      leida: false,
    });

    logger.info(`Notificación email registrada para usuario ${usuario.userId}: ${record.id}`);
    return { success: true, notificationId: record.id };
  } catch (error) {
    logger.error(`Error registrando notificación email:`, error.message);
    return { success: false, reason: error.message };
  }
}

async function crearRegistroNotificacion(userId, reformaId, tipoNotificacion) {
  try {
    const record = await pb.collection('notification_history').create({
      user_id: userId,
      reforma_id: reformaId,
      tipo_notificacion: tipoNotificacion,
      fecha_envio: new Date().toISOString(),
      leida: false,
    });

    logger.debug(`Registro notificación creado: ${record.id}`);
    return record.id;
  } catch (error) {
    logger.error('Error creando registro de notificación:', error.message);
    return null;
  }
}

function notificarEnTiempoReal(usuariosIds, reforma, io) {
  if (!io) {
    logger.warn('Socket.IO no disponible para notificaciones en tiempo real');
    return;
  }

  if (!Array.isArray(usuariosIds) || usuariosIds.length === 0) return;

  const payload = {
    id: reforma.id,
    titulo: reforma.titulo,
    materia_legal: reforma.materia_legal,
    tipo_cambio: reforma.tipo_cambio,
    impacto: reforma.impacto,
    url_fuente: reforma.url_fuente,
    fuente: reforma.fuente,
    estado: reforma.estado,
  };

  try {
    const nsp = io.of('/notifications');
    usuariosIds.forEach((userId) => {
      nsp.to(`user_${userId}`).emit('new-reforma', payload);
      logger.debug(`Notificación tiempo real enviada a usuario ${userId}`);
    });
  } catch (error) {
    logger.error('Error en notificación tiempo real:', error.message);
  }
}

export {
  obtenerSuscriptoresParaReforma,
  enviarNotificacionEmail,
  crearRegistroNotificacion,
  notificarEnTiempoReal,
};
