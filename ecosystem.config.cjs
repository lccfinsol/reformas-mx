/**
 * PM2 Ecosystem Config — Reformas MX
 * Usar con: pm2 start ecosystem.config.cjs
 *
 * NOTA: .cjs porque el monorepo tiene "type":"module" en package.json raíz.
 */
module.exports = {
  apps: [
    {
      name: 'reformas-api',
      script: 'apps/api/src/main.js',
      cwd: __dirname,
      interpreter: 'node',
      interpreter_args: '--experimental-vm-modules',
      env: {
        NODE_ENV: 'production',
      },
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
    },
    {
      name: 'reformas-pocketbase',
      script: 'apps/pocketbase/pocketbase',
      args: 'serve --http=0.0.0.0:8090',
      cwd: __dirname + '/apps/pocketbase',
      interpreter: 'none',
      watch: false,
      max_memory_restart: '256M',
      restart_delay: 2000,
      max_restarts: 10,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '../../logs/pb-error.log',
      out_file: '../../logs/pb-out.log',
      merge_logs: true,
    },
  ],
};
