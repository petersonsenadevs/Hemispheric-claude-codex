# Hemispheric — Documentación

> **Tu agente, con memoria propia — y que nunca sale de tu máquina.**
>
> Para desarrolladores que usan agentes de IA (Claude Code, Codex) y están hartos de que **olviden todo** entre
> sesiones, Hemispheric es una **memoria determinista** que vive en un archivo local que tú controlas —sin embeddings,
> sin servidor, sin API keys—. A diferencia de las memorias en la nube (mem0, Zep), **la tuya no sale de tu máquina**.

Esta es la documentación narrativa (la misma que la web `/docs`). Para la referencia rápida de estructura y comandos,
ver el [`README.md`](./README.md).

## Qué es

Los agentes olvidan todo entre sesiones. Hemispheric es la memoria que **recuerda** a su gente y sus proyectos, en un
solo archivo local que posees. Es **determinista** (misma entrada, mismo resultado), **offline** (sin red) y **sin
dependencias**. A diferencia de las memorias en la nube, la tuya sigue siendo tuya.

## Instalar

En Claude Code, desde la raíz del proyecto:

```
node install.mjs                 # registra los hooks en .claude/settings.json del proyecto
node install.mjs --global        # para todos los proyectos (~/.claude/settings.json)
node install.mjs --uninstall     # quita los hooks de Hemispheric (deja intacto lo demás)
node install.mjs --dry-run       # enseña lo que haría, sin escribir
```

Merge-safe (no pisa tus hooks ni tus permisos) e idempotente. Crea `.hemispheric/` (memoria del proyecto) y, si se
pide, `~/.config/hemispheric/` (memoria global del usuario).

**Codex**: la instalación la hace el usuario desde la app de Codex (vía plugin), no desde la CLI. El agente no instala
en Codex.

## Cómo funciona

1. **Captura.** Un hook `PostToolUse` lee cada intercambio y extrae hechos (decisiones, rutas, contexto del proyecto).
2. **Guardado.** Cada hecho cae en un grafo local ligero con su nombre, fecha y enlaces. Toda la Cortex es un archivo.
3. **Recuerdo.** Una consulta activa el nodo que coincide y se extiende un salto (activación a dos saltos), sacando a
   flote los hechos relacionados — sin búsqueda semántica ni modelo de embeddings. Al instante.

## La Cortex

La Cortex dibuja todo lo que tu agente sabe como un **cerebro de puntos** —un brillo por hecho—. Cada tipo de memoria
se asienta en su zona (decisiones, objetivos, hechos del proyecto, quién eres, lo vivido). Al buscar un dato se
encienden solo su nodo y sus conexiones, como una neurona disparándose. No es una foto: es una lectura de la memoria
que el agente usa de verdad. Se genera con `node cli/memoria.mjs --cortex` (HTML local, sin red).

## Anfitriones

El motor detecta dónde corre y se adapta; la memoria es la misma por debajo.

- **Claude Code** — los hooks se registran en los ajustes del proyecto; captura tras cada llamada de herramienta.
- **Codex** — corre por la vía de plugin; el mismo cerebro, el mismo archivo local.
- **Standalone** — una CLI simple para cualquier proyecto: lee, escribe y busca la memoria directamente.

## Licencia

Uso **personal y no comercial gratis** bajo **PolyForm Noncommercial 1.0.0**. Cero telemetría — tu memoria vive en
archivos locales que posees. Usar Hemispheric dentro de una empresa o un producto de pago necesita una **licencia
comercial**: ver [`COMMERCIAL.md`](./COMMERCIAL.md) (petersonsena24@gmail.com). © 2026 Peterson Sena.

## FAQ

**¿Mis datos salen de mi máquina?** No. La memoria es un archivo local que posees. Sin servidor, sin nube, sin API
key, sin telemetría. Funciona entera offline.

**¿En qué se diferencia de mem0 o Zep?** Esos guardan tu memoria en su nube tras una API. Hemispheric lo mantiene todo
local y determinista — misma entrada, mismo resultado, sin embeddings ni base vectorial.

**¿Necesito un modelo de embeddings o una base vectorial?** No. Los hechos se guardan en un grafo local ligero y se
recuperan por nombre, fecha y relevancia con activación a dos saltos.

**¿Con qué agentes funciona?** Claude Code y Codex hoy, más una CLI standalone. El motor detecta su anfitrión y se
adapta; la memoria es la misma por debajo.

**¿Es gratis?** Gratis para uso personal y no comercial (PolyForm Noncommercial). Dentro de una empresa o un producto
de pago necesita licencia comercial.
