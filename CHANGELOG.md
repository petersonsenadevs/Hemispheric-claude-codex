# Changelog

All notable changes to **Corvusmem** are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/); versions follow [SemVer](https://semver.org/).

## [Unreleased]

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
