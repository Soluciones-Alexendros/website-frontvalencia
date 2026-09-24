# Guía de Contribución — FRONT Valencia

### Propósito de este documento

- **Objetivos:** Explicar cómo clonar, desarrollar, testear y abrir un PR sin romper el producto ni los contratos de CI.
- **Estructura:** Conducta → arranque → flujo → estilo → testing → PRs → ADRs → convenciones de CMS/web.
- **Contenido a integrar según contexto:** Adapta scripts pnpm y rutas de este monorepo. No copies la guía de una CLI. Los ADRs canónicos están en `docs/architecture/decisions/`. Conserva el producto local.

> **Idioma**: El código, nombres de variables, commits y comentarios técnicos se escriben en **inglés**.  
> La documentación, issues y PRs pueden estar en **español** o **inglés**.

## Índice

- [Código de Conducta](#código-de-conducta)
- [Primeros pasos](#primeros-pasos)
- [Flujo de trabajo](#flujo-de-trabajo)
- [Guía de estilo](#guía-de-estilo)
- [Testing](#testing)
- [Pull Requests](#pull-requests)
- [Checklist de revisión](#checklist-de-revisión)
- [Architecture Decision Records (ADRs)](#architecture-decision-records-adrs)
- [Añadir una colección al CMS](#añadir-una-colección-al-cms)
- [Añadir una página a la web](#añadir-una-página-a-la-web)
- [Formato de commits](#formato-de-commits)

---

## Código de Conducta

Este proyecto sigue el [Contributor Covenant v2.1](./CODE_OF_CONDUCT.md).  
Al participar, aceptas mantener un entorno respetuoso y libre de acoso.

---

## Primeros pasos

### 1. Clonar el repositorio

```bash
git clone https://github.com/Iniciativas-Alexendros/website-frontvalencia.git
cd website-frontvalencia
```

### 2. Instalar dependencias

```bash
# Asegúrate de tener Node >=22.12 y pnpm >=8.15
pnpm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
cp apps/cms/.env.example apps/cms/.env
```

Edita los valores en `.env` (usa `openssl rand -base64 32` para generar los secrets).

### 4. Arrancar base de datos (Postgres)

```bash
# Usando Docker Compose (recomendado)
pnpm docker:dev
```

O si prefieres Postgres local, asegúrate de que `DATABASE_URI` apunte a tu instancia.

### 5. Ejecutar migraciones

```bash
pnpm db:push
```

### 6. Iniciar en desarrollo

```bash
# Arranca CMS (Puerto 3001) y Web (Puerto 4321) en paralelo
pnpm dev
```

- CMS Admin: [http://localhost:3001/admin](http://localhost:3001/admin)
- Web: [http://localhost:4321/es](http://localhost:4321/es)

---

## Flujo de trabajo

### Ramas

| Rama         | Propósito                            |
| ------------ | ------------------------------------ |
| `main`       | Producción, protegida                |
| `develop`    | Integración                          |
| `feat/*`     | Nuevas funcionalidades               |
| `fix/*`      | Corrección de bugs                   |
| `chore/*`    | Mantenimiento, tooling, CI           |
| `docs/*`     | Documentación                        |
| `refactor/*` | Refactorización sin cambio funcional |
| `test/*`     | Tests                                |

Las ramas de feature parten de `develop`.  
Los merges a `main` se hacen vía Pull Request con revisión.

### Conventional Commits

Todos los commits deben seguir [Conventional Commits](https://www.conventionalcommits.org/).  
Ver [Formato de commits](#formato-de-commits) para ejemplos.

---

## Guía de estilo

### TypeScript

- **strict mode** activo en todos los `tsconfig.json`
- `ES2022` target
- `moduleResolution: Bundler`
- Preferir `type` imports: `import type { CollectionConfig } from 'payload'`
- Nombres de tipos en `PascalCase`, funciones en `camelCase`
- Archivos de tipos compartidos en `packages/types/src/`

### ESLint y Prettier

```bash
# Lint de todo el proyecto
pnpm lint

# Typecheck
pnpm typecheck
```

Las reglas de ESLint se definen en `packages/eslint-config`.  
Se ejecuta lint automático en CI para cada PR.

### Convenciones generales

- No añadir comentarios al código salvo que sean estrictamente necesarios (la AGENTS.md lo desaconseja)
- Variables y funciones autodescriptivas antes que comentarios
- Componentes React en PascalCase, páginas Astro en kebab-case
- Rutas de Astro reflejan la URL: `src/pages/es/carta.astro` → `/es/carta/`
- Las colecciones de Payload usan `slug` en kebab-case (ej. `menu-items`)
- Los labels en colecciones Payload son bilingües: `{ es: 'Plato', en: 'Dish' }`
- CSS: Tailwind v4 utility classes (no CSS modules a menos que sea inevitable)

---

## Testing

### Tests unitarios (Vitest)

- Ubicación: `tests/unit/**/*.test.ts` y `tests/components/**/*.test.tsx`
- Ejecutar: `pnpm test:unit`
- **Obligatorios** para: utilidades, hooks, validadores, helpers
- Entorno: `node` por defecto, `jsdom` para componentes (`environmentMatchGlobs`)

```bash
pnpm test:unit          # todos los unitarios
pnpm test               # todos los tests (unit + e2e)
```

### Tests e2e (Playwright)

- Ubicación: `tests/e2e/**/*.spec.ts`
- Ejecutar: `pnpm test:e2e`
- **Obligatorios** para: flujos críticos (reserva, navegación carta, contacto)
- Navegador: Chromium (configurado en `playwright.config.ts`)
- CI: retry 2, workers=1, headless

```bash
pnpm test:e2e           # tests e2e completos
pnpm exec playwright test --ui   # modo interactivo
```

### Cobertura

- Unitarios: `coverage/unit/`
- Totales: `coverage/`
- Objetivo de flota: **≥ 70 %**. Este repo aún no endurece el umbral en CI; añade tests antes de subirlo.

CI principal: jobs `quality`, `test`, `build`, `smoke` (Playwright chromium sobre `apps/web/dist`).

---

## Pull Requests

### Proceso

1. Crea una rama desde `main` siguiendo la convención de nombres
2. Desarrolla con commits atómicos siguiendo Conventional Commits
3. Asegura que `pnpm --filter frontvalencia-web run lint`, `test:unit` y `build` pasan
4. Sube la rama: `git push origin feat/mi-feature`
5. Abre un Pull Request contra `main`
6. Completa la plantilla de PR (se genera automáticamente)
7. Solicita al menos una review
8. Tras aprobación, haz squash-merge

### Reglas

- No mergear sin CI verde
- No mergear sin al menos una review aprobada
- Las ramas `feat/*`, `fix/*`, etc. se borran tras merge
- Los cambios de tipo `chore` o `docs` pueden saltarse la review si son triviales

---

## Checklist de revisión

- [ ] ¿Sigue el código el estilo del proyecto (ESLint, TypeScript strict)?
- [ ] ¿Hay tests para el nuevo código? (unit si es utilidad, e2e si es página/flujo)
- [ ] ¿Los tests pasan en CI?
- [ ] ¿Se han actualizado los tipos compartidos en `packages/types` si aplica?
- [ ] ¿Se siguen las convenciones de Payload (slugs, labels bilingües, access control)?
- [ ] ¿No hay secrets hardcodeados ni expuestos?
- [ ] ¿Las imágenes tienen atributo `alt` descriptivo?
- [ ] ¿La nueva página es accesible? (navegación por teclado, contraste, heading jerarquía)
- [ ] ¿Se ha actualizado o añadido un ADR si la decisión es arquitectónica?
- [ ] ¿El rendimiento es aceptable? (sin exceso de JS, imágenes optimizadas)

---

## Architecture Decision Records (ADRs)

Las decisiones arquitectónicas significativas se documentan en `docs/architecture/decisions/`.

### Convención

- Formato: `docs/architecture/decisions/NNNN-titulo-breve.md`
- Plantilla ([ADR-0000](docs/architecture/decisions/0000-template.md)):
  - **Title**, **Status**, **Date**
  - **Context**: problema o motivación
  - **Decision**: qué se decidió
  - **Consequences**: impacto positivo y negativo
  - **Compliance**: cómo se verifica que se cumple

### Estados de ADR

| Estado     | Significado              |
| ---------- | ------------------------ |
| Proposed   | En discusión             |
| Accepted   | Aceptada e implementada  |
| Deprecated | Reemplazada por otra ADR |
| Superseded | Sustituida por NNNN      |

### Cuándo escribir un ADR

- Cambio de framework o herramienta principal
- Elección entre arquitecturas (SSG vs SSR, base de datos, storage)
- Cambios en el modelo de datos que afectan a múltiples apps
- Decisiones de seguridad o cumplimiento normativo
- Cualquier cambio que quieras que un desarrollador futuro entienda sin preguntar

---

## Añadir una colección al CMS

### 1. Crear el archivo de colección

```bash
touch apps/cms/src/collections/MiColeccion.ts
```

Sigue el patrón de las colecciones existentes:

```typescript
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access/isAdmin'
import { isAdminOrEditor } from '../access/isEditorOrAdmin'

export const MiColeccion: CollectionConfig = {
  slug: 'mi-coleccion',
  labels: {
    singular: { es: 'Mi Colección', en: 'My Collection' },
    plural: { es: 'Mis Colecciones', en: 'My Collections' },
  },
  admin: {
    group: { es: 'Grupo', en: 'Group' },
    useAsTitle: 'name',
  },
  access: {
    create: isAdminOrEditor,
    read: () => true,
    update: isAdminOrEditor,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    // ...más fields
  ],
}
```

### 2. Registrar en `payload.config.ts`

```typescript
import { MiColeccion } from './collections/MiColeccion'

// dentro de collections: [
  MiColeccion,
// ]
```

### 3. Generar tipos

```bash
pnpm generate:types
```

Esto regenera `apps/cms/src/payload-types.ts` y los tipos compartidos en `packages/types`.

### 4. Crear migración

```bash
pnpm db:push
```

### 5. (Opcional) Añadir seed

```bash
# Edita el script de seed y ejecútalo
pnpm content:seed
```

### 6. Actualizar el frontend

Si el frontend consume esta colección:

- Añadir query en `apps/web/src/content/` o en la página correspondiente
- Tipar con `@frontvalencia/types`

---

## Añadir una página a la web

### 1. Crear la página Astro

```bash
# Para español
touch apps/web/src/pages/es/mi-pagina.astro
# Para inglés
touch apps/web/src/pages/en/my-page.astro
```

### 2. Layout y contenido

```astro
---
import Layout from '../../layouts/Layout.astro'
import { getCollection } from 'astro:content'
---

<Layout title="Mi Página" description="Descripción">
  <main>
    <!-- Contenido -->
  </main>
</Layout>
```

### 3. Rutas y navegación

- Astro genera rutas automáticamente desde `src/pages/`
- La i18n está configurada con prefijo de locale (`/es/`, `/en/`)
- Añadir enlace en el menú de navegación del layout correspondiente

### 4. SEO

- El layout base ya incluye `<title>`, `<meta description>`, Open Graph y canonical
- El sitemap se genera automáticamente (`pages/sitemap.xml.ts`)
- Para contenido dinámico desde CMS, usar los campos SEO del globals `SiteConfig`

### 5. Estilos

- Usar Tailwind v4 utility classes exclusivamente
- El tema global se define en `src/styles/`
- Los componentes interactivos en React van en `src/components/`

### 6. Testing

- Añadir test e2e en `tests/e2e/` para la nueva página
- Verificar navegación, contenido visible y funcionalidad crítica

---

## Formato de commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/) con tipos estrictos.

### Estructura

```
<type>(<scope>): <description>

[body opcional]

[footer opcional]
```

### Tipos permitidos

| Tipo       | Uso                                                         |
| ---------- | ----------------------------------------------------------- |
| `feat`     | Nueva funcionalidad                                         |
| `fix`      | Corrección de bug                                           |
| `chore`    | Mantenimiento, tooling, CI, config                          |
| `docs`     | Documentación                                               |
| `refactor` | Cambio de código que no añade funcionalidad ni corrige bugs |
| `test`     | Añadir o modificar tests                                    |
| `style`    | Formato, lint, prettier (no lógica)                         |
| `perf`     | Mejora de rendimiento                                       |
| `db`       | Migraciones, seeds, esquema de BD                           |

### Scopes principales

| Scope    | Ámbito               |
| -------- | -------------------- |
| `cms`    | Payload CMS          |
| `web`    | Sitio web (Astro)    |
| `types`  | Paquete compartido   |
| `config` | Configuración global |
| `ci`     | GitHub Actions       |
| `docker` | Docker Compose       |
| `deps`   | Dependencias         |

### Ejemplos

```
feat(cms): add opening hours to site config

fix(web): correct CORS headers for CMS preview

chore(deps): update Payload to 3.27

docs(cms): add ADR for R2 storage choice

refactor(web): extract navigation into shared component

test(web): add e2e for reservation flow

db(cms): add migration for menu category sort order

feat(web): add "La Carta" page with dynamic menu items

fix(cms): validate allergen relationship before save

chore(ci): add Node 22 to test matrix
```

### Reglas

- `description` en presente, imperativo, sin mayúscula inicial
- `body` opcional para contexto adicional (por qué, cómo)
- `footer` para breaking changes (`BREAKING CHANGE:`) o referencias a issues (`Closes #123`)
- Preferir commits atómicos: un cambio lógico = un commit
- `git rebase -i` para limpiar historia antes de PR

---

## Docker

```bash
# Desarrollo
pnpm docker:dev

# Producción
pnpm docker:prod

# Parar y limpiar
pnpm docker:down

# Reset completo
pnpm docker:reset
```

## Licencia

Al contribuir, aceptas que tu código se publique bajo la misma licencia del proyecto.
