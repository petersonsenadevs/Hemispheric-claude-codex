#!/usr/bin/env node
// Batería VISUAL de la Cortex (Corvusmem F11-T2): no comprueba estructura (eso es test-cortex), sino que el cerebro
// se PINTA de verdad y se comporta, midiendo PÍXELES del canvas 3D en un navegador real. Rebuscada a propósito:
// idiomas, datos límite (vacío, uno, enorme, caracteres raros), el foco de búsqueda por diffing de frames, el volumen
// y la privacidad de la vista cliente. Siembra memoria REAL con el motor (sin mocks).
//
//   PLAYWRIGHT=<dir-del-paquete-playwright> [CHROMIUM=<exe>] node tests/test-cortex-visual.mjs
//
// Sin PLAYWRIGHT definido, intenta rutas conocidas; si no hay navegador, se omite con aviso (exit 0), como test-cortex.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'cortex-vis-'));
process.env.SENZU_MEMORIA_USUARIO = path.join(base, 'usuario', 'memoria.md');

const m = await import(pathToFileURL(path.join(ROOT, 'src', 'facts.mjs')).href);
const { htmlCortex } = await import(pathToFileURL(path.join(ROOT, 'cortex', 'cortex.mjs')).href);

// ---- cargar Playwright: env explícito, o rutas habituales, o se omite ----
async function cargarChromium() {
    const envDir = process.env.PLAYWRIGHT;
    const cands = [];
    if (envDir) cands.push(path.join(envDir, 'index.mjs'));
    for (const nm of [path.join(os.homedir(), 'node_modules', 'playwright'), path.join(ROOT, 'node_modules', 'playwright')]) cands.push(path.join(nm, 'index.mjs'));
    try { cands.push(path.join(path.dirname(createRequire(path.join(ROOT, 'noop.js')).resolve('playwright')), 'index.mjs')); } catch { /* no instalado aquí */ }
    for (const c of cands) {
        try { if (fs.existsSync(c)) { const mod = await import(pathToFileURL(c).href); if (mod.chromium) return mod.chromium; } } catch { /* siguiente */ }
    }
    return null;
}
const chromium = await cargarChromium();
if (!chromium) { process.stdout.write('(navegador omitido: define PLAYWRIGHT=<dir> para la bateria visual)\n'); process.exit(0); }

// ---- utilidades de siembra ----
const AHORA = '2026-10-07T12:00:00.000Z';
const T = dias => new Date(Date.parse(AHORA) - dias * 864e5).toISOString();
let nProy = 0;
function proyecto(seed) {
    const d = path.join(base, 'p' + (++nProy));
    fs.mkdirSync(path.join(d, 'senzu', 'devlog'), { recursive: true });
    fs.writeFileSync(path.join(d, 'senzu', 'senzu.json'), '{}');
    seed(e => m.guardarHecho(d, e, { ahora: e._t != null ? T(e._t) : AHORA }).hecho);
    return d;
}
function htmlDe(root, { cliente = false, idioma = null } = {}) {
    const datos = m.datosCortex(root, { cliente, ahora: AHORA });
    const file = path.join(root, cliente ? 'cliente.html' : (idioma ? `i-${idioma}.html` : 'index.html'));
    fs.writeFileSync(file, htmlCortex(datos, { cli: null, idioma }));
    return { file, datos };
}

// Proyecto RICO: varias zonas, un término buscable único ("Netlify"), y actividad para que haya pensamientos.
const RICO = proyecto(g => {
    g({ dimension: 'proyecto.nombre', valor: 'Ceramicas Lucia' });
    g({ dimension: 'proyecto.hosting', valor: 'Netlify', claves: ['hosting', 'host'], _t: 5 });
    g({ dimension: 'proyecto.pagos', valor: 'Stripe con webhooks', claves: ['pagos'], _t: 6 });
    g({ dimension: 'objetivo.ventas', valor: 'Vender 200 piezas al mes', _t: 20 });
    g({ dimension: 'objetivo.lanzamiento', valor: 'Abrir en primavera', _t: 18 });
    g({ dimension: 'restriccion.carruseles', valor: 'Nada de carruseles en la home', _t: 12 });
    g({ dimension: 'restriccion.idioma', valor: 'Codigo y commits en espanol', _t: 12 });
    g({ dimension: 'restriccion.accesibilidad', valor: 'AA minimo en todo', _t: 11 });
    g({ dimension: 'identidad.nombre', valor: 'Lucia Ferrer', alcance: 'usuario', _t: 30 });
    g({ dimension: 'pendiente.fotos', valor: 'Faltan las fotos de otono', _t: 2 });
    g({ dimension: 'aprendizaje.webhooks', valor: 'Webhooks duplicados: idempotencia', _t: 1 });
});
// registrar algo de uso para que la "actividad" (pensamientos) exista
try {
    const uso = m.rutaUso ? m.rutaUso(RICO) : path.join(RICO, 'senzu', 'uso.jsonl');
    fs.mkdirSync(path.dirname(uso), { recursive: true });
    fs.appendFileSync(uso, JSON.stringify({ t: T(1), origen: 'recuerdo', consulta: 'hosting', items: [{ fuente: 'hecho', id: 'x', usado: true }] }) + '\n');
} catch { /* opcional */ }

const VACIO = proyecto(() => { });
const UNO = proyecto(g => g({ dimension: 'proyecto.nombre', valor: 'Solo uno' }));
const FAMS = ['proyecto', 'objetivo', 'pendiente', 'restriccion', 'nota', 'hecho', 'aprendizaje'];
const ENORME = proyecto(g => { for (let i = 0; i < 800; i++) g({ dimension: `${FAMS[i % FAMS.length]}.item${i}`, valor: `recuerdo numero ${i} con texto de relleno`, _t: i % 60 }); });
const RAROS = proyecto(g => {
    g({ dimension: 'proyecto.nombre', valor: 'Raros 🧠' });
    g({ dimension: 'nota.emoji', valor: 'soporte emoji 🚀🔥✨ y acentos aeiou' });
    g({ dimension: 'nota.rtl', valor: 'مرحبا بالعالم نص عربي' });
    g({ dimension: 'nota.inyeccion', valor: '</script><img src=x onerror="window.__roto=1"> fin' });
});

// ---- medición de píxeles del canvas 3D ----
let casos = 0, fallos = 0;
const ok = (c, n, d = '') => { casos++; if (!c) { fallos++; process.stdout.write(`FALLO ${n}${d ? ' -> ' + d : ''}\n`); } };

const a3D = async p => { const b = await p.$('[data-ir="3d"]'); if (b) await b.click(); await p.waitForTimeout(2600); };
// estadística del canvas: píxeles con alpha, suma de brillo, pico, centroide, y conteo de píxeles "muy brillantes"
const stats = p => p.evaluate(() => {
    const c = document.getElementById('lienzo3d'); if (!c || !c.width) return null;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0, suma = 0, pico = 0, sx = 0, sy = 0, brillantes = 0;
    const w = c.width;
    for (let i = 0; i < d.length; i += 4) {
        const a = d[i + 3]; if (!a) continue;
        const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) * (a / 255);
        n++; suma += lum; if (lum > pico) pico = lum;
        if (lum > 160) brillantes++;
        const px = (i / 4) % w, py = (i / 4 / w) | 0; sx += px; sy += py;
    }
    return { n, suma, pico, brillantes, cx: n ? sx / n : 0, cy: n ? sy / n : 0, area: c.width * c.height, w: c.width, h: c.height };
});

const nav = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const errores = [];
async function pagina(w, h) {
    const p = await nav.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1.5 });
    p._errs = [];
    p.on('console', m => { if (m.type() === 'error') p._errs.push(m.text()); });
    p.on('pageerror', e => p._errs.push('PAGEERROR ' + e.message));
    return p;
}

// (A) render en 6 idiomas: 3D, sin error de consola, y el canvas pinta
for (const idi of ['es', 'en', 'pt', 'fr', 'de', 'it']) {
    const { file } = htmlDe(RICO, { idioma: idi });
    const p = await pagina(1440, 900);
    await p.goto(pathToFileURL(file).href, { waitUntil: 'networkidle' });
    await a3D(p);
    const s = await stats(p);
    ok(p._errs.length === 0, `A idioma ${idi}: sin errores de consola`, p._errs.slice(0, 3).join(' | '));
    ok(s && s.n > 300, `A idioma ${idi}: el cerebro 3D se pinta`, s ? `n=${s.n}` : 'sin canvas');
    await p.close();
}

// (B) datos límite: carga, 3D, sin error, sin desborde horizontal, y el </script> no ejecutó
for (const [nom, root, minN] of [['vacio', VACIO, 0], ['uno', UNO, 0], ['enorme', ENORME, 2000], ['raros', RAROS, 50]]) {
    const { file } = htmlDe(root, {});
    const p = await pagina(390, 820);
    await p.goto(pathToFileURL(file).href, { waitUntil: 'networkidle' });
    await a3D(p);
    const s = await stats(p);
    ok(p._errs.length === 0, `B ${nom}: sin errores de consola`, p._errs.slice(0, 3).join(' | '));
    ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `B ${nom}: sin desborde horizontal (movil)`);
    ok(s != null, `B ${nom}: el canvas existe y no revienta`);
    if (minN > 0) ok(s && s.n >= minN, `B ${nom}: densidad acorde al volumen`, s ? `n=${s.n}` : 'nulo');
    if (nom === 'raros') ok(await p.evaluate(() => !window.__roto), 'B raros: el </script> inyectado NO se ejecuta (escapado)');
    await p.close();
}

// (C) el cerebro se pinta "de verdad": ni lienzo vacío ni saturado, y centrado
{
    const { file } = htmlDe(RICO, {});
    const p = await pagina(1440, 900);
    await p.goto(pathToFileURL(file).href, { waitUntil: 'networkidle' });
    await a3D(p);
    const s = await stats(p);
    const ratio = s ? s.n / s.area : 0;
    ok(ratio > 0.003, 'C: el canvas no esta en blanco', `ratio=${ratio.toFixed(4)}`);
    ok(ratio < 0.6, 'C: el canvas no esta saturado', `ratio=${ratio.toFixed(4)}`);
    ok(s && Math.abs(s.cx - s.w / 2) < s.w * 0.28, 'C: centro de masa X dentro de la silueta', s ? `cx=${(s.cx / s.w).toFixed(2)}` : '');
    ok(s && Math.abs(s.cy - s.h / 2) < s.h * 0.32, 'C: centro de masa Y dentro de la silueta', s ? `cy=${(s.cy / s.h).toFixed(2)}` : '');
    await p.close();
}

// (D) foco de búsqueda (F11-T1) por diffing de frames
{
    const { file } = htmlDe(RICO, {});
    const p = await pagina(1440, 900);
    await p.goto(pathToFileURL(file).href, { waitUntil: 'networkidle' });
    await a3D(p);
    const prom = async () => { let acc = null; for (let i = 0; i < 3; i++) { const s = await stats(p); if (s) acc = acc ? { suma: acc.suma + s.suma, brillantes: acc.brillantes + s.brillantes, n: s.n } : { ...s }; await p.waitForTimeout(120); } return acc; };
    const base0 = await prom();
    // término que EXISTE: "netlify"
    await p.fill('#buscar', 'netlify'); await p.waitForTimeout(1600);
    const foco = await prom();
    ok(base0 && foco && foco.suma < base0.suma * 0.92, 'D existe: el resto se ATENUA (brillo global baja)', base0 && foco ? `base=${(base0.suma | 0)} foco=${(foco.suma | 0)}` : '');
    ok(foco && foco.brillantes > 0, 'D existe: hay nodos ENCENDIDOS (pico brillante)', foco ? `brillantes=${foco.brillantes}` : '');
    // término que NO existe: no debe encender nada falso
    await p.fill('#buscar', 'zzqqxx-no-existe'); await p.waitForTimeout(1600);
    const vacio = await prom();
    ok(vacio && base0 && vacio.suma < base0.suma * 0.95, 'D inexistente: todo atenuado, nada encendido falso', vacio && base0 ? `base=${(base0.suma | 0)} vac=${(vacio.suma | 0)}` : '');
    // limpiar: vuelve cerca de la base
    await p.fill('#buscar', ''); await p.waitForTimeout(1600);
    const vuelta = await prom();
    ok(vuelta && base0 && vuelta.suma > base0.suma * 0.6, 'D limpiar: al vaciar vuelve el brillo ambiental', vuelta && base0 ? `base=${(base0.suma | 0)} vuelta=${(vuelta.suma | 0)}` : '');
    await p.close();
}

// (E) presupuesto de frame en móvil (coste medio de rAF)
{
    const { file } = htmlDe(RICO, {});
    const p = await pagina(390, 820);
    await p.goto(pathToFileURL(file).href, { waitUntil: 'networkidle' });
    await a3D(p);
    const ms = await p.evaluate(() => new Promise(res => {
        let prev = performance.now(), n = 0, suma = 0;
        function paso(t) { const dt = t - prev; prev = t; if (n > 0) suma += dt; if (++n > 30) return res(suma / (n - 1)); requestAnimationFrame(paso); }
        requestAnimationFrame(paso);
    }));
    ok(ms < 45, 'E movil: coste medio de frame bajo presupuesto', `~${ms.toFixed(1)}ms/frame`);
    await p.close();
}

// (F) paridad y privacidad de la vista cliente
{
    const { file: fRico } = htmlDe(RICO, {});
    const { file: fCli, datos: dCli } = htmlDe(RICO, { cliente: true });
    const htmlCli = fs.readFileSync(fCli, 'utf8');
    ok(!htmlCli.includes('Lucia Ferrer'), 'F cliente: no filtra datos privados (alcance usuario)');
    ok(dCli.zonas.temporal.length === 0, 'F cliente: datosCortex no incluye zona temporal');
    const p = await pagina(1440, 900);
    await p.goto(pathToFileURL(fRico).href, { waitUntil: 'networkidle' });
    const chips2d = await p.evaluate(() => document.querySelectorAll('.chips [data-region]').length);
    await a3D(p);
    const chips3d = await p.evaluate(() => document.querySelectorAll('.chips [data-region]').length);
    ok(chips2d === chips3d && chips2d >= 4, 'F: mismas zonas en 2D y 3D', `2d=${chips2d} 3d=${chips3d}`);
    // en la vista cliente NO se renderiza el chip de la zona temporal (filtrado en plantilla)
    await p.goto(pathToFileURL(fCli).href, { waitUntil: 'networkidle' });
    const chipTemporal = await p.evaluate(() => !!document.querySelector('.chips [data-region="temporal"]'));
    ok(!chipTemporal, 'F cliente: no se renderiza el chip de la zona temporal');
    await p.close();
}

await nav.close();
process.stdout.write(`\nCortex visual -> Casos: ${casos}  Fallos: ${fallos}\n`);
process.exit(fallos ? 1 : 0);
