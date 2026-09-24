# ADR 002: Estructura Monorepo — Turborepo + pnpm Workspaces

### Propósito de este documento

- **Objetivos:** Registrar por qué el repo es un monorepo pnpm + Turborepo (`apps/web`, `apps/cms`, `packages/`).
- **Estructura:** Metadatos → contexto → decisión → consecuencias.
- **Contenido a integrar según contexto:** Conserva la estructura de producto. No copies un monorepo de landing/SaaS.

| Campo               | Valor                               |
| ------------------- | ----------------------------------- |
| **Fecha**           | 2026-07-13                          |
| **Estado**          | Aceptado                            |
| **Decisores**       | Equipo de desarrollo FRONT Valencia |
| **Última revisión** | 2026-07-13                          |

---

## Contexto

FRONT Valencia consta de múltiples aplicaciones y paquetes que deben desarrollarse, probarse y desplegarse de forma coordinada:

1.  **`apps/cms`** — Payload CMS 3 (Next.js 15). Panel de administración, API REST, webhooks, gestión de contenido.
2.  **`apps/web`** — Astro 7. Frontend público del restaurante, SSG + ISR, React islands.
3.  **`packages/types`** — Tipos TypeScript compartidos (payload-types, tipos de dominio, tipos de API).
4.  **`tools`** — Scripts auxiliares (scraping, validación de entorno, seed de contenido).

### Requerimientos

- **Compartir tipos** entre CMS y frontend sin copiar código
- **Ejecutar tareas en paralelo** (dev, build, lint, test) con dependencias entre ellas
- **Cachear builds** para acelerar CI/CD
- **Unificar configuración** de TypeScript, ESLint, y herramientas de desarrollo
- **Publicar paquetes** internos con versionado semántico (opcional, para `@frontvalencia/types`)
- **Aislar entornos** de cada aplicación (cada una con su propio `package.json` y dependencias)

### Restricciones

- El `packageManager` del proyecto es `pnpm@8.15.0`
- Node.js ≥ 22.12.0 requerido (por features de `require(esm)` y rendimiento)
- CI/CD en GitHub Actions con caché de builds
- Despliegue separado: Vercel para `apps/web`, Railway para `apps/cms`

---

## Opciones Consideradas

### 1. Turborepo + pnpm Workspaces

- **Pipeline**: Definición de DAG de tareas en `turbo.json`
- **Caché**: Local + remota (Vercel Remote Caching)
- **Paralelismo**: Nativo, con dependencias entre tareas
- **Workspaces**: pnpm workspace protocol (`workspace:*`)
- **TypeScript**: Soporte nativo de project references
- **Publicación**: Compatible con Changesets

### 2. Nx

- **Pipeline**: Task graph avanzado con dependencias explícitas
- **Caché**: Local + distribuida (Nx Cloud)
- **Paralelismo**: Nativo
- **Workspaces**: Soporta npm, yarn, pnpm
- **TypeScript**: Soporte de project references + generación de código
- **Publicación**: Nx release

### 3. Lerna (+ yarn/pnpm)

- **Pipeline**: Básico (run-script)
- **Caché**: Manual
- **Paralelismo**: Limitado
- **Workspaces**: Delegado en pnpm/yarn
- **TypeScript**: No nativo
- **Publicación**: Nativa (publish, version)

### 4. pnpm Workspaces solamente (sin Turborepo)

- **Pipeline**: Inexistente (usa scripts compositivos en root package.json)
- **Caché**: Manual (no hay caché de builds entre runs)
- **Paralelismo**: `pnpm --parallel`
- **Workspaces**: `pnpm-workspace.yaml`
- **TypeScript**: Manual
- **Publicación**: Cambios manuales

### 5. Bun Workspaces

- **Pipeline**: `bun run` con scripts
- **Caché**: No hay sistema de caché de builds
- **Paralelismo**: `bun --filter`
- **Workspaces**: `bun.lock` + `workspaces` en `package.json`
- **TypeScript**: Nativo (Bun incluye TypeScript)
- **Publicación**: No maduro

---

## Comparativa

| Feature               | Turborepo + pnpm     | Nx                    | Lerna           | pnpm solo      | Bun             |
| --------------------- | -------------------- | --------------------- | --------------- | -------------- | --------------- |
| **Task pipeline DAG** | ✅ Excelente         | ✅ Excelente          | ⚠️ Básico       | ❌ No          | ❌ No           |
| **Caché de builds**   | ✅ Local + remoto    | ✅ Local + remoto     | ❌ No           | ❌ No          | ❌ No           |
| **Paralelismo**       | ✅ Automático        | ✅ Automático         | ⚠️ Parcial      | ⚠️ Manual      | ⚠️ Manual       |
| **Soporte pnpm**      | ✅ Nativo            | ✅ Bueno              | ✅ Bueno        | ✅ Nativo      | ❌ No           |
| **Configuration DX**  | ✅ Turborepo minimal | ⚠️ Verboso            | ✅ Simple       | ❌ Inexistente | ✅ Simple       |
| **CI/CD caching**     | ✅ Sencillo          | ✅ Completo           | ❌ Manual       | ❌ Manual      | ❌ Experimental |
| **Monorepo setup**    | ⚡ Muy rápido        | ⏱️ Lento (generación) | ⚡ Rápido       | ⚡ Rápido      | ⚡ Rápido       |
| **Ecosistema**        | Amplio               | Muy amplio            | Histórico       | Pequeño        | Emergente       |
| **Madurez**           | Maduro (v2)          | Maduro                | Maduro (legacy) | Maduro         | Experimental    |

---

## Decisión

**Turborepo + pnpm Workspaces**

---

## Justificación (Rationale)

### pnpm Workspaces

1. **pnpm workspace protocol** — Las dependencias internas (`@frontvalencia/types`, `@frontvalencia/eslint-config`, `@frontvalencia/tsconfig`) se referencian con `workspace:*` en los `package.json`. pnpm resuelve automáticamente las versiones locales sin necesidad de publicar.

2. **Instalación eficiente** — pnpm usa linked store global y estructura `node_modules` estricta (no hoisting). Esto evita dependencias fantasma y acelera la instalación en CI.

3. **Lockfile determinista** — `pnpm-lock.yaml` proporciona instalaciones reproducibles, esencial para el equipo y la CI.

4. **Filtros** — `pnpm --filter <package>` permite ejecutar comandos específicos para una aplicación o paquete.

### Turborepo

1. **Pipeline DAG** — `turbo.json` define el grafo de dependencias entre tareas. Ejemplo: `build` depende de `^build` (build de dependencias) y `//#generate:types` (generación de tipos global). Esto garantiza el orden correcto sin scripts manuales.

2. **Caché de builds** — Turborepo cachea automáticamente las salidas de cada tarea. Si el código fuente, las dependencias o las variables de entorno no cambian, la tarea se salta. En CI, se puede usar Remote Caching de Vercel para compartir la caché entre desarrolladores.

3. **Paralelismo automático** — Tareas independientes se ejecutan en paralelo sin configuración adicional. `turbo run dev --parallel` arranca CMS y frontend simultáneamente.

4. **Configuración mínima** — `turbo.json` es declarativo y conciso. No requiere plugins ni generación de código.

5. **Integración con Vercel** — Turborepo es mantenido por Vercel, que también aloja `apps/web`. La integración con Vercel Remote Caching es nativa.

### Estructura resultante

```
frontvalencia/
├── apps/
│   ├── cms/                  → Payload CMS (Next.js 15)
│   │   ├── src/
│   │   ├── package.json      → depends on @frontvalencia/types
│   │   └── tsconfig.json
│   └── web/                  → Astro 7
│       ├── src/
│       ├── astro.config.mjs
│       ├── package.json      → depends on @frontvalencia/types
│       └── tsconfig.json
├── packages/
│   ├── types/                → @frontvalencia/types
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── eslint-config/        → @frontvalencia/eslint-config
│   │   └── package.json
│   └── tsconfig/             → @frontvalencia/tsconfig
│       └── package.json
├── tools/                    → Scripts auxiliares
│   └── scripts/
├── turbo.json                → Pipeline DAG
├── pnpm-workspace.yaml       → Workspace definition
├── pnpm-lock.yaml
└── package.json              → Root scripts
```

### Pipeline definido en turbo.json

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build", "//#generate:types"],
      "outputs": ["dist/**", ".astro/**", ".next/**", "build/**"]
    },
    "//#generate:types": {
      "cache": true,
      "outputs": [
        "apps/cms/src/payload-types.ts",
        "packages/types/src/index.d.ts",
        "packages/types/src/payload-types.d.ts"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^//#generate:types"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

El task `//#generate:types` se ejecuta a nivel root y genera los tipos de Payload y los tipos compartidos antes de que cualquier build dependa de ellos. Esto rompe el ciclo de dependencia circular: CMS genera tipos → tipos se copian a `packages/types` → frontend consume tipos.

---

## Consecuencias

### Positivas

- ✅ **Paralelismo real**: dev, build, lint y test se ejecutan concurrentemente respetando dependencias.
- ✅ **Caché eficiente**: las tareas no se repiten si no hay cambios. En CI, el build completo tarda segundos si la caché está caliente.
- ✅ **Aislamiento de dependencias**: cada app tiene su propio `package.json`. Las dependencias compartidas (TypeScript, Tailwind, React) se declaran en cada app, no hay conflictos de versiones.
- ✅ **Tipos compartidos**: `packages/types` es la fuente de verdad para todos los tipos. El CMS genera payload-types, el frontend los consume.
- ✅ **Dev UX**: `pnpm dev` arranca CMS y frontend simultáneamente con hot reload en ambos.
- ✅ **Despliegue independiente**: `apps/cms` se despliega en Railway, `apps/web` en Vercel. Cada uno con su propia configuración y pipeline CI/CD.

### Negativas / Riesgos

- ⚠️ **Lockfile único** — pnpm centraliza todas las dependencias en `pnpm-lock.yaml`. Esto es positivo para consistencia, pero el lockfile puede crecer y los conflictos en merges son difíciles de resolver.
- ⚠️ **Configuración de caché Turborrepo** — Si los outputs en `turbo.json` no están bien definidos, la caché puede dar falsos positivos (no rebuild cuando debería). Requiere mantenimiento.
- ⚠️ **DAG complejo** — A medida que crecen las apps y los paquetes, el pipeline puede volverse complejo. Una tarea bloqueada puede parar todo el build. Monitorizar con `turbo run build --graph`.
- ⚠️ **pnpm store** — La store global de pnpm ocupa espacio en disco. En CI, debe cachearse explícitamente.
- ⚠️ **Node.js ≥ 22.12.0** — Versión de Node.js reciente. Entornos legacy (CI runners antiguos) pueden necesitar actualización.

### Mitigaciones

1.  **Mantener `turbo.json` actualizado** — Revisar outputs y dependencias al añadir nuevos paquetes o comandos.
2.  **Cache de CI** — En GitHub Actions, cachear `~/.local/share/pnpm/store` y `.turbo` para acelerar instalaciones y builds.
3.  **CI matrix** — Separar jobs de CI: lint, typecheck, test, build. Cada uno puede usar la caché de Turbo.
4.  **Overrides de pnpm** — Usar `pnpm.overrides` en root `package.json` para forzar versiones de dependencias transitivas problemáticas.

---

## Referencias

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [ADR-001: CMS Selection](./001-cms-selection.md)
- [ADR-003: SSG + ISR + Preview Fetch Strategy](./003-fetch-strategy.md)
- `turbo.json` en la raíz del proyecto
- `pnpm-workspace.yaml` en la raíz del proyecto
