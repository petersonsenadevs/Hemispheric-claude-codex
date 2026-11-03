#!/usr/bin/env node
// Frontera del núcleo en su propio repo (Hemispheric, F10-T1): src/ contiene SOLO el núcleo + base (cerebro), sin
// método Senzu, y ningún fichero de src/ importa fuera de src/. Es el gate que garantiza que el carve-out quedó
// limpio y autocontenido. Sin red, sin LLM, determinista.
//   node tests/test-boundary.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
// El núcleo portable: motor + base + host + hooks de cerebro. Nada de método Senzu (guards, router, reminders…).
const NUCLEO = ['facts', 'host', 'lib', 'messages', 'session-end',
    'live-recall', 'session-start', 'session-state', 'live-memory', 'file-memory', 'facts-guard'];

let casos = 0, fallos = 0;
const ok = (c, n, d = '') => { casos++; if (!c) { fallos++; process.stdout.write(`FAIL ${n}${d ? ' -> ' + d : ''}\n`); } };

const enDisco = fs.readdirSync(SRC).filter(n => n.endsWith('.mjs')).map(n => n.replace(/\.mjs$/, '')).sort();
for (const f of enDisco) ok(NUCLEO.includes(f), `src/ solo núcleo: ${f} está permitido (no método Senzu)`);
for (const n of NUCLEO) ok(enDisco.includes(n), `el núcleo trae ${n}.mjs`);

const importsLocales = c => {
    const specs = []; const re = /(?:import|export)\b[^'"\n]*?\bfrom\s*['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)|\bimport\s*['"]([^'"]+)['"]/g;
    let m; while ((m = re.exec(c))) specs.push(m[1] || m[2] || m[3]); return specs;
};
for (const f of enDisco) {
    for (const spec of importsLocales(fs.readFileSync(path.join(SRC, f + '.mjs'), 'utf8'))) {
        if (spec.startsWith('node:') || !/^\.\.?\//.test(spec)) continue;   // builtin o paquete
        ok(!spec.startsWith('../'), `${f}: no importa fuera de src/ (${spec})`);
        const dep = spec.replace(/^\.\//, '').replace(/\.(mjs|cjs|js)$/, '');
        ok(NUCLEO.includes(dep), `${f}: import local ${dep} pertenece al núcleo`);
    }
}

process.stdout.write(`Casos: ${casos}  Fallos: ${fallos}\n`);
process.exit(fallos ? 1 : 0);
