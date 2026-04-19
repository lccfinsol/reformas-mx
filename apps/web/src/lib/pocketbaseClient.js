/**
 * Cliente PocketBase del frontend.
 *
 * CORRECCIONES:
 * 1. MEJORA - URL configurable desde variable de entorno en lugar de hardcodear
 *    "/hcgi/platform". En desarrollo local necesita apuntar a localhost:8090.
 * 2. MEJORA - Se exporta la URL base para uso en apiServerClient.
 */

import Pocketbase from 'pocketbase';

// En producción (Hostinger): /hcgi/platform (proxy reverso)
// En desarrollo local: http://localhost:8090
const POCKETBASE_API_URL =
  import.meta.env.VITE_POCKETBASE_URL || '/hcgi/platform';

const pocketbaseClient = new Pocketbase(POCKETBASE_API_URL);

export default pocketbaseClient;
export { pocketbaseClient, POCKETBASE_API_URL };
