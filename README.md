# Reformas MX — Monitor de Legislación Mexicana

Plataforma full-stack para rastrear, clasificar y notificar reformas legales publicadas en el Diario Oficial de la Federación (DOF), Cámara de Diputados y Periódicos Oficiales de los 32 estados.

---

## Arquitectura del sistema

```
reformas-mx-monorepo/
├── apps/
│   ├── web/          → Frontend  · React 18 + Vite 7 + TailwindCSS + Radix UI
│   ├── api/          → Backend   · Express 5 + Socket.io + node-cron
│   └── pocketbase/   → Base de datos · PocketBase 0.25 (SQLite + Auth + Hooks)
├── package.json      → Scripts de monorepo (workspaces npm)
├── .gitignore
└── README.md
```

> Ver `diagrama_arquitectura.png` para el diagrama visual completo.

---

## Correcciones aplicadas (23 en total)

### Criticas — el proyecto no funcionaria sin estas

| # | Archivo | Problema | Corrección |
|---|---------|----------|------------|
| 1 | `pocketbaseClient.js` (API) | URL hardcodeada con `WEBSITE_DOMAIN` rompía en localhost y entornos sin ese env | Se usa `POCKETBASE_URL` directamente |
| 2 | `pocketbaseClient.js` (API) | IIFE con `process.exit(1)` mataba el servidor al arrancar si PocketBase aún no estaba listo | Se convierte en función `initializePocketBase()` exportable y lazy |
| 3 | `requireAdmin.js` | Leía `req.user` que NUNCA se establecía en ningún middleware → todas las rutas admin devolvían 401 | Se implementa verificación real de Bearer token contra PocketBase |
| 4 | `notifications.js` | Leía `req.auth?.id` que tampoco se establecía → rutas de notificaciones inaccesibles | Se implementa `requireAuth` con validación real de token |
| 5 | `dofScraper.js` | No usaba el parámetro `fecha` — siempre obtenía la página principal del DOF sin importar la fecha solicitada | Se construye URL correcta: `?fecha=DD-MM-YYYY` |
| 6 | `multiSourceScraper.js` | Recolectaba reformas pero NUNCA las guardaba en PocketBase — datos perdidos en memoria | Se añade `procesarYGuardarReformas()` con deduplicación |
| 7 | `pocketbaseService.js` | `checkDuplicateByUrl` buscaba campo `url` que no existe en la BD (es `url_fuente`) → deduplicación rota | Se corrige a `url_fuente` |
| 8 | `notifications.js` | Ruta `/unread-count` registrada DESPUÉS de `/:id` → Express interpretaba "unread-count" como un ID param | Se registra `/unread-count` primero |
| 9 | `main.js` | Handler 404 colocado DESPUÉS del error middleware → las rutas inexistentes caían al handler de error | Se reordena: 404 antes del error handler |
| 10 | `AuthContext.jsx` | `initializeSocket` creaba nuevo socket sin cerrar el anterior → leak de conexiones WebSocket | Se usa `socketRef` para desconectar antes de crear nuevo |

### De seguridad

| # | Archivo | Problema | Corrección |
|---|---------|----------|------------|
| 11 | `.env` (original) | Credenciales reales incluidas en el ZIP entregable | Se genera `.env.example` con valores placeholder |
| 12 | `logger.js` | Errores iban a `console.log` (stdout) en lugar de `console.error` (stderr) | Se corrige cada nivel al stream correcto |
| 13 | `global-rate-limit.js` | `validate.trustProxy: false` con `trust proxy: true` en main → conflicto en rate limiting | Se alinea a `trustProxy: true` |
| 14 | `main.js` | `CORS_ORIGIN=*` en producción permitía cualquier origen | Se fuerza respeto estricto de la variable |
| 15 | `apiServerClient.js` (web) | No enviaba el token de autenticación en peticiones al API → todas las rutas protegidas fallaban | Se añade header `Authorization: Bearer <token>` automático |

### De lógica y UX

| # | Archivo | Problema | Corrección |
|---|---------|----------|------------|
| 16 | `multiSourceScraper.js` | `Promise.allSettled` + `.then()` encadenado perdía el estado `rejected` de promesas | Se corrige el manejo de cada resultado individualmente |
| 17 | `camaraDiputadosScraper.js` | Apuntaba a la página principal de diputados.gob.mx, no al buscador de iniciativas por fecha | Se apunta al buscador con parámetros de fecha correctos |
| 18 | `scheduler.js` | Cron a las 6 AM UTC = 12 AM México → scraping a medianoche cuando el DOF publica por la mañana | Se ajusta a 14:00 UTC = 8:00 AM México |
| 19 | `HomePage.jsx` | `window.location.href` en SPA React → recarga completa de la app en cada búsqueda | Se reemplaza con `useNavigate()` de React Router |
| 20 | `HomePage.jsx` | `react-helmet` abandonado desde 2021, con memory leaks en React 18 | Se migra a `react-helmet-async` con `HelmetProvider` |
| 21 | Scrapers (3 archivos) | `MATERIA_KEYWORDS` y `TIPO_CAMBIO_KEYWORDS` duplicados exactos en 3 archivos | Se centralizan en `constants/common.js` |
| 22 | Scrapers (todos) | Reformas carecían de campos `fuente`, `estado`, `nivel` → filtros del notificationService fallaban | Se añaden estos campos en cada scraper |
| 23 | `notificationService.js` | Filtro PocketBase con escape de comillas inconsistente | Se usa función `escapePBValue()` centralizada |

---

## Requisitos previos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PocketBase** 0.25.x (incluido en `apps/pocketbase/pocketbase`)

---

## Instalación y arranque local

### 1. Clonar y configurar variables de entorno

```bash
git clone <tu-repositorio>
cd reformas-mx

# API backend
cp apps/api/.env.example apps/api/.env
# Editar apps/api/.env con tus credenciales reales

# Frontend web
cp apps/web/.env.example apps/web/.env.local
# Editar apps/web/.env.local (en desarrollo local, los defaults funcionan)
```

### 2. Instalar dependencias

```bash
npm run install:all
```

### 3. Iniciar en modo desarrollo (3 servicios en paralelo)

```bash
npm run dev
```

Esto levanta:
- **PocketBase**: `http://localhost:8090` (admin panel en `/_/`)
- **API**: `http://localhost:3001`
- **Web**: `http://localhost:3000`

### 4. Configurar PocketBase (primera vez)

1. Ir a `http://localhost:8090/_/`
2. Crear cuenta de superusuario con las mismas credenciales que pusiste en `.env`
3. Las migraciones se aplican automáticamente al iniciar PocketBase
4. Configurar en **Settings → Mail**: servidor SMTP para el envío de emails

---

## Variables de entorno

### `apps/api/.env`

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno | `development` / `production` |
| `PORT` | Puerto del API | `3001` |
| `POCKETBASE_URL` | URL de PocketBase | `http://localhost:8090` |
| `PB_SUPERUSER_EMAIL` | Email del superusuario | `admin@tudominio.com` |
| `PB_SUPERUSER_PASSWORD` | Contraseña del superusuario | (usa una segura) |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:3000` |

### `apps/web/.env.local`

| Variable | Descripción | Desarrollo | Producción |
|----------|-------------|------------|------------|
| `VITE_POCKETBASE_URL` | URL de PocketBase | `http://localhost:8090` | `/hcgi/platform` |
| `VITE_API_URL` | URL del API | `http://localhost:3001` | `/hcgi/api` |

---

## Scripts disponibles

```bash
npm run dev              # Levanta los 3 servicios en paralelo
npm run dev:api          # Solo el API backend
npm run dev:web          # Solo el frontend
npm run build            # Build del frontend para producción
npm run build:production # Build con NODE_ENV=production
npm run start            # Inicia API + PocketBase (producción)
npm run start:production # Igual con NODE_ENV=production
npm run lint             # ESLint en web y api
npm run clean            # Elimina node_modules y dist
npm run install:all      # Instala dependencias en todos los sub-proyectos
```

---

## Estructura de la base de datos (PocketBase)

### Colecciones principales

| Colección | Descripción |
|-----------|-------------|
| `reformas` | Registro de cada reforma legal (título, materia, fuente, fecha, URL) |
| `user_subscriptions` | Suscripciones de usuarios por materia/estado/fuente |
| `notification_history` | Historial de notificaciones enviadas |
| `scrape_logs` | Log de cada ejecución del scraper automático |
| `favoritos` | Reformas marcadas como favoritas por usuarios |
| `suscripciones` | Tabla legacy (mantener por compatibilidad) |

### Campos clave de `reformas`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `titulo` | text (required) | Título de la reforma |
| `contenido` | text (required) | Texto completo |
| `descripcion_corta` | text | Resumen corto (max 200 chars) |
| `fecha_publicacion` | date (required) | Fecha de publicación oficial |
| `fuente` | select | DOF, Cámara, Periódicos Estatales, Otros |
| `nivel` | select | Federal, Estatal, Municipal |
| `materia_legal` | select | Fiscal, Laboral, Mercantil, Penal, Civil, etc. |
| `url_fuente` | text | URL del documento fuente oficial |
| `tipo_cambio` | select | Nueva ley, Reforma, Adición, Derogación |
| `impacto` | select | Alto, Medio, Bajo |
| `estado` | text | Estado de la república (para reformas estatales) |

---

## Flujo del scraper automático

```
Scheduler (8:00 AM México / 14:00 UTC)
    │
    ├─── DOF Scraper          ─┐
    ├─── Cámara Diputados     ─┼─ Promise.allSettled() [paralelo]
    └─── Periódicos Estatales ─┘
                │
    Para cada reforma:
        1. Validar título no vacío
        2. checkDuplicateByUrl(url_fuente) → skip si duplicado
        3. saveReforma() → PocketBase collection 'reformas'
        4. PB Hook onRecordAfterCreateSuccess:
           - Filtra user_subscriptions que coincidan
           - Envía email via SMTP configurado en PocketBase
        5. Si Socket.IO disponible:
           - notificarEnTiempoReal() → usuario conectado
           - crearRegistroNotificacion() → notification_history
        6. saveScrapeLog() → scrape_logs
```

---

## Despliegue en Hostinger VPS

### Requisitos
- Plan **VPS** (no Shared Hosting — PocketBase requiere proceso persistente)
- Node.js 18+ instalado en el VPS
- PM2 para gestión de procesos

### Pasos

```bash
# 1. Subir el proyecto al VPS (excluir node_modules y .env)
rsync -avz --exclude='node_modules' --exclude='.env' \
  ./ usuario@tuip:/var/www/reformas-mx/

# 2. En el VPS: instalar dependencias
cd /var/www/reformas-mx
npm run install:all

# 3. Configurar variables de entorno de producción
nano apps/api/.env  # Editar con valores de producción

# 4. Build del frontend
npm run build:production

# 5. Instalar PM2
npm install -g pm2

# 6. Iniciar con PM2
pm2 start ecosystem.config.js

# 7. Guardar configuración de PM2 para reinicio automático
pm2 startup
pm2 save
```

### `ecosystem.config.js` (crear en raíz del proyecto)

```js
module.exports = {
  apps: [
    {
      name: 'reformas-api',
      script: 'apps/api/src/main.js',
      cwd: '/var/www/reformas-mx',
      env: { NODE_ENV: 'production' },
      watch: false,
      max_memory_restart: '500M',
    },
    {
      name: 'reformas-pocketbase',
      script: 'apps/pocketbase/pocketbase',
      args: 'serve --http=0.0.0.0:8090',
      cwd: '/var/www/reformas-mx/apps/pocketbase',
      interpreter: 'none',
      watch: false,
    },
  ],
};
```

### Nginx (proxy reverso)

```nginx
server {
    listen 80;
    server_name tudominio.com;

    # Frontend estático
    root /var/www/reformas-mx/dist/apps/web;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API backend
    location /hcgi/api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # PocketBase
    location /hcgi/platform/ {
        proxy_pass http://localhost:8090/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

---

## Desarrollo con plataformas no-code

Este proyecto puede desarrollarse y prototipado en **Lovable.dev** ya que el frontend usa exactamente el mismo stack (React + Vite + TailwindCSS + Radix UI / shadcn).

**Estrategia recomendada:**
1. Prototipar nuevas vistas en Lovable.dev
2. Exportar el código generado
3. Integrar en `apps/web/src/pages/` o `apps/web/src/components/`
4. Desplegar a Hostinger VPS con PM2

---

## Seguridad — lista de verificación

- [ ] Cambiar `PB_SUPERUSER_PASSWORD` por una contraseña fuerte (min 16 chars)
- [ ] Configurar `CORS_ORIGIN` con el dominio exacto en producción
- [ ] Habilitar HTTPS en Nginx (Let's Encrypt / Certbot)
- [ ] Asegurarse que `.env` esté en `.gitignore` (ya incluido)
- [ ] Configurar SMTP con credenciales reales en PocketBase Settings
- [ ] Revisar reglas de acceso en colecciones PocketBase (createRule, updateRule)
- [ ] Rotar credenciales de superusuario después del primer deploy

---

## Contacto y soporte

Proyecto desarrollado para **Sinapse Legal / Maxi-Cash-MX**  
Stack: Node.js · Express 5 · React 18 · PocketBase · Hostinger VPS
