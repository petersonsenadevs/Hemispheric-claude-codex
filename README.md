# Hemispheric

Memoria **determinista, offline y sin dependencias** para agentes de IA. Guarda lo estable que dice el usuario,
lo sustituye y lo fecha, y lo recupera siempre igual — en cualquier idioma, sin red y sin servidores. Se enchufa
donde ya trabajas: Claude Code / Codex (hooks), Obsidian (plugin) y standalone.

> Repo propio del motor Node, extraído de Senzu (`D:\dev-standards`) en el carve-out (fase F10). Mientras dura la
> migración, Senzu sigue llevando su copia; aquí vive el núcleo que será la fuente de verdad.

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
Carve-out en curso (F10): este repo ya arranca el núcleo con sus tests en verde. Pendiente: instalador propio
(F10-T2), adaptador Obsidian (F10-T3), que Senzu pase a consumir este paquete (F10-T4) y paridad e2e entre
anfitriones (F10-T5).

## Licencia
Pendiente de elegir (recomendación: MIT). Ver `LICENSE`.
