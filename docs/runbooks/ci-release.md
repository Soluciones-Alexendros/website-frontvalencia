# Runbook: CI y release

### Propósito de este documento

- **Objetivos:** Diagnosticar jobs rojos del pipeline principal y el ciclo Changesets sin tocar org settings ni branch protection.
- **Estructura:** Fallos `quality` / `test` / `build` / `smoke` → release (Changesets) → Renovate.
- **Contenido a integrar según contexto:** Adapta comandos y secretos de este repo (`GITHUB_TOKEN`). No copies semantic-release de otra CLI. No hagas force-push.

## Jobs `quality` / `test` / `build` / `smoke` en rojo

1. Reproduce en local los comandos de [calidad](../guides/calidad.md).
2. `quality` + format: `pnpm run format` sobre contratos y vuelve a `format:check`.
3. `quality` + Astro: `pnpm --filter frontvalencia-web run lint`.
4. `test`: `pnpm --filter frontvalencia-web run test:unit`.
5. `build`: `pnpm --filter frontvalencia-web build` y confirma `apps/web/dist/`.
6. `smoke` + Playwright: el job reutiliza el artefacto; en local, `pnpm --filter frontvalencia-web exec playwright test --project=chromium`.

No hagas force-push para «arreglar» CI. No toques `release.yml` ni ajustes de organización.

## Release (Changesets)

- Disparo: push a `main` con changeset.
- `apps/web` es `private`: no se publica a npm. Changesets abre el PR `ci: version packages` y, al mergear, tag + GitHub Release.
- Secretos esperados: `GITHUB_TOKEN` del workflow.

## Renovate

Configuración en `.github/renovate.json` (managers `npm` y `github-actions`). No hay Dependabot de version-updates. PRs de major van con label `breaking-change` y sin automerge.
