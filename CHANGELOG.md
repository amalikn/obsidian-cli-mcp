# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Starting from v0.2.0, changelogs are auto-generated from conventional commits on each GitHub Release.

## [Unreleased]

### Changed

- Added explicit runtime profiles with `governed-readonly` as the default safe surface and `personal-unrestricted` as the compatibility profile.
- Moved tool exposure behind a centralized profile-aware registry so governed-readonly excludes mutating, runtime-state, and execute/eval tools by default.
- Hardened HTTP transport defaults to remain opt-in and bind loopback-only unless the operator explicitly overrides the host.
- Governed-readonly startup now requires `OBSIDIAN_VAULT` and disables per-call vault overrides to reduce vault-selection ambiguity.
- Added a separate `governed-mutation` profile with a narrow exact-path mutation surface for note creation, append/prepend, and property mutation.
- Added governed vault policy enforcement via `OBSIDIAN_VAULT_ROOT` and `OBSIDIAN_POLICY_FILE`, including canonical path checks, write allowlists, denylist enforcement, hidden path denial, and optional symlink blocking.
- Hardened governed HTTP startup so authenticated bearer tokens are required for governed HTTP and for any remote bind request; unsafe bind paths now fail closed unless `MCP_HTTP_ALLOW_REMOTE_BIND=true` is set explicitly.
- Added policy-filtered governed discovery for search, search-with-context, outgoing links, and backlinks so governed profiles can review notes without broad vault enumeration or blocked-path leakage.
- Added governed template and promotion workflows for review notes, promotion candidates, curated notes, and promotion logs using approved template types under `00_system/templates`.
- Extended the governed vault policy model with discovery roots, template allowlists, template type mappings, and workflow routing rules for review and promotion-safe note creation.

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
