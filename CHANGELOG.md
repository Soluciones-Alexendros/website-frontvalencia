# Changelog

Todos los cambios notables de **FRONT Valencia** se documentan aquí.

> Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/),
> y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Cambiado

- Alineación al canon de plataforma P1+P2: CI `quality` / `test` / `build` / `smoke`, Renovate (`npm` + `github-actions`), docs en `docs/architecture/decisions/`, meta-sección «Propósito de este documento».

## [1.0.0] — 2025-07-13

### Añadido

#### Web (`apps/web` — Astro 7 + React 19)

- **Páginas principales** con i18n (es/en) y `prefixDefaultLocale: true`:
  - Página de inicio (`/es/`, `/en/`)
  - Carta / Menu (`/es/carta/`, `/en/menu/`)
  - El Espacio / The Space (`/es/espacio/`, `/en/space/`)
  - Localización / Location (`/es/localizacion/`, `/en/location/`)
  - Reservas / Book (`/es/reservas/`, `/en/book/`)
  - Páginas legales: aviso legal, privacidad, cookies, condiciones de reserva
  - Página 404 personalizada por locale
- **SSG con output híbrido**: prerenderizado estático con rutas dinámicas donde sea necesario
- **i18n**: sistema de rutas con `Astro.i18n`, locale `es` como default, detección y redirección
- **SEO**: metadatos por página, sitemap con `@astrojs/sitemap` e i18n, `robots.txt`
- **Rendimiento**: `@astrojs/prefetch` con estrategia `viewport`, `clientPrerender` experimental, chunking manual de `react`/`react-dom`
- **Estilos**: Tailwind CSS 4 via `@tailwindcss/vite`, Geist como tipografía principal
- **Imágenes**: `sharp` para transformación, patrones remotos para R2 y CMS local
- **Componentes React**: integración con `@astrojs/react`, componentes interactivos en islas Astro
- **Content Collections**: schemas tipados para menú y configuración del sitio con `astro:content`
- **Middleware**: protección de rutas admin, redirects, locale detection

#### CMS (`apps/cms` — Payload CMS 3 + Next.js 15)

- **Payload 3.27** sobre Next.js 15 con App Router
- **Colecciones**:
  - `menu-items`: platos con número, nombre localizado, descripción, precio, alérgenos, tags (ecológico, sin gluten, vegano, picante), categoría y nota
  - `menu-categories`: categorías de carta con nombre localizado, horario, nota y orden de aparición
  - `allergens`: catálogo de alérgenos (código 1–14, nombre localizado)
  - `events`: eventos con título, slug, fecha, hora, descripción rich text, imágenes y CTA
  - `spaces`: espacios del restaurante con heading, intro, descripción, select de espacios, galería masonry y CTA para eventos privados
  - `media`: gestión de imágenes con upload a R2
  - `users`: autenticación y roles (admin, editor)
- **Globales**: `site-config` con nombre, tagline, descripción, contacto, localización, horarios, redes sociales, enlaces externos y SEO metadata
- **Plugins**: `@payloadcms/plugin-seo`, `@payloadcms/plugin-redirects`, `@payloadcms/storage-s3` (R2)
- **Rich Text**: editor Lexical con `@payloadcms/richtext-lexical`
- **Base de datos**: PostgreSQL con `@payloadcms/db-postgres`
- **GraphQL API**: expuesta por Payload para consultas flexibles
- **Acceso**: control granular por colección con roles `admin` y `editor`

#### Monorepo y Tooling

- **Turborepo** con pipeline optimizado: cache, dependencias entre tareas, outputs declarados
- **pnpm workspaces** con `pnpm@8.15.0`, 4 importers: `apps/cms`, `apps/web`, `packages/types`, `tools`
- **Tipos compartidos**: `@frontvalencia/types` y `@frontvalencia/tsconfig` packages
- **ESLint**: `@frontvalencia/eslint-config` package para linting consistente
- **Changesets**: `@changesets/cli` para versionado semántico
- **TypeScript 5.8** strict mode en toda la codebase

#### CI/CD

- **GitHub Actions**:
  - `ci.yml`: lint, typecheck, tests unitarios y de integración en cada PR
  - `deploy-preview.yml`: despliegue de previews por PR (Vercel + Railway)
  - `deploy-prod.yml`: despliegue de producción desde `main`
- **Dependabot**: `dependabot.yml` para actualizaciones automáticas de dependencias

#### Infraestructura

- **Docker Compose**: desarrollo local con Postgres, Payload y Astro coordinados
  - `docker:dev`: `docker compose up --build`
  - `docker:prod`: perfil de producción con Compose + override
  - `docker:reset`: reconstrucción completa desde cero
- **Postgres**: base de datos local configurada via `DATABASE_URI`
- **Cloudflare R2**: almacenamiento de imágenes (free tier, 10 GB, sin egress)
- **CoverManager**: integración de reservas externas con URLs por locale

#### Tests

- **Unitarios**: Vitest 4 con configuración por workspace
- **E2E**: Playwright 1.61 con config dedicada y test-results
- **Lighthouse CI**: `.lighthouserc.json` para auditorías de rendimiento

#### Scripts

- `scrape-content.ts`: scraping de contenido legacy
- `validate-env.ts`: validación de variables de entorno en CI
- `content:seed`: seed de base de datos

---

## [0.1.0] — 2025-06-01

### Añadido

- Setup inicial del monorepo con Turborepo y pnpm workspaces
- Configuración base de TypeScript, ESLint y toolchain
- Scaffolding de `apps/cms` con Payload CMS y `apps/web` con Astro
- Estructura de `packages/types` para tipos compartidos
- Docker Compose para Postgres y servicios de desarrollo
- Primera versión de CI pipeline básico

---

[1.0.0]: https://github.com/anomalyco/frontvalencia/releases/tag/v1.0.0
[0.1.0]: https://github.com/anomalyco/frontvalencia/releases/tag/v0.1.0
