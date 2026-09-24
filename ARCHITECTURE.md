# Arquitectura — FRONT Valencia

### Propósito de este documento

- **Objetivos:** Describir el sistema (Astro + Payload + Postgres + R2), el flujo de datos y las decisiones de despliegue del producto local.
- **Estructura:** Diagrama → justificación del stack → flujo → colecciones → seguridad → i18n → rendimiento.
- **Contenido a integrar según contexto:** Adapta hosting y colecciones de FRONT Valencia. No copies la arquitectura de otro sitio. Los ADRs canónicos están en `docs/architecture/decisions/`.

**Versión:** 1.0.0  
**Última actualización:** Julio 2026  
**Stack:** Payload CMS 3 + Astro 7 + React 19 + Tailwind v4 + Postgres + Turborepo

---

## 1. Diagrama de arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             INTERNET (Usuario)                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      Cloudflare DNS      │
                    │  frontvalencia.com       │
                    └────────────┬────────────┘
                                 │
           ┌─────────────────────┼─────────────────────┐
           │                     │                     │
           ▼                     ▼                     ▼
   ┌───────────────┐    ┌───────────────┐    ┌─────────────────┐
   │   Vercel      │    │   Railway     │    │  Cloudflare R2  │
   │  (Web, SSG)   │    │  (CMS, API)   │    │  (Media/S3)     │
   │               │    │               │    │                 │
   │  Astro 7      │    │  Next.js 15   │    │  <r2.dev>       │
   │  app/web      │◄──►│  + Payload 3  │◄──►│  images         │
   │               │    │               │    │                 │
   │  SSG/ISR      │    │  API REST     │    │  public bucket  │
   │  + React 19   │    │  /api/*       │    │  o custom CDN   │
   └───────┬───────┘    └───────┬───────┘    └─────────────────┘
           │                    │
           │                    ▼
           │            ┌───────────────┐
           │            │  PostgreSQL   │
           │            │  (Railway)    │
           │            └───────────────┘
           │
           ▼
   ┌───────────────┐
   │  CoverManager │  ← Reservas (iframe embebido)
   │  Meta Pixel   │  ← Marketing (opt-in)
   │  Metricool    │  ← Analytics (opt-in)
   └───────────────┘

                    INTERNAL DATA FLOW
   ┌────────┐     REST API      ┌────────┐    Build/SSG    ┌──────────┐
   │ Admin  │───/api/*─────────►│ Payload │───fetch()─────►│  Astro   │──► HTML
   │ Panel  │◄── Admin UI ◄────│  CMS    │◄─hook─────────│  Pages   │──► Static
   └────────┘                   └────────┘   revalidate   └──────────┘   + ISR

```

---

## 2. Justificación del stack

### Turborepo + pnpm workspaces

Se eligió monorepo porque CMS y web comparten tipos, config de ESLint, y tooling. Turborepo aporta cache distribuido y ejecución paralela. pnpm ofrece deduplicación estricta (`node_modules` planos no, symlinks sí) y fast installs con `--frozen-lockfile` en CI.

### Payload CMS 3 + Next.js 15

Payload 3 es el único headless CMS que corre sobre Next.js App Router, lo que permite:

- API REST + GraphQL auto-generada desde las colecciones.
- Admin panel extensible con React Server Components.
- Live Preview conectado al frontend Astro.
- Plugins oficiales para SEO, redirects, y S3-compatible storage (R2).
- Localización nativa (`localization: true` en cada campo).
- Migraciones SQL gestionadas con `db:push`.

No se eligió Strapi (más pesado, menos control sobre el schema) ni Sanity (dependencia de su hosting, costes de API). Payload es autohosteable en Railway con Postgres gestionado.

### Astro 7

Astro genera HTML estático (SSG) por defecto, lo que da:

- Velocidad máxima (0 JS de base en páginas sin interactividad).
- Islands Architecture: solo se hidrata React donde es necesario (reservas, formularios).
- Híbrido: rutas estáticas + ISR para contenido dinámico (eventos próximos).
- Image optimization nativa vía Sharp.
- i18n routing integrado con `prefixDefaultLocale`.
- Sitemap, MDX, Partytown y Prefetch como integraciones oficiales.

Next.js sería overkill: no necesitamos SSR completo, y Astro genera menos JS que cualquier framework alternativo.

### Tailwind CSS v4

v4 trae el motor de CSS nativo (sin PostCSS pesado), `@theme` directives, y el Vite plugin. Se integra directamente en Astro vía `@tailwindcss/vite` sin config adicional.

### PostgreSQL

Elección natural para Payload CMS. Railway lo ofrece como servicio gestionado con backups automáticos, connection pooling vía PgBouncer (opcional) y escalado vertical sencillo.

### Cloudflare R2

Almacenamiento S3-compatible sin costes de egress. Gratuito hasta 10 GB/mes. Se integra vía `@payloadcms/storage-s3`. Las imágenes se sirven desde `pub-<hash>.r2.dev` o un custom domain (`media.frontvalencia.com`).

### Vercel + Railway

- **Vercel**: Ideal para Astro. Despliegues instantáneos, edge caching, preview deployments por PR, sin gestión de servidores.
- **Railway**: Postgres gestionado + contenedor del CMS. Más barato que Heroku, más simple que AWS ECS.

---

## 3. Flujo de datos

### Publicación de contenido

```
Editor edita en Payload Admin
        │
        ▼
Payload escribe en PostgreSQL
        │
        ▼
Hook `revalidateWebhook` dispara (opcional):
  → Petición POST a web de Astro
  → Invalida páginas afectadas (ISR)
  → Astro re-genera en el siguiente build
        │
        ▼
Visitante recibe HTML estático desde Vercel CDN
```

### Build de producción

```
pnpm build (Turborepo)
  │
  ├── //#generate:types
  │     └── Payload genera payload-types.ts
  │     └── packages/types/src/index.d.ts se sincroniza
  │
  ├── apps/cms:build
  │     └── Next.js build (.next/)
  │
  └── apps/web:build
        └── Astro build (SSG + ISR)
              └── fetch() a PAYLOAD_API_URL
              └── genera HTML estático en dist/
              └── Vercel lo sirve desde edge
```

### Preview mode

```
Click "Preview" en Payload admin
        │
        ▼
Payload llama a /api/preview?secret=...&slug=...
        │
        ▼
Middleware de Astro valida secret
        │
        ▼
Cookie __preview en navegador
        │
        ▼
Páginas se renderizan con draft=true
  → fetch incluye Authorization: Bearer <preview_secret>
  → Payload responde con drafts sin publicar
```

---

## 4. Colecciones y relaciones

### Diagrama entidad-relación

```
┌──────────────┐      ┌──────────────────┐
│   Users      │      │   MenuCategory   │
│──────────────│      │──────────────────│
│ id           │      │ id               │
│ name         │      │ name (localized) │
│ roles        │      │ time (localized) │
│ email        │      │ note (localized) │
│ previewSecret│      │ order            │
└──────────────┘      └────────┬─────────┘
                               │ 1:N
                               │
                      ┌────────▼─────────┐
                      │    MenuItem       │
                      │──────────────────│
                      │ id               │
                      │ number           │
                      │ name (localized) │
                      │ desc (localized) │
                      │ price            │
                      │ note (localized) │
                      │ tags[]           │
                      │ category ────────┤─► MenuCategory
                      │ allergens[] ─────┤─► Allergens
                      └──────────────────┘
                               │ N:M
                               │
                      ┌────────▼─────────┐
                      │   Allergens       │
                      │──────────────────│
                      │ id               │
                      │ code (1-14)      │
                      │ name (localized) │
                      └──────────────────┘

┌──────────────┐
│   Space      │
│──────────────│
│ id           │
│ heading(loc) │
│ intro(loc)   │
│ desc(loc)    │
│ spaces[]     │  ← select (terraza, lounge, cocktail-bar...)
│ gallery[]    │  ← array de imágenes con relación a Media
│ cta          │  ← group (text, email)
└──────────────┘

┌──────────────┐
│   Events     │
│──────────────│
│ id           │
│ title(loc)   │
│ slug         │
│ published    │  ← checkbox
│ date         │  ← date
│ time         │
│ desc(loc)    │  ← richText
│ images[]     │  ← array de {image→Media, alt}
│ cta          │  ← group {label, url}
└──────────────┘

┌──────────────┐
│   Media      │
│──────────────│
│ id           │
│ alt (loc)    │
│ credit       │
│ sizes:       │
│  thumbnail   │  400×300
│  card        │  768×576
│  hero        │  1920×1080
│  og          │  1200×630
└──────────────┘

┌─────────────────────────────────┐
│   SiteConfig (Global, singleton) │
│─────────────────────────────────│
│ name, tagline, description       │
│ ogImage → Media                  │
│ contact: {phone, whatsapp, emails}│
│ location: {address, city, maps}  │
│ hours: {weekday, weekend}        │
│ social: {instagram, facebook}    │
│ externalLinks: {club, careers,   │
│   reservations}                  │
│ seo: JSON por locale             │
└─────────────────────────────────┘
```

### Resumen de colecciones

| Colección    | Slug              | Grupo admin  | Localizada | Acceso lectura         |
| ------------ | ----------------- | ------------ | ---------- | ---------------------- |
| Users        | `users`           | Admin        | No         | Autenticado            |
| Allergens    | `allergens`       | Carta (Menu) | Sí         | Público                |
| MenuCategory | `menu-categories` | Carta (Menu) | Sí         | Público                |
| MenuItem     | `menu-items`      | Carta (Menu) | Sí         | Público                |
| Space        | `spaces`          | Contenido    | Sí         | Público                |
| Events       | `events`          | Contenido    | Sí         | Público                |
| Media        | `media`           | Multimedia   | Sí (alt)   | Público (solo lectura) |

### Global

| Global     | Slug          | Grupo admin   | Acceso update |
| ---------- | ------------- | ------------- | ------------- |
| SiteConfig | `site-config` | Configuración | Solo admin    |

---

## 5. Diagrama de despliegue

```
                     Producción
┌──────────────────────────────────────────────────────────────────┐
│  Vercel (Edge Network)                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  static.frontvalencia.com                               │   │
│  │  • HTML generado por Astro (SSG)                        │   │
│  │  • Assets: JS, CSS, fonts (Geist)                       │   │
│  │  • Sitemap, robots.txt, Open Graph images               │   │
│  │  • CDN caching (max-age=31536000 para assets)          │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Railway (us-east-1)                                             │
│  ┌──────────────────┐    ┌─────────────────────────────────┐    │
│  │  PostgreSQL 16    │    │  CMS Container (node:22)       │    │
│  │  • Base principal │    │  • Next.js + Payload           │    │
│  │  • Backups diarios│    │  • Admin panel                 │    │
│  │  • 1 GB RAM       │    │  • API REST /api/*            │    │
│  │  • Conexiones: 15 │    │  • GraphQL /api/graphql        │    │
│  └──────────────────┘    │  • Puerto 3001                  │    │
│                           │  • Autoscaling: 1 réplica      │    │
│                           └─────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Cloudflare R2 (Global)                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  bucket: frontvalencia-prod                               │   │
│  │  • Imágenes originales + sizes (thumbnail, card, hero)   │   │
│  │  • Custom domain: media.frontvalencia.com                │   │
│  │  • Cache: Cloudflare CDN (cache-everything)             │   │
│  │  • No egress costs                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Estrategia de caché

| Recurso               | Dónde          | TTL                    | Invalidación                 |
| --------------------- | -------------- | ---------------------- | ---------------------------- |
| HTML de páginas       | Vercel CDN     | Stale-while-revalidate | Re-build en deploy           |
| Assets (JS/CSS/fonts) | Vercel CDN     | 1 año                  | Content hash en filename     |
| API Payload `/api/*`  | Railway        | No cache               | —                            |
| Imágenes (R2)         | Cloudflare CDN | 1 día                  | Purge manual o versioned URL |
| Sitemap / robots.txt  | Vercel CDN     | 1 hora                 | Re-build                     |

---

## 6. Modelo de seguridad

### Autenticación en Payload

- **Users collection** con `auth: true`. Tokens JWT con expiración de 7 días.
- Cookies: `sameSite: 'None'`, `secure: true` en producción.
- Roles: `admin` (control total), `editor` (CRUD en contenido), `viewer` (solo lectura).
- El campo `roles` solo es visible/editable por admins.

### Control de acceso por colección

| Colección    | Create       | Read    | Update         | Delete       |
| ------------ | ------------ | ------- | -------------- | ------------ |
| Users        | Solo admin   | Público | Propio o admin | Admin        |
| Allergens    | Admin/Editor | Público | Admin/Editor   | Admin        |
| MenuItem     | Admin/Editor | Público | Admin/Editor   | Admin        |
| MenuCategory | Admin/Editor | Público | Admin/Editor   | Admin        |
| Space        | Admin/Editor | Público | Admin/Editor   | Admin        |
| Events       | Admin/Editor | Público | Admin/Editor   | Admin        |
| Media        | Admin/Editor | Público | Admin/Editor   | Admin/Editor |
| SiteConfig   | — (global)   | Público | Admin          | —            |

### API keys y secrets

- `PAYLOAD_SECRET`: generada con `openssl rand -base64 32`. Usada para firmar tokens JWT.
- `PAYLOAD_PREVIEW_SECRET`: mismo valor en CMS y web. Valida peticiones de preview.
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`: credenciales de Cloudflare R2.

Todos los secrets se inyectan vía variables de entorno. Nunca en código ni en repositorio.

### CORS y CSRF

```typescript
// payload.config.ts
cors: [PUBLIC_SITE_URL, 'http://localhost:4321', 'http://localhost:3001']
csrf: [PUBLIC_SITE_URL, 'http://localhost:4321', 'http://localhost:3001']
```

### Security headers (middleware de Astro)

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy:
  default-src 'self'
  script-src 'self' tracker.metricool.com connect.facebook.net covermanager.com
  style-src 'self' 'unsafe-inline'
  img-src 'self' data: back.frontvalencia.com blob:
  frame-src 'self' covermanager.com google.com/maps
  connect-src 'self' *.r2.dev api.metricool.com
```

### Rate limiting

Payload CMS incluye rate limiting por defecto: 100 peticiones por minuto por IP.

### Preview security

El endpoint `/api/preview` valida el secret contra `PAYLOAD_PREVIEW_SECRET` antes de emitir una cookie `__preview` (httpOnly, sameSite=lax, 1h de vida).

---

## 7. Presupuesto de rendimiento (Lighthouse)

### Objetivos (forzados en CI via `.lighthouserc.json`)

| Métrica                  | Objetivo  | Severidad |
| ------------------------ | --------- | --------- |
| Performance              | ≥ 90      | error     |
| Accessibility            | ≥ 95      | error     |
| Best Practices           | ≥ 95      | error     |
| SEO                      | ≥ 95      | error     |
| Largest Contentful Paint | ≤ 2000 ms | error     |
| Total Blocking Time      | ≤ 100 ms  | error     |
| Cumulative Layout Shift  | ≤ 0.1     | error     |

### Estrategias implementadas

1. **Imágenes**: Sharp genera 4 sizes (thumbnail, card, hero, og). WebP nativo. Remote patterns configurados para R2. Lazy loading con `loading="lazy"` en imágenes no críticas.
2. **JS mínimo**: Astro islands solo hidratan componentes React necesarios. React se carga en chunk separado vía `manualChunks`.
3. **Prefetch inteligente**: `@astrojs/prefetch` precarga enlaces visibles en viewport. `defaultStrategy: 'viewport'`.
4. **Fuentes**: Geist (variable font, peso 100-900). Self-hosted vía npm `geist` package, sin round-trips externos.
5. **CSS**: Tailwind v4 purga estilos no usados en build. Un solo archivo CSS crítico inline.
6. **CDN**: Vercel Edge Network + Cloudflare R2 cache. Assets con hash en filename para cacheo perpetuo.

---

## 8. Internacionalización (i18n)

### Configuración

```typescript
// astro.config.mjs
i18n: {
  defaultLocale: 'es',
  locales: ['es', 'en'],
  routing: {
    prefixDefaultLocale: true,   // /es/, /en/
    redirectToDefaultLocale: false, // / → 302 → /es/
  },
}
```

### Estructura de rutas

```
/es/                    → Home (español)
/es/carta/              → Menú
/es/espacio/            → El espacio
/es/localizacion/       → Cómo llegar
/es/reservas/           → Reservas
/es/condiciones-reserva/→ Términos
/en/                    → Home (English)
/en/menu/               → Menu
/en/space/              → The space
...
```

### Localización en Payload

```typescript
// payload.config.ts
localization: {
  locales: [{ code: 'es', label: 'Español' }, { code: 'en', label: 'English' }],
  defaultLocale: 'es',
  fallback: true,   // si un campo no tiene traducción, cae a español
}
```

Los campos localizados se declaran con `localized: true` en la definición de la colección. Payload gestiona automáticamente el almacenamiento en columnas separadas de Postgres.

### hreflang

Astro genera etiquetas `<link rel="alternate" hreflang="es" href="...">` en cada página vía el sitemap plugin. La función `getAlternateHref` en `lib/i18n.ts` construye la URL alternativa para enlaces dinámicos.

### Estrategia de contenido

- **Contenido dinámico** (carta, eventos, espacios, config): almacenado en Payload con campos localizados. El frontend pide con `?locale=es` o `?locale=en`.
- **Contenido estático** (páginas legales, textos fijos): archivos JSON en `apps/web/src/content/` por locale.
- **Menú**: cacheado como JSON estático en `src/content/menu/` para build rápido, con opción de scrape desde Payload.

---

## 9. Plan de escalabilidad

### Base de datos (Postgres)

| Escenario           | Acción                                            |
| ------------------- | ------------------------------------------------- |
| +100 peticiones/s   | Activar PgBouncer en Railway para connection pool |
| +1 GB datos         | Índices adicionales en campos consultados         |
| +10 GB              | Escalado vertical (más RAM/CPU en Railway)        |
| Alta disponibilidad | Réplica de lectura en Railway (plan superior)     |

### CMS (Payload)

- **Horizontal scaling**: Stateless, solo depende de Postgres y R2. Múltiples réplicas detrás de un balanceador en Railway.
- **Caché API**: Añadir Varnish/Redis para cachear respuestas `/api/*` si el tráfico supera el rate limit.
- **Jobs queue**: Payload soporta jobs asíncronos para tareas pesadas (re-optimización de imágenes, re-scrape).

### Frontend (Astro / Vercel)

- **SSG**: Escala horizontalmente sin límite práctico (archivos estáticos en CDN).
- **ISR**: Para eventos próximos y cambios de carta. Vercel Edge Functions se escalan automáticamente.
- **Build time**: Si el contenido crece, segmentar builds por locale (solo rebuild del locale modificado).

### Media (R2)

- R2 no tiene límite práctico de almacenamiento ni egress. Escala transparentemente.
- Los `imageSizes` (thumbnail, card, hero, og) se generan en upload. Si se necesitan más sizes, se añaden a la colección Media y se re-procesan.

### Cache

Si el tráfico crece significativamente, se puede añadir:

- **Redis** como caché de API entre Astro y Payload (Vercel KV o Upstash).
- **CDN custom** en Cloudflare (cache de HTML completo detrás de un Worker).

---

## 10. Monitorización y analítica

### CI Checks

| Check         | Herramienta            | Cuándo se ejecuta |
| ------------- | ---------------------- | ----------------- |
| `quality`     | Astro check + Prettier | Cada push/PR      |
| `test`        | Vitest                 | Cada push/PR      |
| `build`       | Astro SSG              | Cada push/PR      |
| `smoke`       | Playwright + dist      | Cada push/PR      |
| Lighthouse    | Lighthouse CI          | Workflow aparte   |
| Accessibility | axe-core               | En smoke          |

### Producción

| Dimensión          | Herramienta                            |
| ------------------ | -------------------------------------- |
| Analytics          | Metricool (con cookie consent, opt-in) |
| Marketing tracking | Meta Pixel (opt-in, gated)             |
| Core Web Vitals    | Lighthouse CI + Vercel Analytics       |
| Errores frontend   | Console logging                        |
| Uptime             | Railway status page                    |
| Deploy health      | GitHub Actions status badges           |

### Consentimiento de cookies

El sitio implementa un banner de cookies con tres categorías:

| Categoría  | Propósito                          | Defecto         |
| ---------- | ---------------------------------- | --------------- |
| Necesarias | Funcionamiento del sitio, sesiones | Siempre activas |
| Analítica  | Metricool                          | Opt-in          |
| Marketing  | Meta Pixel                         | Opt-in          |

La lógica está en `lib/analytics.ts`. Las cookies de terceros (CoverManager, Google Maps) se cargan solo en las páginas que las necesitan (reservas, localización).
