# Guía: calidad y cobertura

### Propósito de este documento

- **Objetivos:** Fijar el objetivo de cobertura y el significado de los jobs `quality` / `test` / `build` / `smoke`.
- **Estructura:** Gate de cobertura → tabla de jobs del pipeline principal (release y Lighthouse quedan aparte).
- **Contenido a integrar según contexto:** Adapta comandos pnpm de este monorepo. No copies gates de una CLI ni umbrales que este repo no pueda cumplir aún. El mínimo de flota es ≥ 70 %.

## Gate de cobertura

Objetivo de flota: **≥ 70 %** (statements, branches, functions, lines).

Vitest (`vitest.config.ts` y `apps/web/vitest.config.ts`) reporta cobertura sobre `apps/web/src/**` pero **no impone** ese umbral en CI todavía: la suite unitaria cubre i18n, schemas y helpers, no todo el frontend. No bajes el objetivo documentado; añade tests antes de endurecer el gate.

```bash
pnpm --filter frontvalencia-web run test:unit
```

## Jobs del pipeline principal

| Job       | Qué hace                                                               |
| --------- | ---------------------------------------------------------------------- |
| `quality` | `astro check` (lint + tipos) y `pnpm run format:check` de contratos    |
| `test`    | Vitest unitario (`frontvalencia-web`)                                  |
| `build`   | `astro build`; sube artefacto `apps/web/dist/`                         |
| `smoke`   | Comprueba HTML ES/EN + `robots.txt`; Playwright chromium sobre el dist |

`release.yml` (Changesets) y `lighthouse.yml` siguen aparte y no se renombran.
