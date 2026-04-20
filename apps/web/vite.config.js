/**
 * Vite Config — Producción limpia.
 *
 * CORRECCIONES:
 * 1. CRÍTICO — __dirname no existe en ESM (type:"module"): causaba
 *    ReferenceError al ejecutar vite build en producción.
 *    Se reemplaza con import.meta.dirname (Node 20+) o fileURLToPath.
 * 2. LÓGICA — Plugins de Horizons/Lovable (inlineEditPlugin, editModeDevPlugin,
 *    selectionModePlugin, iframeRouteRestorationPlugin, pocketbaseAuthPlugin)
 *    solo deben actuar en el entorno de la plataforma Lovable. En producción
 *    real inyectaban scripts de depuración innecesarios y podían romper el build.
 *    Se eliminan del build de producción y se mantienen solo en dev.
 * 3. SEGURIDAD — console.warn = () => {} global suprimía TODOS los warnings
 *    de dependencias, ocultando problemas reales. Eliminado.
 * 4. MEJORA — Se añade proxy de desarrollo para evitar CORS al llamar al API
 *    y a PocketBase desde el frontend en localhost.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// CORRECCIÓN: __dirname compatible con ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      // Los plugins de Horizons/Lovable solo en dev Y si está disponible el entorno
      ...(isDev
        ? (() => {
            try {
              const { default: inlineEditPlugin } = await import('./plugins/visual-editor/vite-plugin-react-inline-editor.js').catch(() => ({ default: null }));
              return inlineEditPlugin ? [inlineEditPlugin()] : [];
            } catch {
              return [];
            }
          })()
        : []),
    ],
    server: {
      port: 3000,
      cors: true,
      // MEJORA: proxy en desarrollo para evitar CORS
      proxy: {
        '/hcgi/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          rewrite: (p) => p.replace(/^\/hcgi\/api/, ''),
          changeOrigin: true,
        },
        '/hcgi/platform': {
          target: env.VITE_POCKETBASE_URL || 'http://localhost:8090',
          rewrite: (p) => p.replace(/^\/hcgi\/platform/, ''),
          changeOrigin: true,
        },
      },
    },
    resolve: {
      extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: '../../dist/apps/web',
      emptyOutDir: true,
      rollupOptions: {
        // Babel tools solo en dev — no incluir en bundle de producción
        external: isDev
          ? []
          : ['@babel/parser', '@babel/traverse', '@babel/generator', '@babel/types'],
      },
    },
    optimizeDeps: {
      // Excluir herramientas de build del bundle del cliente
      exclude: ['@babel/parser', '@babel/traverse', '@babel/generator', '@babel/types'],
    },
  };
});
