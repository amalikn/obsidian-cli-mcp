# obsidian-cli-mcp

MCP server for the [Obsidian CLI](https://github.com/obsidianmd/obsidian-cli) with explicit runtime profiles for governed and personal use. The default profile is `governed-readonly`; `governed-mutation` adds bounded template and promotion workflows on top of the read surface, and the broad legacy surface remains available only through an explicit `personal-unrestricted` profile.

## Requirements

- **[Obsidian](https://obsidian.md)** desktop app running (macOS, Linux, Windows)
- **Obsidian CLI** installed:
  - macOS / Linux (via Homebrew): `brew install obsidianmd/tap/obsidian`
  - Windows: see [Obsidian CLI releases](https://github.com/obsidianmd/obsidian-cli/releases)
- **Node.js 22+**

> **Platform notes:** Fully tested on macOS. Linux is supported via the same Homebrew tap (Linuxbrew). Windows support is untested — env var injection (`HOME`/`TMPDIR`) may behave differently; contributions welcome.

## Installation

No installation required — run directly with `npx`:

```bash
npx -y @joemugen/obsidian-cli-mcp
```

Or install globally:

```bash
npm install -g @joemugen/obsidian-cli-mcp
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `OBSIDIAN_BIN` | Path to the Obsidian CLI binary | `obsidian` |
| `OBSIDIAN_VAULT` | Default pinned vault name | required in governed profiles; optional in `personal-unrestricted` |
| `OBSIDIAN_VAULT_ROOT` | Canonical filesystem root of the pinned vault | required in governed profiles |
| `OBSIDIAN_POLICY_FILE` | JSON vault policy file | required in governed profiles |
| `MCP_PROFILE` | `governed-readonly`, `governed-mutation`, or `personal-unrestricted` | `governed-readonly` |
| `MCP_TRANSPORT` | `stdio` or `http` | `stdio` |
| `MCP_PORT` | HTTP port (when `MCP_TRANSPORT=http`) | `3000` |
| `MCP_HTTP_HOST` | HTTP bind host (when `MCP_TRANSPORT=http`) | `127.0.0.1` |
| `MCP_HTTP_AUTH_TOKEN` | Shared bearer token for HTTP auth | required for governed HTTP and any remote HTTP bind |
| `MCP_HTTP_ALLOW_REMOTE_BIND` | Explicit remote bind opt-in (`true`) | disabled by default |

> **Important (macOS):** always point `OBSIDIAN_BIN` to the Homebrew binary (`$(brew --prefix)/bin/obsidian`). The Homebrew binary flushes stdout to the pipe correctly; a plain app bundle symlink does not.

### Profiles

- `governed-readonly`
  - Safe default.
  - Registers exact-path note/property reads plus policy-filtered governed discovery (`obsidian_search`, `obsidian_search_context`, filtered links, filtered backlinks).
  - Requires `OBSIDIAN_VAULT`, `OBSIDIAN_VAULT_ROOT`, and `OBSIDIAN_POLICY_FILE`.
  - Disables per-call vault overrides.
- `governed-mutation`
  - Adds the exact-path mutation surface plus governed template and promotion helpers on top of `governed-readonly`.
  - Allows exact-path note/property edits and the governed workflow tools: `obsidian_create_note_from_template`, `obsidian_create_review_note`, `obsidian_create_promotion_candidate`, `obsidian_create_curated_note`, and `obsidian_log_promotion`.
  - Blocks rename, move, delete, task toggle, template insertion into the active note, daily mutation, plugin/theme/snippet mutation, runtime-state mutation, and execute/eval surfaces.
  - Requires the same pinned-vault and policy inputs as `governed-readonly`.
- `personal-unrestricted`
  - Compatibility profile for the full legacy surface, including mutating and developer-oriented tools.
  - Not the default.
  - Intended for controlled personal use, not governed deployment.

### Governed vault policy

Governed profiles enforce a real path policy before the Obsidian CLI is invoked:

- exact-path note/property operations only
- bounded discovery only inside configured `discoveryAllowlist` roots
- approved template reads only inside configured `templateAllowlist` roots
- workflow routing for review notes, promotion candidates, curated destinations, and promotion logs
- default deny for writes outside the configured write allowlist
- explicit denylist support
- hidden path and `.obsidian/**` denial by default
- canonical path normalization against the pinned `OBSIDIAN_VAULT_ROOT`
- optional symlink traversal denial

See [`examples/governed-vault-policy.example.json`](examples/governed-vault-policy.example.json) for a conservative second-brain example.

---

## Client Setup

### Claude Desktop

Edit the config file for your OS:

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "obsidian-cli": {
      "command": "npx",
      "args": ["-y", "@joemugen/obsidian-cli-mcp"],
      "env": {
        "MCP_PROFILE": "governed-readonly",
        "OBSIDIAN_BIN": "/opt/homebrew/bin/obsidian",
        "OBSIDIAN_VAULT": "MyVault",
        "OBSIDIAN_VAULT_ROOT": "/path/to/MyVault",
        "OBSIDIAN_POLICY_FILE": "/path/to/governed-vault-policy.json"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

---

### Claude Code

Add to your project's `.mcp.json` (or `~/.claude/mcp.json` for global):

```json
{
  "mcpServers": {
    "obsidian-cli": {
      "command": "npx",
      "args": ["-y", "@joemugen/obsidian-cli-mcp"],
      "env": {
        "MCP_PROFILE": "governed-readonly",
        "OBSIDIAN_BIN": "/opt/homebrew/bin/obsidian",
        "OBSIDIAN_VAULT": "MyVault",
        "OBSIDIAN_VAULT_ROOT": "/path/to/MyVault",
        "OBSIDIAN_POLICY_FILE": "/path/to/governed-vault-policy.json"
      }
    }
  }
}
```

Or add it directly from the CLI:

```bash
claude mcp add obsidian-cli --transport stdio \
  -e MCP_PROFILE=governed-readonly \
  -e OBSIDIAN_BIN=/opt/homebrew/bin/obsidian \
  -e OBSIDIAN_VAULT=MyVault \
  -e OBSIDIAN_VAULT_ROOT=/path/to/MyVault \
  -e OBSIDIAN_POLICY_FILE=/path/to/governed-vault-policy.json \
  -- npx -y @joemugen/obsidian-cli-mcp
```

---

### Cursor

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "obsidian-cli": {
      "command": "npx",
      "args": ["-y", "@joemugen/obsidian-cli-mcp"],
      "env": {
        "MCP_PROFILE": "governed-readonly",
        "OBSIDIAN_BIN": "/opt/homebrew/bin/obsidian",
        "OBSIDIAN_VAULT": "MyVault",
        "OBSIDIAN_VAULT_ROOT": "/path/to/MyVault",
        "OBSIDIAN_POLICY_FILE": "/path/to/governed-vault-policy.json"
      }
    }
  }
}
```

---

### Zed

Edit `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "obsidian-cli": {
      "command": {
        "path": "npx",
        "args": ["-y", "@joemugen/obsidian-cli-mcp"],
        "env": {
          "MCP_PROFILE": "governed-readonly",
          "OBSIDIAN_BIN": "/opt/homebrew/bin/obsidian",
          "OBSIDIAN_VAULT": "MyVault",
          "OBSIDIAN_VAULT_ROOT": "/path/to/MyVault",
          "OBSIDIAN_POLICY_FILE": "/path/to/governed-vault-policy.json"
        }
      }
    }
  }
}
```

---

### HTTP transport (network / multi-client)

```bash
MCP_PROFILE=governed-readonly MCP_TRANSPORT=http MCP_PORT=3000 \
MCP_HTTP_HOST=127.0.0.1 \
MCP_HTTP_AUTH_TOKEN=change-me \
OBSIDIAN_BIN=/opt/homebrew/bin/obsidian \
OBSIDIAN_VAULT=MyVault \
OBSIDIAN_VAULT_ROOT=/path/to/MyVault \
OBSIDIAN_POLICY_FILE=/path/to/governed-vault-policy.json \
node dist/index.js
```

The server exposes a Streamable HTTP endpoint at `http://localhost:3000/mcp`.

HTTP transport remains opt-in and is not the default deployment path. Phase 2 hardening is deliberately limited:

- loopback (`127.0.0.1`) remains the default bind
- governed HTTP requires `MCP_HTTP_AUTH_TOKEN`
- non-loopback bind requires `MCP_HTTP_ALLOW_REMOTE_BIND=true`
- remote bind without explicit opt-in fails closed
- this is controlled governed use, not an internet-safe deployment model

---

## Tools

The default `governed-readonly` profile registers only the bounded governed read and discovery surface. `governed-mutation` adds the exact-path note/property mutation tools plus the governed workflow tools listed below. The full legacy tool catalog remains available only when `MCP_PROFILE=personal-unrestricted` is set explicitly.

### Governed workflow tools

| Tool | Description |
|------|-------------|
| `obsidian_search` | Search only within policy-approved discovery roots with server-side result filtering |
| `obsidian_search_context` | Search with bounded context inside policy-approved discovery roots |
| `obsidian_list_links` | List outgoing links from an allowed note, filtering blocked targets server-side |
| `obsidian_list_backlinks` | List backlinks to an allowed note, filtering blocked sources server-side |
| `obsidian_create_note_from_template` | Create a note from an approved governed template type into an approved destination |
| `obsidian_create_review_note` | Create a provenance-preserving review note for an approved source note |
| `obsidian_create_promotion_candidate` | Create a provenance-preserving promotion-candidate note for an approved source note |
| `obsidian_create_curated_note` | Create a curated note from an approved template type into an approved curated zone |
| `obsidian_log_promotion` | Create a promotion log note linking the source and curated notes |

### Notes

| Tool | Description |
|------|-------------|
| `obsidian_read_note` | Read a note by name or path |
| `obsidian_create_note` | Create a new note |
| `obsidian_delete_note` | Delete a note |
| `obsidian_move_note` | Move a note to another folder |
| `obsidian_rename_note` | Rename a note (updates all backlinks) |
| `obsidian_append_note` | Append content to a note |
| `obsidian_prepend_note` | Prepend content to a note |
| `obsidian_outline` | Get the heading outline of a note |
| `obsidian_wordcount` | Get word and character count |
| `obsidian_file_info` | Get file metadata (path, size, dates…) |
| `obsidian_diff` | Compare two versions of a note |
| `obsidian_eval` | Execute JavaScript in the Obsidian context |

### Vault

| Tool | Description |
|------|-------------|
| `obsidian_vault_info` | Show vault name, path and file count |
| `obsidian_list_files` | List files, optionally filtered by folder or extension |
| `obsidian_list_folders` | List all folders |
| `obsidian_list_vaults` | List all Obsidian vaults |
| `obsidian_version` | Get Obsidian and CLI version |
| `obsidian_list_recents` | List recently opened files |
| `obsidian_random_read` | Read a random note from the vault or a folder |
| `obsidian_list_aliases` | List all note aliases defined in frontmatter |

### Search

| Tool | Description |
|------|-------------|
| `obsidian_search` | Full-text search across all notes |
| `obsidian_search_context` | Search with surrounding context |

### Frontmatter

| Tool | Description |
|------|-------------|
| `obsidian_list_properties` | List all frontmatter properties in a note |
| `obsidian_get_property` | Get a specific property value |
| `obsidian_set_property` | Set a property value |
| `obsidian_remove_property` | Remove a property |

### Tags

| Tool | Description |
|------|-------------|
| `obsidian_list_tags` | List all tags in the vault or in a note |
| `obsidian_get_tag` | Get notes that use a specific tag |

### Links

| Tool | Description |
|------|-------------|
| `obsidian_list_links` | List outgoing links from a note |
| `obsidian_list_backlinks` | List incoming links to a note |
| `obsidian_list_orphans` | List notes with no incoming links |
| `obsidian_list_deadends` | List notes with outgoing links only |
| `obsidian_list_unresolved` | List broken wikilinks |

### Daily Notes

| Tool | Description |
|------|-------------|
| `obsidian_read_daily` | Read today's daily note |
| `obsidian_append_daily` | Append content to today's daily note |
| `obsidian_prepend_daily` | Prepend content to today's daily note |

### Tasks

| Tool | Description |
|------|-------------|
| `obsidian_list_tasks` | List tasks in a note or vault-wide |
| `obsidian_toggle_task` | Toggle a task checkbox |

### Templates

| Tool | Description |
|------|-------------|
| `obsidian_list_templates` | List available templates |
| `obsidian_read_template` | Read a template, optionally resolving variables |
| `obsidian_insert_template` | Insert a template into the active note |

### Bookmarks

| Tool | Description |
|------|-------------|
| `obsidian_list_bookmarks` | List all bookmarks (notes, folders, searches, URLs) |
| `obsidian_add_bookmark` | Add a bookmark |

### Plugins

| Tool | Description |
|------|-------------|
| `obsidian_list_plugins` | List all installed plugins |
| `obsidian_list_plugins_enabled` | List only enabled plugins |
| `obsidian_get_plugin` | Get info about a plugin |
| `obsidian_enable_plugin` | Enable a plugin |
| `obsidian_disable_plugin` | Disable a plugin |
| `obsidian_install_plugin` | Install a community plugin |
| `obsidian_uninstall_plugin` | Uninstall a plugin |

### History *(requires File Recovery plugin)*

| Tool | Description |
|------|-------------|
| `obsidian_history_list` | List all tracked versions |
| `obsidian_history_read` | Read a specific version of a note |
| `obsidian_history_restore` | Restore a note to a previous version |

### Sync *(requires Obsidian Sync)*

| Tool | Description |
|------|-------------|
| `obsidian_sync_status` | Get current sync status |
| `obsidian_sync_history` | List sync versions for a file |
| `obsidian_sync_read` | Read a specific sync version |
| `obsidian_sync_restore` | Restore a file to a sync version |
| `obsidian_sync_deleted` | List files deleted from sync history |

### Workspace

| Tool | Description |
|------|-------------|
| `obsidian_workspace` | Get the current workspace layout and open panes |
| `obsidian_list_tabs` | List all currently open tabs |
| `obsidian_daily_path` | Get the file path for today's daily note |

### Commands & Hotkeys

| Tool | Description |
|------|-------------|
| `obsidian_list_commands` | List all available commands (command palette) |
| `obsidian_execute_command` | Execute an Obsidian command by ID |
| `obsidian_list_hotkeys` | List all configured keyboard shortcuts |
| `obsidian_get_hotkey` | Get the hotkey for a specific command |

### Themes

| Tool | Description |
|------|-------------|
| `obsidian_list_themes` | List all installed themes |
| `obsidian_get_theme` | Get information about a specific theme |
| `obsidian_set_theme` | Activate a theme (or reset to default) |
| `obsidian_install_theme` | Install a community theme |
| `obsidian_uninstall_theme` | Uninstall a theme |

### Snippets

| Tool | Description |
|------|-------------|
| `obsidian_list_snippets` | List all installed CSS snippets |
| `obsidian_list_snippets_enabled` | List only enabled CSS snippets |
| `obsidian_enable_snippet` | Enable a CSS snippet |
| `obsidian_disable_snippet` | Disable a CSS snippet |

### Bases *(requires Obsidian Bases plugin)*

| Tool | Description |
|------|-------------|
| `obsidian_list_bases` | List all Base files |
| `obsidian_query_base` | Query items from a Base |
| `obsidian_list_base_views` | List views in a Base |
| `obsidian_create_base_item` | Create an item in a Base |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for architecture overview, design decisions, and how to add new tools.

## License

See [LICENSE](./LICENSE).
