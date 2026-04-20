/**
 * Cliente PocketBase del frontend.
 *
 * CORRECCIÓN: URL configurable desde variable de entorno.
 * - Desarrollo local: VITE_POCKETBASE_URL=http://localhost:8090
 * - Producción Hostinger: /hcgi/platform (proxy reverso de Apache/Nginx)
 */

import Pocketbase from 'pocketbase';

const POCKETBASE_API_URL =
  import.meta.env.VITE_POCKETBASE_URL || '/hcgi/platform';

const pocketbaseClient = new Pocketbase(POCKETBASE_API_URL);

export default pocketbaseClient;
export { pocketbaseClient };
