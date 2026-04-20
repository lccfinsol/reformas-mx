/**
 * Middleware de autenticación admin.
 *
 * CORRECCIONES:
 * 1. CRÍTICO — req.user siempre undefined: ningún middleware del pipeline
 *    establecía req.user antes de llegar aquí. Resultado: todas las rutas
 *    admin devolvían 401 o 500 sin importar qué token se enviara.
 *    Se implementa verificación real del Bearer token contra PocketBase.
 * 2. SEGURIDAD — throw en async middleware: en Express 5 se propaga, pero
 *    se mantiene next(error) como práctica estándar y explícita.
 */

import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

async function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado — token requerido' });
  }

  const token = authHeader.substring(7);

  try {
    // Guardar token temporalmente para validar
    pb.authStore.save(token, null);
    const authData = await pb.collection('users').authRefresh({ $autoCancel: false });
    const user = authData.record;

    if (!user.is_admin) {
      logger.warn(`Acceso admin denegado para usuario: ${user.id}`);
      return res.status(403).json({ error: 'Prohibido — se requieren permisos de administrador' });
    }

    // Inyectar usuario autenticado para uso en rutas
    req.user = user;
    logger.info('Acceso admin concedido', { userId: user.id });
    next();
  } catch (error) {
    logger.warn('Token admin inválido o expirado:', error.message);
    return res.status(401).json({ error: 'No autorizado — token inválido o expirado' });
  }
}

export default requireAdmin;
