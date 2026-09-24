# ADR 001: Selección de CMS — Payload CMS

### Propósito de este documento

- **Objetivos:** Registrar por qué el CMS canónico es Payload (self-hosted, Postgres, i18n) y no Strapi/Sanity.
- **Estructura:** Metadatos → contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** Conserva la decisión de producto. No copies un CMS de otro repo. Un cambio de CMS exige un ADR nuevo que superseda este.

| Campo               | Valor                               |
| ------------------- | ----------------------------------- |
| **Fecha**           | 2026-07-13                          |
| **Estado**          | Aceptado                            |
| **Decisores**       | Equipo de desarrollo FRONT Valencia |
| **Última revisión** | 2026-07-13                          |

---

## Contexto

FRONT Valencia necesita un CMS headless para gestionar el contenido del sitio web del restaurante. Los requerimientos funcionales incluyen:

1.  Gestión de menú del restaurante (platos, categorías, alérgenos, precios, descripciones bilingües)
2.  Gestión de eventos (calendario, descripción, imágenes, RSVP)
3.  Gestión de espacios (descripción del local, galería de imágenes, servicios)
4.  Configuración global del sitio (metadatos SEO, redes sociales, analytics)
5.  Internacionalización (español e inglés) con contenido paralelo
6.  Live preview de contenido antes de publicar
7.  Webhooks para revalidación del frontend (ISR)
8.  Almacenamiento de imágenes en Cloudflare R2
9.  Editor enriquecido (Rich Text) para páginas legales, descripciones largas
10. Roles de usuario (admin, editor) con control de acceso granular

### Restricciones

- Debe ser **self-hosted** (datos del restaurante bajo nuestro control)
- Debe usar **PostgreSQL** (consistencia transaccional, ya es la BD del proyecto)
- El stack principal es **TypeScript** — el CMS debe ser TypeScript nativo
- **Open-source** o con licencia que no imponga costes recurrentes elevados
- API moderna (REST y/o GraphQL) para consumo desde Astro

---

## Opciones Consideradas

### 1. Payload CMS 3.x

- **Licencia**: MIT (open-source)
- **Stack**: TypeScript, Next.js, React
- **Base de datos**: PostgreSQL, MongoDB
- **APIs**: REST nativa, GraphQL opcional
- **Self-hosted**: Sí
- **i18n**: Integrada (localized fields)
- **Almacenamiento**: Plugin S3 (R2 compatible)
- **Editor**: Lexical (Rich Text) con bloques personalizados
- **Admin UI**: Panel React generado automáticamente
- **Live Preview**: Sí (vía preview URL + secret)

### 2. Strapi 5

- **Licencia**: MIT (core) + Enterprise features con licencia comercial
- **Stack**: Node.js, Koa, React
- **Base de datos**: PostgreSQL, SQLite, MySQL
- **APIs**: REST + GraphQL
- **Self-hosted**: Sí
- **i18n**: Internacionalización vía plugin (madura en v5)
- **Almacenamiento**: Proveedores vía plugins (S3, Cloudinary, etc.)
- **Editor**: WYSIWYG (Markdown / Rich Text)
- **Admin UI**: Panel React personalizable
- **Live Preview**: Sí

### 3. Directus 11

- **Licencia**: MIT (core) + Enterprise features con licencia comercial
- **Stack**: Node.js, Vue.js
- **Base de datos**: SQL (PostgreSQL, MySQL, SQLite, etc.)
- **APIs**: REST + GraphQL
- **Self-hosted**: Sí
- **i18n**: Soporte multi-idioma
- **Almacenamiento**: Drivers (S3, GCS, local, etc.)
- **Editor**: WYSIWYG vía extensiones
- **Admin UI**: Panel Vue.js altamente configurable
- **Live Preview**: Sí

### 4. Decap CMS (ex Netlify CMS)

- **Licencia**: MIT
- **Stack**: React, sin servidor (Git-based)
- **Base de datos**: Archivos Git (Markdown/JSON en repo)
- **APIs**: Git Gateway / GitHub API
- **Self-hosted**: Sí (pero limitado a Git)
- **i18n**: Soporte básico (carpetas por idioma)
- **Almacenamiento**: Git LFS / servicios externos
- **Editor**: Markdown / Rich Text
- **Admin UI**: Panel React SPA
- **Live Preview**: No nativo

### 5. Keystatic

- **Licencia**: MIT
- **Stack**: TypeScript, Astro/Next.js (framework-agnostic), React
- **Base de datos**: Archivos (Markdown/YAML/JSON en repo)
- **APIs**: Local (file-system), sin API remota
- **Self-hosted**: Sí
- **i18n**: Soporte básico
- **Almacenamiento**: Git LFS
- **Editor**: Markdown / React blocks
- **Admin UI**: Panel React embebido
- **Live Preview**: No nativo (solo local)

### 6. Sanity

- **Licencia**: Apache 2.0 (core) + SaaS (hosted)
- **Stack**: JavaScript, React
- **Base de datos**: Propietaria (Sanity Studio hosted)
- **APIs**: REST + GraphQL + GROQ
- **Self-hosted**: No (solo SaaS)
- **i18n**: Soporte nativo (fields internacionalizados)
- **Almacenamiento**: Sanity Images CDN
- **Editor**: Portable Text (Rich Text)
- **Admin UI**: Sanity Studio (React, altamente personalizable)
- **Live Preview**: Sí

---

## Comparativa

| Feature             | Payload CMS 3     | Strapi 5        | Directus 11     | Decap CMS    | Keystatic    | Sanity               |
| ------------------- | ----------------- | --------------- | --------------- | ------------ | ------------ | -------------------- |
| **Self-hosted**     | ✅ Sí             | ✅ Sí           | ✅ Sí           | ✅ Sí        | ✅ Sí        | ❌ SaaS              |
| **PostgreSQL**      | ✅ Nativo         | ✅ Nativo       | ✅ Nativo       | ❌ Git-based | ❌ Git-based | ❌ Propietaria       |
| **TypeScript**      | ✅ Full           | ⚠️ Parcial      | ⚠️ Parcial      | ❌           | ✅ Full      | ⚠️ Parcial           |
| **i18n**            | ✅ Excelente      | ✅ Buena        | ✅ Buena        | ⚠️ Básica    | ⚠️ Básica    | ✅ Excelente         |
| **REST API**        | ✅ Nativa         | ✅ Nativa       | ✅ Nativa       | ✅ (Git)     | ❌           | ✅ Nativa            |
| **GraphQL**         | ✅ Plugin         | ✅ Plugin       | ✅ Nativo       | ❌           | ❌           | ✅ Nativo            |
| **Lexical Editor**  | ✅ Sí             | ❌              | ❌              | ❌           | ❌           | ✅ (Portable Text)   |
| **S3 / R2 Storage** | ✅ Plugin oficial | ✅ Plugins      | ✅ Drivers      | ❌           | ❌           | ✅ (Sanity Images)   |
| **Live Preview**    | ✅ Sí             | ✅ Sí           | ✅ Sí           | ❌           | ❌           | ✅ Sí                |
| **Webhooks**        | ✅ Sí             | ✅ Sí           | ✅ Sí           | ✅ (Git)     | ❌           | ✅ Sí                |
| **Open-source**     | ✅ MIT            | ✅ MIT          | ✅ MIT          | ✅ MIT       | ✅ MIT       | ❌ Apache 2.0 + SaaS |
| **Coste**           | Gratuito          | Gratuito (core) | Gratuito (core) | Gratuito     | Gratuito     | Pago (por proyecto)  |
| **Comunidad**       | Media-alta        | Alta            | Alta            | Alta         | Emergente    | Muy alta             |
| **Madurez v3**      | Estable           | Estable         | Estable         | Madura       | Emergente    | Madura               |

---

## Decisión

**Payload CMS 3.x** es el CMS seleccionado.

---

## Justificación (Rationale)

1.  **TypeScript nativo** — El CMS comparte tipos con el frontend a través del paquete `@frontvalencia/types`. Payload genera `payload-types.ts` automáticamente desde la configuración de colecciones, eliminando la duplicación manual de tipos.

2.  **Integración con el ecosistema** — Astro + React + Tailwind + PostgreSQL. Payload se integra de forma natural: se despliega como una app Next.js dentro del monorepo (`apps/cms`), comparte config de TypeScript y ESLint, y se comunica con el frontend vía REST API sin fricción.

3.  **Localización excelente** — El sistema de localized fields de Payload permite tener traducciones en el mismo documento, con soporte para campos condicionales por idioma. Cada plato del menú tiene nombre_es, nombre_en, descripción_es, descripción_en como campos localizados dentro del mismo documento.

4.  **Lexical Editor** — El editor Rich Text basado en Lexical (Meta) es moderno, extensible con bloques personalizados, y genera JSON estructurado fácil de renderizar en Astro.

5.  **S3 Storage Plugin** — El plugin oficial de S3 se conecta directamente con Cloudflare R2 usando la misma API S3-compatible. Las imágenes se almacenan en R2 y se sirven desde `media.frontvalencia.com` sin necesidad de middleware adicional.

6.  **Live Preview** — Payload soporta preview URLs con token secreto. El editor puede previsualizar cambios en el frontend antes de publicar, usando un secret compartido (`PAYLOAD_PREVIEW_SECRET`) que Astro valida para revalidar páginas específicas bajo demanda.

7.  **Licencia MIT** — Sin restricciones comerciales, sin costes recurrentes, sin "Enterprise features" bloqueadas. El código es 100% nuestro.

8.  **Webhooks nativos** — Payload dispara webhooks después de operaciones CRUD en cualquier colección, que se usan para activar la revalidación ISR del frontend Astro.

9.  **Rendimiento de desarrollo** — La generación automática de la Admin UI desde la configuración de colecciones acelera el desarrollo. No hay que construir paneles de administración manualmente.

---

## Consecuencias

### Positivas

- ✅ Tipos compartidos entre CMS y frontend (TypeScript integral).
- ✅ Panel de administración rico sin esfuerzo adicional.
- ✅ Flexibilidad total al ser self-hosted sobre PostgreSQL.
- ✅ Integración directa con Astro vía REST API + webhooks.
- ✅ Sin vendor lock-in: los datos residen en PostgreSQL, exportables en cualquier momento.

### Negativas / Riesgos

- ⚠️ **Experiencia Node.js necesaria** — El equipo debe mantener una app Next.js para el CMS, incluyendo despliegue, migraciones y rendimiento.
- ⚠️ **PostgreSQL gestionado** — Se necesita una base de datos PostgreSQL gestionada (Railway, Neon, Supabase) con backups automáticos. Coste operativo adicional.
- ⚠️ **Migración futura** — Si se decide cambiar de CMS en el futuro, los datos en PostgreSQL son portables, pero la lógica de negocio (hooks, acceso, validaciones) está acoplada a Payload. Migrar requeriría reescribir las colecciones y adaptar las queries del frontend.
- ⚠️ **Comunidad más pequeña que Strapi** — Payload tiene una comunidad activa pero más reducida que Strapi o Directus. La documentación es buena, pero hay menos tutoriales y ejemplos de terceros.
- ⚠️ **Payload v3 es reciente** — Aunque estable, la versión 3.x todavía está en evolución activa. Pueden surgir breaking changes en releases menores.

### Mitigaciones

1.  Separar la lógica de acceso a datos en el frontend (`apps/web/src/lib/payload.ts`) para que un cambio de CMS solo requiera modificar esa capa de abstracción.
2.  Usar migraciones de Payload con `db:push` para mantener el esquema de base de datos versionado.
3.  Congelar la versión de Payload en `package.json` hasta que el equipo evalúe cambios mayores.

---

## Referencias

- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Payload S3 Plugin](https://payloadcms.com/docs/plugins/cloud-storage)
- [Payload Localization](https://payloadcms.com/docs/configuration/localization)
- [Payload Webhooks](https://payloadcms.com/docs/authentication/webhooks)
- [ADR-002: Monorepo Structure](./002-monorepo-structure.md)
- [ADR-003: SSG + ISR + Preview Fetch Strategy](./003-fetch-strategy.md)
