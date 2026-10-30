#!/usr/bin/env node
// Instalador de Hemispheric (F10-T2) — batería rebuscada, hermética (proyecto y HOME temporales), sin red.
// Cubre: instalación limpia, reinstalación idempotente, desinstalación limpia, NO pisar lo que el usuario ya tenía,
// settings.json inválido (no lo clobbera), --global y --dry-run (no escribe).
//   node tests/test-install.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const INSTALL = path.join(ROOT, 'install.mjs');
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'hemi-install-'));

let casos = 0, fallos = 0;
const ok = (c, n, d = '') => { casos++; if (!c) { fallos++; process.stdout.write(`FAIL ${n}${d ? ' -> ' + d : ''}\n`); } };
let seq = 0;
const nuevoProyecto = () => { const d = path.join(base, 'p' + (++seq)); fs.mkdirSync(d, { recursive: true }); return d; };
const nuevoHome = () => { const d = path.join(base, 'h' + seq); fs.mkdirSync(d, { recursive: true }); return d; };
const run = (P, H, ...extra) => spawnSync(process.execPath, [INSTALL, '--project', P, '--home', H, ...extra], { encoding: 'utf8' });
const settingsProy = P => path.join(P, '.claude', 'settings.json');
const leer = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const cmds = (s, ev) => (s && s.hooks && Array.isArray(s.hooks[ev]) ? s.hooks[ev] : []).flatMap(g => (g.hooks || []).map(h => h.command));
const tiene = (s, ev, file) => cmds(s, ev).some(c => c.includes('/src/' + file));

// ---- instalación limpia -------------------------------------------------------------------------------
{
    const P = nuevoProyecto(), H = nuevoHome();
    const r = run(P, H);
    ok(r.status === 0, 'instalación limpia: sale 0', r.stderr || r.stdout);
    const s = leer(settingsProy(P));
    ok(tiene(s, 'SessionStart', 'session-start.mjs'), 'registra session-start en SessionStart');
    ok(tiene(s, 'UserPromptSubmit', 'recuerdo-vivo.mjs') && tiene(s, 'UserPromptSubmit', 'memoria-viva.mjs'), 'registra recuerdo-vivo y memoria-viva en UserPromptSubmit');
    ok(tiene(s, 'PostToolUse', 'hechos-guard.mjs'), 'registra hechos-guard en PostToolUse');
    ok(tiene(s, 'Stop', 'estado-sesion.mjs') && tiene(s, 'SessionEnd', 'session-end.mjs'), 'registra Stop y SessionEnd');
    ok(!cmds(s, 'UserPromptSubmit').some(c => c.includes('prompt-router')), 'NO registra método Senzu (prompt-router)');
    ok(fs.existsSync(path.join(P, '.hemispheric', 'hooks.json')), 'deja el manifiesto portable .hemispheric/hooks.json');
    ok(fs.existsSync(path.join(P, '.hemispheric')) && fs.existsSync(path.join(H, '.config', 'hemispheric')), 'crea memoria de proyecto y global');
}

// ---- reinstalación idempotente ------------------------------------------------------------------------
{
    const P = nuevoProyecto(), H = nuevoHome();
    run(P, H); run(P, H);                       // dos veces
    const s = leer(settingsProy(P));
    ok(cmds(s, 'UserPromptSubmit').filter(c => c.includes('/src/recuerdo-vivo.mjs')).length === 1, 'idempotente: recuerdo-vivo no se duplica tras reinstalar');
    ok(cmds(s, 'PostToolUse').filter(c => c.includes('/src/hechos-guard.mjs')).length === 2, 'idempotente: hechos-guard sigue en sus 2 grupos (Edit y Bash), sin duplicar');
}

// ---- desinstalación limpia ----------------------------------------------------------------------------
{
    const P = nuevoProyecto(), H = nuevoHome();
    run(P, H);
    const r = run(P, H, '--uninstall');
    ok(r.status === 0, 'desinstalar: sale 0');
    const s = leer(settingsProy(P));
    ok(!cmds(s, 'UserPromptSubmit').some(c => c.includes('/src/')), 'desinstalar: quita nuestros hooks');
    ok(!fs.existsSync(path.join(P, '.hemispheric', 'hooks.json')), 'desinstalar: quita el manifiesto');
    ok(fs.existsSync(path.join(P, '.hemispheric')), 'desinstalar: NO borra la memoria del proyecto (son datos del usuario)');
}

// ---- no pisar lo que el usuario ya tenía --------------------------------------------------------------
{
    const P = nuevoProyecto(), H = nuevoHome();
    fs.mkdirSync(path.join(P, '.claude'), { recursive: true });
    const previo = { permissions: { allow: ['Bash(ls:*)'] }, hooks: { UserPromptSubmit: [{ hooks: [{ type: 'command', command: 'node mi-hook.mjs' }] }] } };
    fs.writeFileSync(settingsProy(P), JSON.stringify(previo));
    run(P, H);
    let s = leer(settingsProy(P));
    ok(s.permissions && s.permissions.allow[0] === 'Bash(ls:*)', 'no pisa: conserva permissions del usuario');
    ok(cmds(s, 'UserPromptSubmit').includes('node mi-hook.mjs'), 'no pisa: conserva el hook propio del usuario');
    ok(tiene(s, 'UserPromptSubmit', 'recuerdo-vivo.mjs'), 'y añade el nuestro junto al suyo');
    run(P, H, '--uninstall');
    s = leer(settingsProy(P));
    ok(cmds(s, 'UserPromptSubmit').includes('node mi-hook.mjs') && !cmds(s, 'UserPromptSubmit').some(c => c.includes('/src/')), 'desinstalar: quita el nuestro y deja el del usuario');
    ok(s.permissions && s.permissions.allow[0] === 'Bash(ls:*)', 'desinstalar: no toca permissions del usuario');
}

// ---- settings.json inválido: no lo clobbera -----------------------------------------------------------
{
    const P = nuevoProyecto(), H = nuevoHome();
    fs.mkdirSync(path.join(P, '.claude'), { recursive: true });
    fs.writeFileSync(settingsProy(P), '{ roto: no es json');
    const r = run(P, H);
    ok(r.status !== 0, 'settings inválido: sale con error (no clobbera)');
    ok(fs.readFileSync(settingsProy(P), 'utf8') === '{ roto: no es json', 'settings inválido: lo deja tal cual');
}

// ---- --global y --dry-run -----------------------------------------------------------------------------
{
    const P = nuevoProyecto(), H = nuevoHome();
    run(P, H, '--global');
    ok(tiene(leer(path.join(H, '.claude', 'settings.json')), 'SessionStart', 'session-start.mjs'), '--global: registra en ~/.claude/settings.json');
    ok(!fs.existsSync(settingsProy(P)), '--global: no toca el settings del proyecto');

    const P2 = nuevoProyecto(), H2 = nuevoHome();
    const r = run(P2, H2, '--dry-run');
    ok(r.status === 0 && !fs.existsSync(settingsProy(P2)) && !fs.existsSync(path.join(P2, '.hemispheric')), '--dry-run: no escribe nada');
}

fs.rmSync(base, { recursive: true, force: true });
process.stdout.write(`Casos: ${casos}  Fallos: ${fallos}\n`);
process.exit(fallos ? 1 : 0);
