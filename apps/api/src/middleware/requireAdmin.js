/**
 * Middleware de autorización admin.
 *
 * CORRECCIONES APLICADAS:
 * 1. CRÍTICO - req.user siempre undefined: el middleware leía req.user pero
 *    NINGÚN middleware previo lo establecía. El API no tiene auth middleware
 *    para rutas de usuario — req.user nunca existe. Se añade verificación
 *    del header Authorization con token PocketBase y validación real.
 * 2. CRÍTICO - throw en middleware Express 5: en Express 5, throw en
 *    middleware asíncrono SÍ se propaga (mejorado vs Express 4), pero se
 *    mantiene next(error) como práctica estándar.
 * 3. SEGURIDAD - import dotenv innecesario: el dotenv ya se carga en main.js.
 *    Se elimina la carga duplicada.
 */

import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

/**
 * Verifica que el request incluya un token válido de PocketBase
 * y que el usuario tenga is_admin = true.
 */
async function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado — token requerido' });
  }

  const token = authHeader.substring(7);

  try {
    // Verificar token con PocketBase
    pb.authStore.save(token, null);

    // Obtener datos del usuario autenticado
    const authData = await pb.collection('users').authRefresh();
    const user = authData.record;

    if (!user.is_admin) {
      logger.warn(`Acceso admin denegado para usuario: ${user.id}`);
      return res.status(403).json({ error: 'Prohibido — se requieren permisos de administrador' });
    }

    // Inyectar usuario en request para uso posterior
    req.user = user;

    logger.info('Acceso admin concedido', { userId: user.id });
    next();
  } catch (error) {
    logger.warn('Token de admin inválido o expirado:', error.message);
    return res.status(401).json({ error: 'No autorizado — token inválido o expirado' });
  }
}

export default requireAdmin;
