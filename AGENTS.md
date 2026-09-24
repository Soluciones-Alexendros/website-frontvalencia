# AGENTS.md

### Propósito de este documento

- **Objetivos:** Fijar el contrato operativo para agentes de código y el rol Mantenedor: fuentes de verdad, autonomía, comandos y Definition of Done.
- **Estructura:** Destinatarios → fuentes de verdad → unidad de trabajo → autonomía → stack y comandos → convenciones → layout → Definition of Done.
- **Contenido a integrar según contexto:** Adapta layout, scripts pnpm y umbrales de este monorepo. No copies un `AGENTS.md` de landing/SaaS. No reescribas carta, assets de marca, copy ni el CMS. Conserva el producto local.

**Destinatarios:** agentes de código y el rol Mantenedor que trabajen en este repositorio.  
**Propósito:** contrato operativo. Homogeneizamos **nombres y contratos**, no el lenguaje ni la UX del restaurante.

## Fuentes de verdad (orden)

1. [README.md](./README.md) — producto, arranque y scripts
2. Este archivo
3. [ARCHITECTURE.md](./ARCHITECTURE.md)
4. [docs/architecture/decisions/](./docs/architecture/decisions/) — ADRs; el stub [`DECISIONS.md`](./DECISIONS.md) apunta aquí
5. [CONTRIBUTING.md](./CONTRIBUTING.md)
6. [SECURITY.md](./SECURITY.md)

No reinventes requisitos. Si falta ancla, paras y preguntas.

## Unidad de trabajo

```
Objetivo: <resultado verificable>
Traza: <ADR / issue>
Alcance: <archivos>
Exclusiones: <qué no harás>
Pruebas: pnpm --filter frontvalencia-web run test:unit / playwright smoke
Criterio de cierre: CI quality + test + build + smoke verdes
```

Una sesión = una unidad cohesiva. PR pequeño. Mensajes al humano y commits en español (Conventional Commits).

## Autonomía

**Puedes sin preguntar**

- Tests que fijan comportamiento ya aceptado
- Corregir lint/format/typecheck causados por tu cambio
- Docs de guía/runbook en español
- Refactors locales que no cambien rutas públicas, carta ni reservas

**Requiere confirmación**

- Cambiar i18n, Payload collections o la estrategia de fetch → ADR previo
- Dependencia runtime nueva en `apps/web` o `apps/cms`
- Tocar `release.yml`, Changesets o Lighthouse
- Publicar tags (lo hace Changesets en `main`)

## Stack y comandos

- Node 22 (`.nvmrc`), pnpm 8.15+, TypeScript, Astro, Vitest, Playwright, Turborepo
- Coverage: objetivo de flota **≥ 70 %**. Este repo documenta el gate; los umbrales de Vitest no se suben en este PR para no romper CI.

```bash
nvm use && pnpm install
pnpm --filter frontvalencia-web run lint
pnpm --filter frontvalencia-web run test:unit
pnpm --filter frontvalencia-web build
pnpm --filter frontvalencia-web exec playwright test --project=chromium
```

CI principal (`.github/workflows/ci.yml`): jobs `quality`, `test`, `build`, `smoke`. Release y Lighthouse quedan en workflows aparte.

## Convenciones

- Ramas `feat/` `fix/` `docs/` `chore/` (los agentes Cloud usan `cursor/…`)
- Hooks husky: commitlint (Conventional Commits) y lint-staged en pre-commit
- Idioma: docs de guía y contratos en español; código y commits técnicos en inglés
- No commitees `dist/`, `coverage/`, `.env` ni secretos
- No pises assets de marca ni copy de FRONT Valencia

## Layout

```
apps/web/       Astro + React (sitio público ES/EN)
apps/cms/       Payload CMS + PostgreSQL
packages/       types y quality compartidos
content/        extracciones y menú
docs/           architecture/, guides/, runbooks/
tests/          unitarios de raíz + e2e históricos
```

## Definition of Done

- Criterios de la traza cumplidos
- Jobs `quality`, `test`, `build` y `smoke` verdes
- Docs canónicos actualizados si cambia el contrato
- Sin secretos en el diff
