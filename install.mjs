#!/usr/bin/env node
// Instalador de Hemispheric (F10-T2). Registra los hooks del núcleo y prepara las carpetas de memoria, sin
// dependencias y sin red. Determinista, merge-safe (no pisa lo que el usuario ya tenga) e idempotente.
//
//   node install.mjs [opciones]
//     --project <dir>   proyecto destino (por defecto: el directorio actual)
//     --home <dir>      HOME para la memoria global y los ajustes de usuario (por defecto: el del sistema)
//     --global          registra los hooks en el HOME (todos los proyectos) en vez de en el proyecto
//     --uninstall       quita los hooks de Hemispheric (deja intacto lo demás)
//     --dry-run         enseña lo que haría, sin escribir
//     --plugin <dir>    empaqueta un PLUGIN autocontenido (Claude/Codex) en <dir> y sale (no toca settings.json)
//
// Claude: registra los hooks en .claude/settings.json (o ~/.claude/settings.json con --global), fusionando.
// Codex: ejecuta los hooks por la vía de PLUGIN. Con `--plugin <dir>` se genera ese plugin en el MISMO formato que el
//   plugin de Senzu que Codex ya consume: .claude-plugin/plugin.json + hooks/hooks.json (con ${CLAUDE_PLUGIN_ROOT}) +
//   los .mjs del núcleo. El usuario lo publica en un marketplace de Codex, lo instala y aprueba los hooks en la app
//   (quedan en ~/.codex/config.toml -> hooks.state). Sin --plugin, el instalador deja el manifiesto .hemispheric/hooks.json.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(AQUI, 'src');                       // donde viven los hooks del núcleo (ruta absoluta)
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf(n); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : null; };
const has = n => args.includes(n);

const PROYECTO = path.resolve(opt('--project') && opt('--project') !== true ? String(opt('--project')) : process.cwd());
const HOME = path.resolve(opt('--home') && opt('--home') !== true ? String(opt('--home')) : os.homedir());
const GLOBAL = has('--global');
const DRY = has('--dry-run');
const log = s => process.stdout.write(s + '\n');

// El conjunto de hooks de CEREBRO (sin el método Senzu: ni router, ni guards, ni skill-reminders).
const HOOKSET = {
    SessionStart:     [{ files: ['session-start.mjs'] }],
    UserPromptSubmit: [{ files: ['memoria-viva.mjs', 'recuerdo-vivo.mjs'] }],
    PreToolUse:       [{ matcher: 'Edit|Write|MultiEdit|NotebookEdit|apply_patch', files: ['memoria-archivo.mjs'] }],
    PostToolUse:      [{ matcher: 'Edit|Write|MultiEdit|apply_patch', files: ['hechos-guard.mjs'] },
                       { matcher: 'Bash|PowerShell', files: ['hechos-guard.mjs'] }],
    Stop:             [{ files: ['estado-sesion.mjs', 'hechos-guard.mjs'] }],
    SessionEnd:       [{ files: ['session-end.mjs'] }],
};

const cmdDe = file => `node "${path.join(SRC, file).replace(/\\/g, '/')}"`;   // runtime garantizado: node, rutas con /
const esNuestro = cmd => typeof cmd === 'string' && cmd.includes(SRC.replace(/\\/g, '/'));   // nuestras entradas, por su ruta

// Para EMPAQUETAR como plugin (Claude/Codex): el comando apunta al propio plugin, no a una ruta de la maquina.
const cmdPlugin = file => `node "\${CLAUDE_PLUGIN_ROOT}/hooks/${file}"`;
function gruposPlugin(ev) {
    return HOOKSET[ev].map(g => {
        const grp = {};
        if (g.matcher) grp.matcher = g.matcher;
        grp.hooks = g.files.map(f => ({ type: 'command', command: cmdPlugin(f), timeout: ev === 'SessionEnd' ? 5 : 30 }));
        return grp;
    });
}

// Empaqueta Hemispheric como PLUGIN autocontenido (mismo formato que el plugin de Senzu que Codex ya consume):
// .claude-plugin/plugin.json + hooks/hooks.json (con ${CLAUDE_PLUGIN_ROOT}) + los .mjs del nucleo copiados a hooks/.
// El usuario lo publica en un marketplace de Codex, lo instala y APRUEBA los hooks en la app (quedan en
// ~/.codex/config.toml -> hooks.state). Vale igual como plugin de Claude.
function empaquetarPlugin(destino) {
    const dir = path.resolve(destino);
    let pkg = {}; try { pkg = JSON.parse(fs.readFileSync(path.join(AQUI, 'package.json'), 'utf8')); } catch {}
    if (DRY) { log(`  [dry-run] would package the plugin in ${dir}`); return; }
    const hooksDir = path.join(dir, 'hooks');
    fs.mkdirSync(hooksDir, { recursive: true });
    fs.mkdirSync(path.join(dir, '.claude-plugin'), { recursive: true });
    // 1) hooks.json en formato de plugin (CLAUDE_PLUGIN_ROOT), mismos eventos que el HOOKSET
    const h = {}; for (const ev of Object.keys(HOOKSET)) h[ev] = gruposPlugin(ev);
    fs.writeFileSync(path.join(hooksDir, 'hooks.json'), JSON.stringify({ hooks: h }, null, 2) + '\n');
    // 2) los .mjs del nucleo (hooks + dependencias de mismo directorio: autocontenido, cero imports externos)
    let n = 0;
    for (const f of fs.readdirSync(SRC)) if (f.endsWith('.mjs')) { fs.copyFileSync(path.join(SRC, f), path.join(hooksDir, f)); n++; }
    // 3) plugin.json
    const plugin = { name: 'hemispheric', description: pkg.description || 'Memoria determinista, offline y sin dependencias para agentes de IA.', version: pkg.version || '0.0.0', author: { name: 'Peterson Sena' }, license: 'SEE LICENSE IN LICENSE' };
    fs.writeFileSync(path.join(dir, '.claude-plugin', 'plugin.json'), JSON.stringify(plugin, null, 2) + '\n');
    log(`  [plugin] ${dir}: .claude-plugin/plugin.json + hooks/hooks.json + ${n} .mjs`);
    log('  Publish it to a Codex marketplace (like Senzu\'s); install it and approve the hooks in the app.');
}

// Construye los grupos de hooks de un evento en el formato de settings.json de Claude.
function gruposDe(ev) {
    return HOOKSET[ev].map(g => {
        const grp = {};
        if (g.matcher) grp.matcher = g.matcher;
        grp.hooks = g.files.map(f => ({ type: 'command', command: cmdDe(f), timeout: ev === 'SessionEnd' ? 5 : 30 }));
        return grp;
    });
}

function leerJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return {}; throw e; } }

// Fusiona en settings.json: quita SOLO lo nuestro (por la ruta) y, si no es --uninstall, vuelve a ponerlo.
function fusionar(settings, { quitar }) {
    const hooks = settings.hooks && typeof settings.hooks === 'object' ? settings.hooks : {};
    for (const ev of Object.keys(HOOKSET)) {
        const existentes = Array.isArray(hooks[ev]) ? hooks[ev] : [];
        // de los grupos que había, conserva los hooks que NO son nuestros (así no pisamos los del usuario)
        const ajenos = existentes
            .map(g => ({ ...g, hooks: (Array.isArray(g.hooks) ? g.hooks : []).filter(h => !esNuestro(h && h.command)) }))
            .filter(g => g.hooks.length);
        const nuevos = quitar ? [] : gruposDe(ev);
        const total = ajenos.concat(nuevos);
        if (total.length) hooks[ev] = total; else delete hooks[ev];
    }
    if (Object.keys(hooks).length) settings.hooks = hooks; else delete settings.hooks;
    return settings;
}

function escribir(file, obj) {
    if (DRY) { log(`  [dry-run] would write ${file}`); return; }
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
}

function asegurarDir(dir) {
    if (DRY) { log(`  [dry-run] would create ${dir}`); return; }
    fs.mkdirSync(dir, { recursive: true });
}

function run() {
    if (!fs.existsSync(path.join(SRC, 'hechos.mjs'))) { log(`Core not found in ${SRC}. Run install.mjs from the Hemispheric repo.`); process.exit(2); }

    // Modo empaquetar plugin (Claude/Codex): no toca settings.json; genera un plugin autocontenido en <dir>.
    const destinoPlugin = opt('--plugin');
    if (destinoPlugin && destinoPlugin !== true) {
        log(`Hemispheric · package plugin (Claude/Codex)${DRY ? ' (dry-run)' : ''}`);
        empaquetarPlugin(destinoPlugin);
        log('Done.');
        return;
    }

    const quitar = has('--uninstall');
    log(`Hemispheric · ${quitar ? 'uninstall' : 'install'}${GLOBAL ? ' (global)' : ''}${DRY ? ' (dry-run)' : ''}`);

    // 1) Claude: hooks en settings.json (proyecto o HOME)
    const settingsFile = GLOBAL ? path.join(HOME, '.claude', 'settings.json') : path.join(PROYECTO, '.claude', 'settings.json');
    let settings;
    try { settings = leerJson(settingsFile); }
    catch { log(`  [claude] WARNING: ${settingsFile} is not valid JSON; leaving it untouched (fix it and retry).`); process.exit(2); }
    escribir(settingsFile, fusionar(settings, { quitar }));
    log(`  [claude] ${quitar ? 'Hemispheric hooks removed from' : 'hooks registered in'} ${settingsFile}`);

    // 2) Manifiesto portable de hooks (lo consume el plugin para Claude/Codex, F10-T4)
    const manifest = path.join(PROYECTO, '.hemispheric', 'hooks.json');
    if (quitar) { if (!DRY) { try { fs.rmSync(manifest, { force: true }); } catch {} } log(`  [manifest] removed ${manifest}`); }
    else { const h = {}; for (const ev of Object.keys(HOOKSET)) h[ev] = gruposDe(ev); escribir(manifest, { hooks: h }); log(`  [manifest] ${manifest} (used by the Codex/Claude plugin)`); }

    // 3) Carpetas de memoria (no se borran al desinstalar: son datos del usuario)
    if (!quitar) {
        asegurarDir(path.join(PROYECTO, '.hemispheric'));            // memoria del proyecto
        asegurarDir(path.join(HOME, '.config', 'hemispheric'));      // memoria global del usuario
        log('  [memory] .hemispheric/ (project) and ~/.config/hemispheric/ (global) ready');
    }

    log('Done.' + (quitar ? '' : ' Codex: per-event hooks go through the plugin; in Claude they are already active.'));
}

run();
