#!/usr/bin/env node
// Despachador del CLI `hemispheric`: el subcomando decide a quién llama.
//   hemispheric install [--claude|--codex|--global|--plugin <dir>...]   -> install.mjs (instalar/empaquetar)
//   hemispheric uninstall [...]                                          -> install.mjs --uninstall
//   hemispheric <lo que sea>                                            -> cli/memoria.mjs (la CLI de memoria)
// Asi `npx hemispheric install --claude` funciona una vez publicado (npm) o con el repo publico (npx github:...).
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(AQUI, '..');
const argv = process.argv.slice(2);
const sub = argv[0];

let destino, args;
if (sub === 'install') { destino = path.join(ROOT, 'install.mjs'); args = argv.slice(1); }
else if (sub === 'uninstall') { destino = path.join(ROOT, 'install.mjs'); args = ['--uninstall', ...argv.slice(1)]; }
else { destino = path.join(ROOT, 'cli', 'memoria.mjs'); args = argv; }

const r = spawnSync(process.execPath, [destino, ...args], { stdio: 'inherit' });
process.exit(r.status == null ? 1 : r.status);
