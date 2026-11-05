# Changelog

All notable changes to **Corvusmem** are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/); versions follow [SemVer](https://semver.org/).

## [Unreleased]
### Changed
- **Standalone context is now memory-only and English-first.** When Corvusmem is installed on its own, the
  `SessionStart` hook injects **only memory** (facts, open goals/todos, obsolescence/contradiction notices, the memory
  map and last-session continuity) — the work-method block (plan, skills, devlog, stack, design system, conventions)
  is gone. Output defaults to **English** via the message catalog (`CORVUS_LANG`/marker `lang` switch it back to
  Spanish), including the memory-map **zone names**. The per-message recall hook is rebranded `[Corvusmem]` and
  in-context hints now use `npx corvusmem`.
- **Family labels shown in English** (`identity`, `preference`, `project`, `goal`, `pending`, `constraint`, `note`,
  `fact`, `learning`, `link`) in the CLI and the injected context. The internal canonical keys and the `.jsonl` files
  are unchanged, and input still accepts both English and Spanish family names.

## [0.1.3] — 2026-11-04
### Added
- README: badges (npm, node, zero-deps, offline, license), a **Why Corvusmem** list, a **Usage** section with the
  everyday commands, and Website/Docs/Benchmarks/npm links.
### Changed
- Docs (README + `docs.md`): clarified that **per-project vs global only decides where the hooks turn on**, not where
  memory lives (project facts always land in the repo's `.corvusmem/`), plus a **team-sharing recipe** (commit
  `.corvusmem/` and, for a per-project install, `.claude/settings.json`; never commit `~/.config/corvusmem/`).

## [0.1.2] — 2026-11-03
### Fixed
- `homepage` points to the live site `https://corvusmem.vercel.app` (the `.com` domain isn't registered yet).

## [0.1.1] — 2026-11-03
### Fixed
- `LICENSE` now names **Corvusmem** (the rename had missed it — it was still "Hemispheric").
- `repository`, `bugs` and the README crow image point to `petersonsenadevs/corvusmem`.
### Added
- Release flow: `test:core` (deterministic suites, no browser) + `preversion`/`prepublishOnly` gates, and this CHANGELOG.

## [0.1.0] — 2026-11-03
### Added
- First public release: **deterministic, offline, zero-dependency memory** for AI coding agents (Claude Code, Codex) and a standalone CLI.
- `corvusmem install` / `corvusmem uninstall` — merge-safe and idempotent; registers the brain hooks (capture, recall, session memory).
- **Facts engine**: dated substitution, two-hop recall, keys in any language, and **per-author memory** so teammates on a shared project don't overwrite each other.
- **The Cortex**: your memory as a local HTML brain (`corvusmem --cortex`); offline, and it follows the host page's light/dark theme.
- **Dual license**: PolyForm Noncommercial (free for noncommercial use) + a separate paid commercial license (`COMMERCIAL.md`).

---

<!--
Releasing a new version:
  1. Move the notes under "## [Unreleased]" into a new "## [x.y.z] — YYYY-MM-DD" section.
  2. npm version patch | minor | major     (bumps package.json, runs test:core, creates a git tag)
  3. git push --follow-tags
  4. npm publish --access public            (runs test:core first via prepublishOnly)
SemVer: patch = fix · minor = backwards-compatible feature · major = breaking change.
-->
