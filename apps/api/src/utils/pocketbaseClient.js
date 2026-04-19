/**
 * Cliente PocketBase para el API backend.
 *
 * CORRECCIONES APLICADAS:
 * 1. CRÍTICO - URL hardcodeada: usaba WEBSITE_DOMAIN con prefijo https fijo,
 *    rompía en localhost/Hostinger. Se usa POCKETBASE_URL directamente.
 * 2. CRÍTICO - IIFE sin manejo de proceso: process.exit(1) en IIFE inicial
 *    mataba el servidor completo al arrancar si PocketBase aún no estaba listo.
 *    Se convierte en función exportable y lazy.
 * 3. SEGURIDAD - Credenciales en logs: el error imprimía stack con credenciales
 *    potencialmente expuestas. Se sanitiza.
 * 4. LÓGICA - Race condition en authPromise: múltiples peticiones concurrentes
 *    podían disparar múltiples auths. Se refuerza el guard.
 * 5. MEJORA - waitForHealth: ahora no lanza excepción catastrófica, sino que
 *    avisa y continúa (PocketBase puede arrancar después que el API).
 */

import dotenv from 'dotenv';
dotenv.config();
import Pocketbase from 'pocketbase';
import logger from './logger.js';

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://localhost:8090';

async function waitForHealth({ retries = 12, delayMs = 2000 } = {}) {
  for (let i = 1; i <= retries; i++) {
    try {
      const response = await fetch(`${POCKETBASE_URL}/api/health`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        logger.info('PocketBase health check OK');
        return true;
      }
    } catch {
      // Silencioso — todavía no está listo
    }

    logger.warn(`PocketBase no listo, reintentando (${i}/${retries}) en ${delayMs}ms...`);
    await new Promise((r) => setTimeout(r, delayMs));
  }

  logger.warn(`PocketBase no respondió después de ${retries} intentos. Continuando de todos modos...`);
  return false;
}

const pocketbaseClient = new Pocketbase(POCKETBASE_URL);
pocketbaseClient.autoCancellation(false);

let authPromise = null;

async function ensureAuth() {
  // Si ya está autenticado, no hacer nada
  if (pocketbaseClient.authStore.isValid) return;

  // Si ya hay un auth en progreso, esperar ese
  if (authPromise) {
    await authPromise;
    return;
  }

  authPromise = pocketbaseClient
    .collection('_superusers')
    .authWithPassword(
      process.env.PB_SUPERUSER_EMAIL,
      process.env.PB_SUPERUSER_PASSWORD,
    )
    .finally(() => {
      authPromise = null;
    });

  await authPromise;
}

// Interceptor antes de cada petición
pocketbaseClient.beforeSend = async function (url, options) {
  // No interceptar la propia petición de auth para evitar loop
  if (url.includes('/api/collections/_superusers/auth-with-password')) {
    return { url, options };
  }

  await ensureAuth();

  if (pocketbaseClient.authStore.token) {
    options.headers = options.headers || {};
    options.headers['Authorization'] = pocketbaseClient.authStore.token;
  }

  return { url, options };
};

// Inicialización no bloqueante
export async function initializePocketBase() {
  try {
    await waitForHealth();
    await ensureAuth();
    logger.info('PocketBase client inicializado correctamente');
  } catch (err) {
    // SEGURIDAD: no imprimir stack completo que puede contener credenciales
    logger.error('Error al inicializar PocketBase client:', err.message);
    throw err; // El llamador decide si hacer process.exit
  }
}

export default pocketbaseClient;
export { pocketbaseClient };
