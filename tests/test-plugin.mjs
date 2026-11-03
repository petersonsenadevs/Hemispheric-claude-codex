#!/usr/bin/env node
// Empaquetado como plugin (Claude/Codex): `node install.mjs --plugin <dir>` produce un plugin autocontenido en el
// MISMO formato que el plugin de Senzu que Codex ya consume: .claude-plugin/plugin.json + hooks/hooks.json (con
// ${CLAUDE_PLUGIN_ROOT}) + los .mjs del nucleo. Esto es el "adaptador de Codex" (X-T25).
//   node tests/test-plugin.mjs

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INSTALL = path.join(ROOT, 'install.mjs');
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'hemi-plugin-'));
let casos = 0, fallos = 0;
const ok = (c, n, d = '') => { casos++; if (!c) { fallos++; process.stdout.write(`FALLO ${n}${d ? ' -> ' + d : ''}\n`); } };

const dir = path.join(base, 'plugin');
const r = spawnSync(process.execPath, [INSTALL, '--plugin', dir], { encoding: 'utf8' });
ok(r.status === 0, 'empaqueta sin error', r.stderr ? r.stderr.slice(0, 120) : `status=${r.status}`);

// plugin.json
const pj = path.join(dir, '.claude-plugin', 'plugin.json');
ok(fs.existsSync(pj), 'existe .claude-plugin/plugin.json');
const plugin = fs.existsSync(pj) ? JSON.parse(fs.readFileSync(pj, 'utf8')) : {};
ok(plugin.name === 'hemispheric', 'plugin.json name = hemispheric', plugin.name);
ok(typeof plugin.version === 'string' && plugin.version.length > 0, 'plugin.json tiene version');

// hooks.json
const hj = path.join(dir, 'hooks', 'hooks.json');
ok(fs.existsSync(hj), 'existe hooks/hooks.json');
const hooks = fs.existsSync(hj) ? JSON.parse(fs.readFileSync(hj, 'utf8')).hooks : {};
for (const ev of ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PostToolUse', 'Stop', 'SessionEnd']) {
    ok(Array.isArray(hooks[ev]) && hooks[ev].length > 0, `hooks.json tiene el evento ${ev}`);
}
// todos los comandos apuntan al plugin (CLAUDE_PLUGIN_ROOT), ninguno a una ruta de la maquina
const cmds = Object.values(hooks).flat().flatMap(g => (g.hooks || []).map(h => h.command));
ok(cmds.length > 0 && cmds.every(c => c.includes('${CLAUDE_PLUGIN_ROOT}/hooks/')), 'todos los comandos usan ${CLAUDE_PLUGIN_ROOT}/hooks/', cmds[0]);
ok(!cmds.some(c => c.includes(':') && /[A-Za-z]:\//.test(c)), 'ningun comando lleva una ruta absoluta de la maquina');
// el matcher de edicion incluye apply_patch (Codex)
const pre = (hooks.PreToolUse || []).map(g => g.matcher).join('|');
ok(/apply_patch/.test(pre), 'PreToolUse acepta apply_patch (Codex)', pre);

// los .mjs del nucleo estan copiados (hooks + dependencias de mismo directorio)
for (const f of ['session-start.mjs', 'memoria-viva.mjs', 'recuerdo-vivo.mjs', 'memoria-archivo.mjs', 'hechos-guard.mjs', 'estado-sesion.mjs', 'session-end.mjs', 'hechos.mjs', 'host.mjs', 'lib.mjs', 'messages.mjs']) {
    ok(fs.existsSync(path.join(dir, 'hooks', f)), `copiado hooks/${f}`);
}
// cada comando apunta a un fichero que existe en el paquete
for (const c of cmds) {
    const m = /hooks\/([\w.-]+\.mjs)/.exec(c);
    ok(m && fs.existsSync(path.join(dir, 'hooks', m[1])), `el comando apunta a un .mjs que existe (${m ? m[1] : c})`);
}

// idempotente: re-empaquetar da el mismo hooks.json
const antes = fs.readFileSync(hj, 'utf8');
spawnSync(process.execPath, [INSTALL, '--plugin', dir], { encoding: 'utf8' });
ok(fs.readFileSync(hj, 'utf8') === antes, 're-empaquetar es idempotente (hooks.json igual)');

process.stdout.write(`\nPlugin (Codex/Claude) -> Casos: ${casos}  Fallos: ${fallos}\n`);
process.exit(fallos ? 1 : 0);
