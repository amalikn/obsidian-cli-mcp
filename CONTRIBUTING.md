# Contributing to obsidian-cli-mcp

Thank you for your interest in contributing! This document covers everything you need to get started.

## Table of Contents

- [Development setup](#development-setup)
- [Architecture](#architecture)
- [Key design decisions](#key-design-decisions)
- [Adding a new tool](#adding-a-new-tool)
- [TDD workflow](#tdd-workflow)
- [Code style](#code-style)
- [Commit conventions](#commit-conventions)
- [Pull request guidelines](#pull-request-guidelines)

---

## Development setup

```bash
git clone https://github.com/joemugen/obsidian-cli-mcp.git
cd obsidian-cli-mcp
npm install
```

```bash
npm test              # run unit tests
npm run test:watch    # watch mode
npm run test:coverage # coverage report
npm run build         # compile TypeScript → dist/
npm run dev           # run with tsx (no build step)
npm run lint          # ESLint
npm run format        # Prettier
```

> **Requirement:** Obsidian must be running locally for end-to-end manual tests.
> Point `OBSIDIAN_BIN` to the Homebrew binary — see [README](./README.md#configuration).

---

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

Each domain directory contains one file per tool, following the pattern `{action}-{noun}.tool.ts`.
Tests mirror the same structure under `tests/tools/`.

---

## Key design decisions

### `spawn` instead of `execFile`

The Obsidian CLI is Electron-based. Electron can emit fatal errors and crash the process after writing its output. `spawn` captures stdout in real-time via `data` events, so the output is preserved even if the process crashes afterward.

### ENV injection (`HOME` / `TMPDIR` / `USER`)

MCP clients (e.g. Claude Desktop) only propagate env vars explicitly listed in their config. Without `HOME`, `TMPDIR` and `USER`, the CLI cannot find its IPC socket to communicate with the running Obsidian app. The service injects these automatically.

On macOS, `os.tmpdir()` returns `/tmp` when `TMPDIR` is unset — but Obsidian needs the real per-user temp dir (`/var/folders/…/T/`), obtained via `getconf DARWIN_USER_TEMP_DIR`.

### `isError: true` on CLI errors

Returns structured errors instead of throwing, so the LLM can recover and retry rather than crashing the tool call.

### Tool descriptions drive discoverability

With 55+ tools, MCP clients use lazy loading and semantic search to select tools. Vague descriptions cause the client to answer from general knowledge instead of calling the tool. Every tool description must include intent keywords and explicit usage guidance (e.g. _"Use this when the user asks…"_).

---

## Adding a new tool

Every tool follows the same two-file pattern: a test file first (TDD), then the implementation.

### 1. Write the test

```typescript
// tests/tools/{domain}/{action}-{noun}.tool.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { registerMyTool, myToolHandler } from '../../../src/tools/{domain}/{action}-{noun}.tool.js'

describe('obsidian_my_tool', () => {
  let cli: ObsidianCliService

  beforeEach(() => {
    cli = { run: vi.fn().mockResolvedValue('output') } as unknown as ObsidianCliService
  })

  it('calls CLI with the correct command', async () => {
    await myToolHandler({ param: 'value', vault: undefined }, cli)
    expect(cli.run).toHaveBeenCalledWith('cli:command', { param: 'value', vault: undefined })
  })

  it('returns CLI output as text content', async () => {
    const result = await myToolHandler({ vault: undefined }, cli)
    expect(result).toEqual({ content: [{ type: 'text', text: 'output' }] })
  })

  it('returns isError:true when CLI fails', async () => {
    vi.mocked(cli.run).mockRejectedValue(new Error('CLI error'))
    const result = await myToolHandler({ vault: undefined }, cli)
    expect(result).toEqual({ isError: true, content: [{ type: 'text', text: 'CLI error' }] })
  })

  it('registers the tool on the server', () => {
    const server = { registerTool: vi.fn() } as unknown as McpServer
    registerMyTool(server, cli)
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_my_tool', expect.any(Object), expect.any(Function))
  })
})
```

### 2. Implement the tool

```typescript
// src/tools/{domain}/{action}-{noun}.tool.ts
import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type MyToolParams = {
  param: string | undefined
  vault: string | undefined
}

export async function myToolHandler(params: MyToolParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('cli:command', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerMyTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_my_tool',
    {
      title: 'My Tool',
      description: 'What this tool does. Use this when the user asks about X or wants to Y.',
      inputSchema: {
        param: z.string().optional().describe('Description of the parameter'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => myToolHandler(params, cli),
  )
}
```

### 3. Register in `server.ts`

Add the import and the `register*Tool(server, cli)` call in `src/server.ts`, following the existing pattern.

### 4. Update `README.md`

Add a row to the relevant domain table in the Tools section.

---

## TDD workflow

Tests are mandatory for every tool. The workflow is strict:

1. **Write the failing test** — run `npm run test:watch`, confirm it fails
2. **Implement the minimum code** to make it pass
3. **Refactor** if needed, keeping tests green
4. Run `npm test` before committing

No implementation without a test. No exceptions unless it's an exploratory spike (and spikes are not merged).

---

## Code style

- TypeScript strict mode — no `any` unless unavoidable
- ESLint + Prettier enforced — run `npm run lint && npm run format` before committing
- Explicit types preferred over inference for public-facing functions
- No comments that restate what the code already says

---

## Commit conventions

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add obsidian_my_tool for X
fix: handle empty output from CLI on Linux
docs: update Claude Desktop config path for Windows
test: add missing edge cases for obsidian_search
refactor: extract vault resolution to shared helper
```

Scope is optional but welcome: `feat(plugins): add enable/disable tools`.

---

## Pull request guidelines

- **One concern per PR** — don't mix features, fixes and refactors
- **Tests must pass** — `npm test` must be green
- **Description** — explain the _why_, not just the _what_
- **New tools** — must include a README update and full test coverage
- **Breaking changes** — flag them explicitly in the PR description

For significant changes, open an issue first to discuss the approach.

---

## License

By contributing, you agree that your contributions will be licensed under the same license as this project. See [LICENSE](./LICENSE) for details.
