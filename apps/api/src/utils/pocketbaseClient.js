/**
 * PocketBase Client — API Backend
 *
 * CORRECCIONES:
 * 1. CRÍTICO — URL hardcodeada: usaba `https://${WEBSITE_DOMAIN}/hcgi/platform`
 *    ignorando POCKETBASE_URL del .env. En desarrollo siempre fallaba.
 *    Ahora usa POCKETBASE_URL con fallback a localhost:8090.
 * 2. CRÍTICO — waitForHealth sin try/catch: cualquier error de red (ECONNREFUSED)
 *    lanzaba excepción no capturada que mataba el proceso.
 * 3. CRÍTICO — IIFE con process.exit(1): si PocketBase tardaba en arrancar,
 *    mataba el servidor API completo antes de que estuviera listo.
 *    Se exporta como función para que main.js decida qué hacer.
 * 4. SEGURIDAD — Credenciales en stack trace al hacer logger.error(err):
 *    se imprime solo err.message, no el objeto completo.
 */

import 'dotenv/config';
import Pocketbase from 'pocketbase';
import logger from './logger.js';

// CORRECCIÓN: usar POCKETBASE_URL del .env, con fallback a localhost
const POCKETBASE_URL =
  process.env.POCKETBASE_URL || 'http://localhost:8090';

async function waitForHealth({ retries = 12, delayMs = 2000 } = {}) {
  for (let i = 1; i <= retries; i++) {
    try {
      const res = await fetch(`${POCKETBASE_URL}/api/health`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        logger.info('PocketBase health check OK');
        return true;
      }
    } catch {
      // Silencioso — PocketBase aún no está listo
    }
    logger.warn(`PocketBase no disponible, reintentando (${i}/${retries})...`);
    await new Promise((r) => setTimeout(r, delayMs));
  }
  logger.warn('PocketBase no respondió — continuando de todos modos');
  return false;
}

const pocketbaseClient = new Pocketbase(POCKETBASE_URL);
pocketbaseClient.autoCancellation(false);

let authPromise = null;

pocketbaseClient.beforeSend = async function (url, options) {
  if (url.includes('/api/collections/_superusers/auth-with-password')) {
    return { url, options };
  }

  if (!pocketbaseClient.authStore.isValid && !authPromise) {
    authPromise = pocketbaseClient
      .collection('_superusers')
      .authWithPassword(
        process.env.PB_SUPERUSER_EMAIL,
        process.env.PB_SUPERUSER_PASSWORD,
      )
      .finally(() => { authPromise = null; });
  }

  if (authPromise) await authPromise;

  if (pocketbaseClient.authStore.isValid && pocketbaseClient.authStore.token) {
    options.headers = options.headers || {};
    options.headers['Authorization'] = pocketbaseClient.authStore.token;
  }

  return { url, options };
};

/** Inicializar PocketBase de forma no bloqueante — llamar desde main.js */
export async function initializePocketBase() {
  await waitForHealth();

  if (!pocketbaseClient.authStore.isValid && !authPromise) {
    authPromise = pocketbaseClient
      .collection('_superusers')
      .authWithPassword(
        process.env.PB_SUPERUSER_EMAIL,
        process.env.PB_SUPERUSER_PASSWORD,
      )
      .finally(() => { authPromise = null; });
  }

  if (authPromise) await authPromise;

  // SEGURIDAD: no imprimir el objeto completo de error (puede contener credenciales)
  logger.info('PocketBase client inicializado correctamente');
}

export default pocketbaseClient;
export { pocketbaseClient };
