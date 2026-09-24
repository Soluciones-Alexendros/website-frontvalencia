<!-- canon-managed: true -->

### Propósito de este documento

- **Objetivos:** Plantilla de PR para describir el cambio y exigir las comprobaciones de calidad, tests y jobs `quality` / `test` / `build` / `smoke`.
- **Estructura:** Qué cambia → checklist (lint, unit, build, smoke, docs, secretos, CI).
- **Contenido a integrar según contexto:** Adapta el checklist a los scripts pnpm de este monorepo. No copies plantillas de otro paquete público. No pises carta, assets de marca ni workflows de release.

## Qué cambia

<!-- feat/fix/docs + alcance en una o dos frases -->

## Checklist

- [ ] `pnpm --filter frontvalencia-web run lint` (Astro check)
- [ ] `pnpm --filter frontvalencia-web run test:unit`
- [ ] `pnpm --filter frontvalencia-web build` y `dist/` no se commitea
- [ ] Docs actualizadas (`README.md` y `docs/architecture/decisions/` si toca arquitectura)
- [ ] Sin secretos ni `.env` reales
- [ ] CI `quality` / `test` / `build` / `smoke` en verde
