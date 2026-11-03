# Hemispheric

Memoria **determinista, offline y sin dependencias** para agentes de IA. Guarda lo estable que dice el usuario,
lo sustituye y lo fecha, y lo recupera siempre igual — en cualquier idioma, sin red y sin servidores. Se enchufa
donde ya trabajas: Claude Code / Codex (hooks) y standalone.

> **Documentación narrativa (qué es, mensaje, la Cortex, FAQ):** [`docs.md`](./docs.md). Este README es la referencia
> rápida de estructura y comandos.
>
> Repo propio del motor Node, extraído de Senzu (`D:\dev-standards`) en el carve-out: aquí vive la **fuente de verdad**
> del cerebro; Senzu consume una copia sincronizada.

## Estructura
- `src/` — el núcleo: motor de hechos (`hechos.mjs`), base común (`lib`, `messages`, `session-end`), detección de
  anfitrión (`host.mjs`) y los hooks de cerebro (`recuerdo-vivo`, `session-start`, `estado-sesion`, `memoria-viva`,
  `memoria-archivo`, `hechos-guard`). Todo con imports de mismo directorio: autocontenido, cero imports a Senzu.
- `cli/` — `memoria.mjs`: la línea de comandos (`--guardar` / `--buscar` / `--recordar` / `--contexto` / `--cortex`).
- `cortex/` — `cortex.mjs` + `cortex-textos.mjs`: la memoria como un HTML local (la «Cortex»), sin red.
- `tests/` — suites deterministas sin LLM: `test-frontera` (núcleo limpio), `test-hechos` (motor), `test-hard-recall`.

## Instalar
```
node install.mjs                 # registra los hooks en .claude/settings.json del proyecto actual
node install.mjs --global        # para todos los proyectos (~/.claude/settings.json)
node install.mjs --uninstall     # quita los hooks de Hemispheric (deja intacto lo demás)
node install.mjs --dry-run       # enseña lo que haría, sin escribir
```
Merge-safe (no pisa tus hooks ni tus permisos) e idempotente. Crea `.hemispheric/` (memoria del proyecto) y
`~/.config/hemispheric/` (memoria global), y deja `.hemispheric/hooks.json` (manifiesto portable).

**Codex**: ejecuta los hooks por la vía de plugin (marketplace en `~/.codex/config.toml`), no por `settings.json`
de proyecto; el registro nativo en Codex llega con el empaquetado como plugin (F10-T4). En Claude ya quedan activos.

## Probar
```
npm test
```
(o `node tests/test-frontera.mjs && node tests/test-hechos.mjs && node tests/test-hard-recall.mjs`)

## Estado
Carve-out completo (F10): núcleo + instalador propio + Senzu consumiendo este paquete por sync + paridad e2e entre
anfitriones, todo con tests en verde. La Cortex es la fuente de verdad aquí y se sincroniza a Senzu. Pendiente no
bloqueante: empaquetado como plugin para el registro nativo en Codex.

## Licencia
Doble licencia (© 2026 Peterson Sena):
- **Uso no comercial** (personal, estudio, hobby, ONG, educación/sector público): gratis bajo **PolyForm
  Noncommercial 1.0.0** (`LICENSE`), conservando el crédito (`Required Notice`).
- **Uso comercial**: requiere **licencia de pago** aparte — ver `COMMERCIAL.md` (petersonsena24@gmail.com).

No es asesoría legal; para los términos comerciales finales, consulta a un profesional.
