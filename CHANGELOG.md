# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Starting from v0.2.0, changelogs are auto-generated from conventional commits on each GitHub Release.

## [0.1.0] — 2026-03-05

### Added

- **78 semantic MCP tools** covering the full Obsidian CLI command surface:
  - Notes: read, create, delete, move, rename, append, prepend, outline, wordcount, file info, diff, eval
  - Vault: info, list files, list folders, list vaults, version, recent files, random read, aliases
  - Search: full-text search, search with context
  - Frontmatter: list, get, set, remove properties
  - Tags: list tags, get notes by tag
  - Links: outgoing, backlinks, orphans, dead ends, unresolved
  - Daily notes: read, append, prepend, get path
  - Tasks: list, toggle
  - Templates: list, read, insert
  - Bookmarks: list, add
  - Plugins: list all, list enabled, get, enable, disable, install, uninstall
  - History: list versions, read version, restore version
  - Sync: status, history, read, restore, deleted
  - Bases: list, query, list views, create item
  - Workspace: get layout, list tabs
  - Commands: list, execute, list hotkeys, get hotkey
  - Themes: list, get, set, install, uninstall
  - Snippets: list all, list enabled, enable, disable
- `stdio` and Streamable HTTP transports
- Automatic ENV injection (`HOME`, `TMPDIR`, `USER`) for MCP client compatibility
- `spawn`-based CLI wrapper — preserves stdout even when Electron crashes
- Full unit test suite (294 tests)
- GitHub Actions CI/CD (lint, build, test, release)
