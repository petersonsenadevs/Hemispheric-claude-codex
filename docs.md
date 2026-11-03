# Hemispheric — Documentation

> **Your agent, with a memory of its own — and it never leaves your machine.**
>
> For developers who use AI coding agents (Claude Code, Codex) and are tired of them **forgetting everything** between
> sessions, Hemispheric is a **deterministic memory** that lives in a local file you control — no embeddings, no server,
> no API keys. Unlike cloud memories (mem0, Zep), **yours never leaves your machine**.

This is the narrative documentation (the same as the website `/docs`). For the quick reference of structure and
commands, see the [`README.md`](./README.md).

## What it is

Agents forget everything between sessions. Hemispheric is the memory that **remembers** your people and your projects,
in a single local file you own. It is **deterministic** (same input, same result), **offline** (no network) and
**zero-dependency**. Unlike cloud memories, yours stays yours.

## Install

In Claude Code, from the project root:

```
npx hemispheric install --claude     # register the hooks in the project's .claude/settings.json
npx hemispheric install --global     # for every project (~/.claude/settings.json)
npx hemispheric uninstall            # remove Hemispheric's hooks (leaves everything else intact)
npx hemispheric install --dry-run    # show what it would do, without writing
```

Merge-safe (it never overwrites your hooks or permissions) and idempotent. It creates `.hemispheric/` (project memory)
and, if requested, `~/.config/hemispheric/` (global user memory).

**Codex**: the user installs it from the Codex app (via plugin), not from the CLI. The agent does not install on Codex.

## How it works

1. **Capture.** A `PostToolUse` hook reads each exchange and extracts facts (decisions, paths, project context).
2. **Store.** Each fact lands in a lightweight local graph with its name, date and links. The whole Cortex is one file.
3. **Retrieve.** A query activates the matching node and spreads one hop out (two-hop activation), surfacing related
   facts — no semantic search, no embedding model. Instant.

## The memory

Think of it as a notebook your agent keeps for you — but it only writes down what is **stable**: decisions, the
project's stack, who you are, your preferences, your goals. Passing chatter is ignored. When something changes, the new
value **replaces** the old one (the old one is kept, dated, in the history), so your agent never works from something
you already changed. Recall is deterministic: same question, same answer.

There are two kinds of memory, and they never get mixed up:

- **Project memory** — about the project (stack, client, decisions, deadlines). Lives in `.hemispheric/` in the project
  folder, so the team and Codex share it. "The stack is Next" is true no matter who said it.
- **Your memory** — about you (who you are, how you like to work), carried across every project. Lives on your machine
  (`~/.config/hemispheric/`), private to you, never committed. Your agent recalls both at once.

## Teams — one project, many people

When several people work on the same project, the shared memory keeps each person's **personal** facts separate: if Ana
prefers Vim and Bob prefers Emacs, both are kept and neither overwrites the other. Facts that describe the **project
itself** (stack, decisions) stay shared and have no owner. You configure nothing — the author is read from your `git`
email (or your system user), with no network. For a solo developer it's invisible; it just works.

## The Cortex

The Cortex draws everything your agent knows as a **brain of points** — one glow per fact. Each kind of memory settles
in its own zone (decisions, goals, project facts, who you are, what was lived). Search a fact and only its node and
connections light up, like a neuron firing. It is not a picture: it is a readout of the memory the agent actually uses.
Generate it with `node cli/memory.mjs --cortex` (local HTML, no network).

## Hosts

The engine detects where it runs and adapts; the memory is the same underneath.

- **Claude Code** — the hooks register in the project settings; capture after every tool call.
- **Codex** — runs through the plugin path; the same brain, the same local file.
- **Standalone** — a plain CLI for any project: read, write and search the memory directly.

## License

**Free for personal and noncommercial use** under **PolyForm Noncommercial 1.0.0**. Zero telemetry — your memory lives
in local files you own. Using Hemispheric inside a company or a paid product needs a **commercial license**: see
[`COMMERCIAL.md`](./COMMERCIAL.md) (petersonsena24@gmail.com). © 2026 Peterson Sena.

## FAQ

**Does my data ever leave my machine?** No. The memory is a local file you own. No server, no cloud, no API key, no
telemetry. It runs entirely offline.

**How is this different from mem0 or Zep?** Those store your memory in their cloud behind an API. Hemispheric keeps
everything local and deterministic — same input, same result, no embeddings or vector database.

**Do I need an embedding model or a vector database?** No. Facts are stored in a lightweight local graph and retrieved
by name, date and relevance with two-hop activation.

**Which agents does it work with?** Claude Code and Codex today, plus a standalone CLI. The engine detects its host and
adapts; the memory is the same underneath.

**Is it free?** Free for personal and noncommercial use (PolyForm Noncommercial). Inside a company or a paid product it
needs a commercial license.
