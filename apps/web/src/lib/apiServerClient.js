/**
 * Cliente HTTP para el API backend (Express).
 *
 * CORRECCIONES:
 * 1. MEJORA - URL configurable desde env. En desarrollo: localhost:3001.
 * 2. MEJORA - Se incluye automáticamente el token de PocketBase en el header
 *    Authorization para las rutas protegidas del API.
 * 3. MEJORA - Manejo de errores HTTP con mensajes descriptivos.
 */

import pb from './pocketbaseClient';

const API_SERVER_URL = import.meta.env.VITE_API_URL || '/hcgi/api';

const apiServerClient = {
  fetch: async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Incluir token de auth si existe
    if (pb.authStore.isValid && pb.authStore.token) {
      headers['Authorization'] = `Bearer ${pb.authStore.token}`;
    }

    const response = await window.fetch(API_SERVER_URL + url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      const error = new Error(
        `API Error ${response.status}: ${response.statusText}${errorBody ? ` — ${errorBody}` : ''}`,
      );
      error.status = response.status;
      throw error;
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
