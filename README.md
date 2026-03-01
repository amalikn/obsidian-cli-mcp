# obsidian-cli-mcp

MCP server for the [Obsidian CLI](https://github.com/obsidianmd/obsidian-cli) — exposes 55 semantic tools to read, write and manage your Obsidian vault from any MCP-compatible AI client.

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
| `OBSIDIAN_VAULT` | Default vault name | active vault |
| `MCP_TRANSPORT` | `stdio` or `http` | `stdio` |
| `MCP_PORT` | HTTP port (when `MCP_TRANSPORT=http`) | `3000` |

> **Important (macOS):** always point `OBSIDIAN_BIN` to the Homebrew binary (`$(brew --prefix)/bin/obsidian`). The Homebrew binary flushes stdout to the pipe correctly; a plain app bundle symlink does not.

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
        "OBSIDIAN_BIN": "/opt/homebrew/bin/obsidian",
        "OBSIDIAN_VAULT": "MyVault"
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
        "OBSIDIAN_BIN": "/opt/homebrew/bin/obsidian",
        "OBSIDIAN_VAULT": "MyVault"
      }
    }
  }
}
```

Or add it directly from the CLI:

```bash
claude mcp add --transport stdio \
  --env OBSIDIAN_BIN=/opt/homebrew/bin/obsidian \
  --env OBSIDIAN_VAULT=MyVault \
  obsidian-cli -- npx -y @joemugen/obsidian-cli-mcp
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
        "OBSIDIAN_BIN": "/opt/homebrew/bin/obsidian",
        "OBSIDIAN_VAULT": "MyVault"
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
          "OBSIDIAN_BIN": "/opt/homebrew/bin/obsidian",
          "OBSIDIAN_VAULT": "MyVault"
        }
      }
    }
  }
}
```

---

### HTTP transport (network / multi-client)

```bash
MCP_TRANSPORT=http MCP_PORT=3000 \
OBSIDIAN_BIN=/opt/homebrew/bin/obsidian \
OBSIDIAN_VAULT=MyVault \
node dist/index.js
```

The server exposes a Streamable HTTP endpoint at `http://localhost:3000/mcp`.

---

## Tools

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

### Vault

| Tool | Description |
|------|-------------|
| `obsidian_vault_info` | Show vault name, path and file count |
| `obsidian_list_files` | List files, optionally filtered by folder or extension |
| `obsidian_list_folders` | List all folders |

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

### Bases *(requires Obsidian Bases plugin)*

| Tool | Description |
|------|-------------|
| `obsidian_list_bases` | List all Base files |
| `obsidian_query_base` | Query items from a Base |
| `obsidian_list_base_views` | List views in a Base |
| `obsidian_create_base_item` | Create an item in a Base |

---

## Development

```bash
git clone https://github.com/joemugen/obsidian-cli-mcp.git
cd obsidian-cli-mcp
npm install
```

```bash
npm test              # run unit tests (206 tests)
npm run test:watch    # watch mode
npm run test:coverage # coverage report
npm run build         # compile TypeScript → dist/
npm run dev           # run with tsx (no build needed)
npm run lint          # ESLint
npm run format        # Prettier
```

## Architecture

```
src/
├── index.ts                    # entrypoint — detects stdio vs HTTP
├── server.ts                   # McpServer creation + tool registration
├── transports/
│   ├── stdio.ts
│   └── http.ts                 # Fastify + StreamableHTTPServerTransport
├── services/
│   └── obsidian-cli.service.ts # spawn() wrapper around the CLI binary
└── tools/
    ├── notes/        # 10 tools
    ├── vault/        # 3 tools
    ├── search/       # 2 tools
    ├── properties/   # 4 tools
    ├── tags/         # 2 tools
    ├── links/        # 5 tools
    ├── daily/        # 3 tools
    ├── tasks/        # 2 tools
    ├── templates/    # 3 tools
    ├── bookmarks/    # 2 tools
    ├── plugins/      # 7 tools
    ├── history/      # 3 tools
    ├── sync/         # 5 tools
    └── bases/        # 4 tools
```

### Key design decisions

**`spawn` instead of `execFile`** — The Obsidian CLI is Electron-based. Electron can emit fatal errors and crash the process after writing its output. `spawn` captures stdout in real-time via `data` events, so the output is preserved even if the process crashes afterward.

**ENV injection (HOME / TMPDIR / USER)** — Claude Desktop only propagates env vars explicitly listed in `claude_desktop_config.json`. Without `HOME`, `TMPDIR` and `USER`, the CLI cannot find its IPC socket to communicate with the running Obsidian app. The service injects these automatically.

**`isError: true` on CLI errors** — Returns structured errors instead of throwing, so the LLM can recover and retry rather than crashing the tool call.

## License

MIT
