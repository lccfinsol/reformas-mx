import 'dotenv/config';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

async function sendNotification(userId, reformaId, tipo) {
  try {
    const record = await pb.collection('notification_history').create({
      user_id: userId,
      reforma_id: reformaId,
      tipo_notificacion: tipo || 'email',
      fecha_envio: new Date().toISOString(),
      leida: false,
    });

    logger.info(`Notificación creada para usuario ${userId}: ${record.id}`);
    return record;
  } catch (error) {
    logger.error(`Error creando notificación: ${error.message}`);
    throw error;
  }
}

export { sendNotification };
