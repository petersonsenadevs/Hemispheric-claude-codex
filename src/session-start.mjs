// Hook SessionStart (Corvusmem): inyecta SOLO la memoria del proyecto y del usuario — hechos vigentes, objetivos y
// pendientes abiertos, avisos de contradicción/obsolescencia, el mapa de la memoria y la continuidad de la sesión
// anterior. Por defecto en inglés (localeUI → catálogo messages.mjs). No bloquea.
// El MÉTODO de trabajo (plan, skills, devlog, stack, design system, convenciones…) NO vive aquí: eso es del anfitrión
// (p. ej. Senzu), no del motor de memoria. Corvusmem instalado solo habla de memoria y nada más.

import {
    readHookInput, projectRoot, outHookJson, leerUltimaSesion, localeUI, msg,
} from './lib.mjs';
import { contextoHechos, decisionesObsoletas, abiertos, FAMILIAS_CICLO, contradicciones, mapaMemoria, textoMapa, etiquetaDimension } from './facts.mjs';
import { reclamarInyeccion } from './host.mjs';

const p = readHookInput() || {};
const root = projectRoot();
// Apretón de manos (F9-T3): si otra capa (núcleo/anfitrión) ya reclamó el arranque de esta sesión, cedo.
if (!reclamarInyeccion('SessionStart', { input: p, root }).inyectar) process.exit(0);
const lang = localeUI(root);
const L = [];
// Los valores son DATOS: entre comillas, en una línea y recortados (un hecho que dijera «ignora las reglas» no puede
// colarse como instrucción).
const citar = v => '«' + String(v).replace(/[\r\n\t]+/g, ' ').replace(/[«»]/g, '"').trim().slice(0, 160) + (String(v).length > 160 ? '…' : '') + '»';
const cli = 'npx corvusmem';
try {
    // Memoria de HECHOS (motor determinista, cualquier idioma): lo vigente por familias (objetivos y pendientes, abajo).
    const hechos = contextoHechos(root, { presupuesto: 12 }).filter(h => !FAMILIAS_CICLO.test(h.dimension));
    if (hechos.length) {
        L.push(msg('start.facts.intro', lang));
        for (const h of hechos) L.push('    · [' + etiquetaDimension(h.dimension, lang) + '] ' + citar(h.valor)
            + (h.devlog ? ` · ${msg('start.see', lang)} ${h.devlog}` : '')
            + (h.alcance === 'usuario' ? msg('start.facts.userScope', lang) : ''));
    }
    // Objetivos y pendientes ABIERTOS, los más antiguos primero: lo que lleva tiempo abierto es lo que se olvida.
    const ab = abiertos(root);
    if (ab.length) {
        L.push(msg('start.open.intro', lang, { n: ab.length }));
        for (const h of ab.slice(0, 5)) {
            const dias = Math.max(0, Math.floor((Date.now() - Date.parse(h.creado)) / 864e5));
            L.push(msg('start.open.item', lang, { dim: etiquetaDimension(h.dimension, lang), val: citar(h.valor), dias, encurso: h.progreso === 'en-curso' ? msg('start.open.inProgress', lang) : '' }));
        }
    }
    // Decisiones de la memoria que se quedaron con un valor ya sustituido.
    for (const o of decisionesObsoletas(root)) L.push(msg('start.obsolete', lang, { decision: o.decision, viejo: citar(o.valorViejo), dim: etiquetaDimension(o.dimension, lang), nuevo: citar(o.valorNuevo) }));
    // Lo que choca en la memoria se pregunta al usuario en cuanto venga al caso.
    for (const c of contradicciones(root)) {
        if (c.tipo === 'valores') L.push(msg('start.contradiction', lang, { dim: etiquetaDimension(c.dimension, lang), items: c.hechos.map(h => `${citar(h.valor)}${h.estado === 'dudoso' ? ` (${msg('start.doubtful', lang)})` : ''} [${h.id}]`).join(' / '), cli }));
        else L.push(msg('start.sameData', lang, { items: c.hechos.map(h => `${etiquetaDimension(h.dimension, lang)} = ${citar(h.valor)} [${h.id}]`).join(' / '), comunes: c.comunes.slice(0, 3).join('», «') }));
    }
    // El agente tiene que SABER qué memoria tiene y cómo usarla, no solo recibir lo que coincide.
    const mapa = mapaMemoria(root);
    L.push(msg('start.map.intro', lang));
    L.push(mapa.hechos ? textoMapa(mapa) : msg('start.map.empty', lang));
    L.push(msg('start.map.consult', lang, { cli }));
    L.push(msg('start.map.save', lang, { cli }));
} catch { }
// En qué se quedó la sesión anterior (session-state): para seguir sin que el usuario tenga que contarlo.
const ant = leerUltimaSesion(root);
const sidActual = p && p.session_id ? String(p.session_id) : '';
if (ant && ant.sesion !== sidActual) {
    const partes = [];
    if (ant.peticiones && ant.peticiones.length) partes.push(msg('start.prev.asked', lang, { x: ant.peticiones.join('» → «') }));
    if (ant.editados && ant.editados.length) partes.push(msg('start.prev.touched', lang, { x: ant.editados.slice(-8).join(', ') }));
    if (ant.sinCommitear && ant.sinCommitear.length) partes.push(msg('start.prev.uncommitted', lang, { x: ant.sinCommitear.join(', ') }));
    if (ant.planEnCurso && ant.planEnCurso.length) partes.push(msg('start.prev.task', lang, { x: ant.planEnCurso.join('; ') }));
    if (Array.isArray(ant.hechosGuardados) && ant.hechosGuardados.length) partes.push(msg('start.prev.learned', lang, { x: ant.hechosGuardados.slice(0, 5).map(h => `[${h.dimension}] «${String(h.valor).replace(/[\r\n]+/g, ' ').slice(0, 60)}»`).join(', ') }));
    if (partes.length) L.push(msg('start.prev', lang, { when: String(ant.actualizado).slice(0, 16).replace('T', ' '), parts: partes.join(' · ') }));
}
outHookJson('SessionStart', { additionalContext: L.join('\n') });
process.exit(0);
