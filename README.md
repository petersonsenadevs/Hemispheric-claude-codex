<p align="center">
  <img src="https://raw.githubusercontent.com/petersonsenadevs/corvusmem/main/assets/crow.png" alt="Corvusmem — the crow that remembers" width="200" />
</p>

# Corvusmem

<p align="center">
  <a href="https://www.npmjs.com/package/corvusmem"><img src="https://img.shields.io/npm/v/corvusmem?color=e07a33" alt="npm version" /></a>
  <img src="https://img.shields.io/node/v/corvusmem" alt="node" />
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen" alt="zero dependencies" />
  <img src="https://img.shields.io/badge/offline-yes-brightgreen" alt="offline" />
  <img src="https://img.shields.io/badge/license-PolyForm%20NC-blue" alt="license" />
</p>

**Deterministic, offline, zero-dependency memory for AI coding agents.** Corvusmem stores the stable facts your
agent learns, replaces and dates them, and recalls them the same way every time — in any language, with no network
and no servers. It plugs into where you already work: Claude Code / Codex (hooks) and a standalone CLI.

🌐 [Website](https://corvusmem.vercel.app) · 📖 [Docs](https://corvusmem.vercel.app/docs) · 📊 [Benchmarks](https://corvusmem.vercel.app/benchmarks) · 📦 [npm](https://www.npmjs.com/package/corvusmem)

> **Narrative docs (what it is, the message, the Cortex, FAQ):** [`docs.md`](./docs.md). This README is the quick
> reference for structure and commands.

## Why Corvusmem
- **Deterministic** — same input, same result. No embeddings, no vector database, no model to run recall.
- **Offline & private** — the memory is a plain file you own. No server, no cloud, no API key, no telemetry.
- **Zero-dependency** — pure Node, identical on Windows, macOS and Linux.
- **Any language** — keys and values in any language; recall is language-agnostic.
- **Per-author** — on a shared project, teammates' personal facts never overwrite each other.
- **Bounded footprint** — a hard cap keeps the context cost flat (O(1), not O(n)) — see the [benchmarks](https://corvusmem.vercel.app/benchmarks).
- **See it** — the Cortex draws your whole memory as a local HTML brain.

## How it works
Your agent forgets everything between sessions. Corvusmem is a memory it keeps: facts live in a lightweight local
graph, retrieved by name, date and relevance with two-hop activation — no embeddings, no vector database, no API key.
Same input, same result. The whole memory is a file you own.

## Structure
- `src/` — the core: the facts engine (`facts.mjs`), shared base (`lib`, `messages`, `session-end`), host detection
  (`host.mjs`) and the brain hooks (`live-recall`, `session-start`, `session-state`, `live-memory`,
  `file-memory`, `facts-guard`). Same-directory imports only: self-contained, zero external dependencies.
- `cli/` — `memory.mjs`: the command line (`--save` / `--search` / `--recall` / `--context` / `--cortex`).
- `cortex/` — `cortex.mjs` + `cortex-text.mjs`: your memory as a local HTML page (the "Cortex"), no network.
- `tests/` — deterministic, LLM-free suites: `test-boundary` (clean core), `test-facts` (engine), `test-hard-recall`.

## Install
```
npx corvusmem install --claude     # register the hooks in the current project's .claude/settings.json
npx corvusmem install --global     # for every project (~/.claude/settings.json)
npx corvusmem uninstall            # remove Corvusmem's hooks (leaves everything else intact)
npx corvusmem install --dry-run    # show what it would do, without writing
```
Merge-safe (it never overwrites your hooks or permissions) and idempotent. It creates `.corvusmem/` (project
memory) and `~/.config/corvusmem/` (global memory), and writes `.corvusmem/hooks.json` (a portable manifest).

**Per-project vs global only decides *where the hooks turn on*** — for one repo (`--claude`, config in that repo) or
for every project (`--global`, in your home). It does **not** change where memory lives: project facts always land in
that repo's `.corvusmem/`, your personal facts in `~/.config/corvusmem/`. You never need a per-project install just to
keep memory in the repo — that happens either way.

**Sharing with a team**: commit `.corvusmem/` (the shared project memory) and, for a per-project install,
`.claude/settings.json` so teammates get the hooks the moment they clone. Never commit `~/.config/corvusmem/` — that is
your private memory.

**Codex**: the hooks run through the plugin path (a marketplace in `~/.codex/config.toml`), not the project
`settings.json`. Publish it to a Codex marketplace, install it and approve the hooks in the app. On Claude Code they
are active right away.

## Usage
Once installed, the agent captures and recalls memory on its own — you don't do a thing. To look at it or steer it:
```
npx corvusmem --cortex                     # your whole memory as a local HTML brain (offline)
npx corvusmem --recall "stripe webhook"    # ask what it already knows, from the terminal
npx corvusmem --list                       # list every fact
npx corvusmem --save --dimension project.stack --value "Astro + Tailwind" --scope project
npx corvusmem --forget <id>                # drop one fact
```
The Cortex also takes `--client` (a shareable view with nothing private), `--output <dir>` and `--lang en|es|…`.
Flags are English with Spanish aliases (`--save`/`--guardar`, `--recall`/`--recordar`); keys and values work in any
language — the memory is language-agnostic.

## Test
```
npm test
```
(or `node tests/test-boundary.mjs && node tests/test-facts.mjs && node tests/test-hard-recall.mjs`)

## License
Dual-licensed (© 2026 Peterson Sena):
- **Noncommercial use** (personal, study, hobby, nonprofit, education/public sector): free under **PolyForm
  Noncommercial 1.0.0** (`LICENSE`), keeping the credit (`Required Notice`).
- **Commercial use**: requires a separate **paid license** — see `COMMERCIAL.md` (petersonsena24@gmail.com).

This is not legal advice; for final commercial terms, consult a professional.
