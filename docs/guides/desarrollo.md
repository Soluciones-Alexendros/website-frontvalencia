# Guía: desarrollo local

### Propósito de este documento

- **Objetivos:** Arrancar el monorepo en local (pnpm), levantar web y CMS, y saber qué documento actualizar según el tipo de cambio.
- **Estructura:** Requisitos → arranque → comprobaciones antes del PR → tabla «dónde documentar».
- **Contenido a integrar según contexto:** Adapta Node, lockfile y scripts de este repo. No copies un setup npm/CLI. No sustituyas carta ni assets de marca.

## Requisitos

- Node.js 22 (`nvm use` lee `.nvmrc`)
- pnpm ≥ 8.15 (el lockfile es `pnpm-lock.yaml`; no uses npm en la raíz)
- Docker (opcional) para Postgres + stack completo

## Arranque

```bash
nvm use
pnpm install
cp .env.example .env
pnpm dev
```

- Web: <http://localhost:4321/es/>
- CMS: <http://localhost:3001/admin> (requiere PostgreSQL)

Con Docker: `pnpm docker:dev`.

La web puede construirse sin CMS (contenido estático en `apps/web/src/content/`). El CMS sí necesita `DATABASE_URI` y `PAYLOAD_SECRET`.

## Antes de abrir un PR

```bash
pnpm --filter frontvalencia-web run lint
pnpm --filter frontvalencia-web run test:unit
pnpm --filter frontvalencia-web build
pnpm run format:check
```

Hooks husky: Conventional Commits y lint-staged en pre-commit.

## Dónde documentar

| Cambio                        | Documento                             |
| ----------------------------- | ------------------------------------- |
| Arranque o scripts            | `README.md`                           |
| CMS, fetch, i18n, monorepo    | ADR en `docs/architecture/decisions/` |
| Fallo operativo de CI/release | runbook en `docs/runbooks/`           |
| Cómo contribuir               | `CONTRIBUTING.md`                     |
