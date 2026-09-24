# ADR 003: Estrategia de Fetch — SSG + ISR + Preview

### Propósito de este documento

- **Objetivos:** Registrar cómo Astro consume Payload (SSG, ISR, preview) sin acoplar el build de CI al CMS.
- **Estructura:** Metadatos → contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** Conserva la estrategia de producto. Un cambio de fetch exige un ADR nuevo.

| Campo               | Valor                               |
| ------------------- | ----------------------------------- |
| **Fecha**           | 2026-07-13                          |
| **Estado**          | Aceptado                            |
| **Decisores**       | Equipo de desarrollo FRONT Valencia |
| **Última revisión** | 2026-07-13                          |

---

## Contexto

El frontend de FRONT Valencia (`apps/web`, Astro 7) necesita consumir contenido gestionado en Payload CMS (`apps/cms`). El sitio debe cumplir con los siguientes requisitos:

1.  **Rendimiento** — Tiempo de carga inicial mínimo. SEO crítico (Google Core Web Vitals).
2.  **Contenido actualizado** — El menú del restaurante cambia semanalmente. Los eventos se actualizan con frecuencia.
3.  **Preview** — Los editores deben poder previsualizar cambios antes de publicar.
4.  **SEO** — Contenido indexable por crawlers sin JavaScript.
5.  **Coste** — Minimizar costes de servidor. El sitio puede ser mayoritariamente estático.
6.  **Imágenes** — Las imágenes se almacenan en Cloudflare R2 y deben servirse optimizadas.

### Arquitectura de comunicación

```
Payload CMS (apps/cms)
    │
    ├── REST API ───────────────→ Astro build time (SSG)
    ├── Webhook (POST) ─────────→ Astro revalidation endpoint (ISR on-demand)
    └── Live Preview (token) ───→ Astro preview page (pre-flight)
                                    │
                                    ↓
                            Cloudflare R2 (imágenes)
                                    │
                                    ↓
                            Navegador (CDN Vercel)
```

### Tipos de contenido y su frecuencia de actualización

| Colección                  | Frecuencia de cambio | Prioridad SEO | ¿Vista previa? |
| -------------------------- | -------------------- | ------------- | -------------- |
| Páginas (Home, About)      | Mensual              | Crítica       | Sí             |
| Menú del restaurante       | Semanal              | Alta          | Sí             |
| Eventos                    | Diaria/semanal       | Alta          | Sí             |
| Espacio (página del local) | Trimestral           | Media         | Sí             |
| Configuración global       | Rara (mensual)       | Alta          | Sí             |
| Páginas legales            | Anual                | Baja          | No             |

---

## Opciones Consideradas

### 1. SSG Total (Static Site Generation)

Generar todo el HTML en build-time. Cada despliegue reconstruye todo el sitio.

- **Ventajas**: Rendimiento máximo, CDN amigable, sin servidor, SEO perfecto.
- **Desventajas**: El contenido no se actualiza hasta el próximo build. Preview imposible sin rebuild. El build se alarga a medida que crece el sitio.

### 2. SSR (Server-Side Rendering)

Renderizar cada página en cada request contra el servidor (Node.js).

- **Ventajas**: Contenido siempre fresco, preview inmediato.
- **Desventajas**: Coste de servidor continuo, latencia adicional, no funciona sin servidor, mayor TTFB.

### 3. ISR (Incremental Static Regeneration)

Generar páginas estáticas en build-time y revalidarlas bajo demanda o por tiempo.

- **Ventajas**: Estático por defecto, fresco bajo demanda, preview con revalidación.
- **Desventajas**: Complejidad de configuración, ventana de contenido obsoleto entre publicación y revalidación.

### 4. Client-Side Fetch

El navegador obtiene el contenido directamente desde la API de Payload CMS.

- **Ventajas**: Siempre fresco, sin rebuild, preview trivial.
- **Desventajas**: SEO pobre (contenido no indexable por defecto), dependencia de JavaScript, múltiples requests, mala experiencia en conexiones lentas.

### 5. Híbrido (Astro `output: 'hybrid'`)

Combinación de SSG para páginas estáticas + ISR para páginas dinámicas + endpoints de revalidación.

- **Ventajas**: Lo mejor de cada enfoque según el tipo de contenido. Astro soporta `hybrid` de forma nativa.
- **Desventajas**: Requiere conocimiento de qué páginas son estáticas y cuáles dinámicas. Configuración de prerender por página.

---

## Decisión

**Híbrido** (Astro `output: 'hybrid'`) con la siguiente estrategia:

| Estrategia          | Páginas                                                                        |
| ------------------- | ------------------------------------------------------------------------------ |
| **SSG** (prerender) | Home, About, Contacto, Páginas legales, Listado de eventos, Páginas de espacio |
| **ISR** (on-demand) | Detalle de evento, Menú del día, Páginas que cambian frecuentemente            |
| **Server (SSR)**    | Preview de contenido                                                           |

---

## Justificación (Rationale)

### 1. SSG para contenido mayoritariamente estático

Las páginas como Home, About, Contacto, páginas legales y la página de espacio cambian con poca frecuencia. Generarlas en build-time proporciona:

- **Rendimiento óptimo**: HTML servido directamente desde CDN, sin procesamiento en el request.
- **Cero coste de servidor**: El servidor solo necesita servir archivos estáticos.
- **SEO perfecto**: Los crawlers reciben HTML completo inmediatamente.
- **Core Web Vitals**: LCP mínimo (sin esperar a SSR), CLS controlado.

En Astro, se usa `export const prerender = true` (por defecto en hybrid) para estas páginas.

```astro
---
// pages/es/index.astro — SSG (prerender por defecto)
export const prerender = true;

const data = await getPageData('home'); // fetch en build-time
---
```

### 2. ISR on-demand para contenido dinámico

El menú del restaurante y los detalles de evento cambian con frecuencia y necesitan actualizarse sin un rebuild completo del sitio.

**Mecanismo**:

1. El editor publica cambios en Payload CMS.
2. Payload dispara un webhook HTTP POST a un endpoint de Astro.
3. El endpoint valida el secreto compartido (`PAYLOAD_PREVIEW_SECRET`).
4. El endpoint identifica qué páginas deben revalidarse (basado en la colección modificada).
5. Astro revalida esas páginas usando `Astro.locals.revalidate()` o el mecanismo de ISR on-demand.

En Astro, las rutas ISR se marcan explícitamente:

```astro
---
// pages/es/menu/[slug].astro — ISR on-demand
export const prerender = false; // No prerender por defecto, usa ISR
// Astro 7 híbrido: las rutas no prerenderizadas usan ISR automáticamente

export async function getStaticPaths() {
  const items = await getMenuItems();
  return items.map(item => ({
    params: { slug: item.slug },
    props: { item },
  }));
}
---
```

### 3. Endpoint de revalidación vía webhook

Se expone un endpoint en Astro que Payload CMS llama después de cambios en las colecciones.

```
POST /api/revalidate
```

**Payload del webhook** (enviado por Payload):

```json
{
  "event": "publish",
  "collection": "menu|events|pages|site-config",
  "doc": {
    "id": "abc123",
    "slug": "paella-valenciana",
    "locale": "es"
  }
}
```

**Validación**:

- El endpoint recibe un token secreto en el header `x-payload-secret`.
- Se compara con `import.meta.env.PAYLOAD_PREVIEW_SECRET`.
- Si no coincide, se devuelve `401 Unauthorized`.

**Estrategia de revalidación por colección**:

| Colección modificada | Páginas a revalidar                                          |
| -------------------- | ------------------------------------------------------------ |
| `menu`               | `/es/carta/`, `/en/menu/`, y cada página de detalle de plato |
| `events`             | Página de listado de eventos + detalle del evento específico |
| `pages`              | La página específica (home, about, etc.)                     |
| `site-config`        | Todas las páginas (config global)                            |
| `space`              | `/es/espacio/`, `/en/space/`                                 |

### 4. Live Preview desde Payload CMS

Payload CMS permite configurar un `preview` URL para cada colección. El editor puede hacer clic en "Preview" desde el panel de administración y ver los cambios en el frontend antes de publicar.

**Flujo**:

1. El editor está editando un documento en Payload.
2. Payload abre una nueva ventana con la URL de preview configurada.
3. La URL incluye un token de preview: `https://frontvalencia.com/api/preview?secret=...&collection=menu&id=abc123&locale=es`.
4. Astro valida el token, deshabilita la caché, y renderiza la página con datos en tiempo real (fetch directo a Payload API).
5. Cuando el editor cierra la preview, la página vuelve a servirse desde la caché estática.

**Implementación**:

```typescript
// apps/web/src/lib/preview.ts
export function validatePreviewToken(token: string): boolean {
  return token === import.meta.env.PAYLOAD_PREVIEW_SECRET
}

export function buildPreviewUrl(collection: string, id: string, locale: string): string {
  const secret = import.meta.env.PAYLOAD_PREVIEW_SECRET
  const base = import.meta.env.PUBLIC_SITE_URL
  return `${base}/api/preview?secret=${secret}&collection=${collection}&id=${id}&locale=${locale}`
}
```

### 5. Estrategia de imágenes

Las imágenes se gestionan a través de Payload CMS y se almacenan en **Cloudflare R2** (S3-compatible) mediante el plugin `@payloadcms/plugin-cloud-storage`.

**Build-time**:

- Durante el build de Astro, las imágenes referenciadas en páginas SSG se optimizan con **Sharp** (integración nativa de Astro).
- Las imágenes optimizadas se sirven desde el CDN de Vercel.

**Runtime (ISR)**:

- Las imágenes en páginas ISR se sirven directamente desde Cloudflare R2 a través de la URL pública (`https://media.frontvalencia.com/...`).
- Cloudflare R2 proporciona CDN global con caché automática.
- No hay necesidad de un servicio de transformación de imágenes en runtime; las imágenes se suben en las resoluciones adecuadas desde el CMS.

**Configuración de orígenes remotos** (astro.config.mjs):

```javascript
image: {
  remotePatterns: [
    { protocol: 'https', hostname: '*.r2.dev' },
    { protocol: 'https', hostname: 'media.frontvalencia.com' },
    { protocol: 'http', hostname: 'localhost', port: '3001' },
  ],
},
```

### 6. Estrategia de cache

| Capa                  | Qué cachea              | TTL / Estrategia                                                                     |
| --------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| **Astro (SSG)**       | HTML completo           | Inmutable (hasta próximo build)                                                      |
| **Vercel Edge Cache** | HTML + assets           | `s-maxage=31536000, stale-while-revalidate`                                          |
| **Cloudflare R2 CDN** | Imágenes                | 30 días, purge manual si necesario                                                   |
| **Navegador**         | HTML, CSS, JS, imágenes | `max-age=0, must-revalidate` (HTML), `max-age=31536000, immutable` (assets con hash) |
| **Payload CMS**       | API responses           | No cache (siempre fresco para el panel)                                              |

### 7. Fetch en build-time vs runtime

**Capa de abstracción** (`apps/web/src/lib/payload.ts`):

```typescript
const API_URL = import.meta.env.PAYLOAD_API_URL || 'http://localhost:3001/api'

export async function fetchFromPayload<T>(
  endpoint: string,
  options?: { draft?: boolean; locale?: string; depth?: number },
): Promise<T> {
  const url = new URL(`${API_URL}/${endpoint}`)
  if (options?.locale) url.searchParams.set('locale', options.locale)
  if (options?.depth) url.searchParams.set('depth', String(options.depth))
  if (options?.draft) url.searchParams.set('draft', 'true')

  const response = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Payload fetch failed: ${response.statusText}`)
  }

  return response.json()
}
```

**Build-time** (SSG):

```typescript
const menuItems = await fetchFromPayload<MenuItem[]>('menu', {
  locale: 'es',
  depth: 2,
})
```

**Runtime** (ISR / preview):

```typescript
const pageData = await fetchFromPayload<Page>('pages', {
  locale: 'es',
  draft: isPreview, // preview mode → datos sin publicar
})
```

### 8. Variables de entorno relevantes

| Variable                 | Propósito                                                        |
| ------------------------ | ---------------------------------------------------------------- |
| `PAYLOAD_API_URL`        | URL base de la API REST de Payload CMS                           |
| `PAYLOAD_PREVIEW_SECRET` | Secreto compartido para validar webhooks y preview               |
| `PUBLIC_SITE_URL`        | URL pública del frontend (para construir URLs de preview)        |
| `R2_PUBLIC_URL`          | URL pública de Cloudflare R2 (`https://media.frontvalencia.com`) |
| `R2_ENDPOINT`            | Endpoint S3 de R2                                                |
| `R2_BUCKET`              | Nombre del bucket R2                                             |
| `R2_ACCESS_KEY_ID`       | Access key para R2                                               |
| `R2_SECRET_ACCESS_KEY`   | Secret key para R2                                               |

---

## Consecuencias

### Positivas

- ✅ **Rendimiento óptimo**: Páginas estáticas servidas desde CDN. Sin latencia de servidor.
- ✅ **SEO completo**: Google indexa HTML completo en todos los casos.
- ✅ **Contenido fresco**: ISR on-demand actualiza páginas minutos después de publicar en CMS.
- ✅ **Preview funcional**: Los editores ven cambios en tiempo real antes de publicar.
- ✅ **Coste reducido**: Sin servidor siempre encendido. Solo se paga por builds (Vercel) y BD (Railway).
- ✅ **Imágenes eficientes**: R2 CDN + Sharp optimizan el delivery sin servicios adicionales.

### Negativas / Riesgos

- ⚠️ **Ventana de contenido obsoleto** — Entre que el editor publica y el webhook revalida la página, los visitantes ven la versión anterior. Ventana típica: 1–5 segundos. Para el menú del día, esto puede ser problemático si se actualiza justo antes del servicio.
- ⚠️ **Webhook como punto único de fallo** — Si el endpoint de revalidación no está disponible (error de red, timeout, error del servidor), el contenido no se actualiza hasta el próximo build. Considerar reintentos con backoff exponencial desde Payload.
- ⚠️ **Complejidad de configuración** — No todas las páginas son iguales. Mantener el mapa de colección→páginas a revalidar requiere disciplina. Si se añade una nueva colección o página, hay que actualizar el webhook handler.
- ⚠️ **Builds largos** — A medida que crece el contenido, el build SSG puede alargarse. Mitigar con: caché de Turbo, parallelismo, y prerender solo lo necesario.
- ⚠️ **Dependencia de Payload disponible en build-time** — Si el CMS no está disponible durante el build (por ejemplo, en desarrollo local sin CMS corriendo), el build falla. Mitigar con: datos de fallback locales (`apps/web/src/content/`).

### Mitigaciones

1.  **Datos de fallback locales** — El directorio `apps/web/src/content/` contiene JSON estáticos con el contenido esencial (menú, rutas). Si Payload no está disponible en build-time, Astro usa estos datos como fallback.
2.  **Retry en webhooks** — Configurar Payload con reintentos (3 intentos, backoff exponencial) en los webhooks de revalidación.
3.  **Revalidación periódica (TTL-based)** — Además de la revalidación on-demand, las páginas ISR pueden tener un `revalidate` time (por ejemplo, 60 segundos) para garantizar que eventualmente se actualicen incluso si el webhook falla.
4.  **Logs y monitorización** — El endpoint de revalidación debe loguear todos los eventos (éxito/fallo) para depuración. Usar `console.log` estructurado o un servicio de logging.
5.  **Purge manual** — Un script (`tools/scripts/revalidate-all.ts`) que fuerza la revalidación de todas las páginas. Útil para despliegues de emergencia.

---

## Referencias

- [Astro Documentation: On-demand Rendering](https://docs.astro.build/en/guides/on-demand-rendering/)
- [Astro Documentation: Hybrid Output](https://docs.astro.build/en/basics/rendering-modes/#hybrid-rendering)
- [Payload CMS Webhooks](https://payloadcms.com/docs/authentication/webhooks)
- [Payload CMS Live Preview](https://payloadcms.com/docs/live-preview)
- [ADR-001: CMS Selection](./001-cms-selection.md)
- [ADR-002: Monorepo Structure](./002-monorepo-structure.md)
- `apps/web/astro.config.mjs` (config `output: 'hybrid'`)
- `apps/cms/src/hooks/revalidateWebhook.ts`
- `apps/web/src/lib/payload.ts`
