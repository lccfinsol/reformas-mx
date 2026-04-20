/**
 * Cliente HTTP para el API backend (Express).
 *
 * CORRECCIONES:
 * 1. CRÍTICO — Sin token de autenticación: las peticiones al API no enviaban
 *    el Bearer token → todas las rutas protegidas devolvían 401.
 * 2. CRÍTICO — Sin manejo de errores HTTP: un 401, 403 o 500 se resolvía
 *    como respuesta válida (sin throw), silenciando errores en la UI.
 * 3. MEJORA — URL configurable con VITE_API_URL (dev: localhost:3001,
 *    prod: /hcgi/api para Hostinger).
 */

import pb from '@/lib/pocketbaseClient.js';

const API_SERVER_URL = import.meta.env.VITE_API_URL || '/hcgi/api';

const apiServerClient = {
  fetch: async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // CORRECCIÓN: incluir token Bearer si el usuario está autenticado
    if (pb.authStore.isValid && pb.authStore.token) {
      headers['Authorization'] = `Bearer ${pb.authStore.token}`;
    }

    const response = await window.fetch(API_SERVER_URL + url, {
      ...options,
      headers,
    });

    // CORRECCIÓN: lanzar error en respuestas no exitosas
    if (!response.ok) {
      let errorMsg = `Error ${response.status}: ${response.statusText}`;
      try {
        const body = await response.clone().json();
        if (body?.error) errorMsg = body.error;
      } catch {
        // No es JSON — mantener mensaje HTTP
      }
      const err = new Error(errorMsg);
      err.status = response.status;
      throw err;
    }

    return response;
  },

  get: (url, options = {}) =>
    apiServerClient.fetch(url, { ...options, method: 'GET' }),

  post: (url, body, options = {}) =>
    apiServerClient.fetch(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: (url, body, options = {}) =>
    apiServerClient.fetch(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: (url, options = {}) =>
    apiServerClient.fetch(url, { ...options, method: 'DELETE' }),
};

export default apiServerClient;
export { apiServerClient };
