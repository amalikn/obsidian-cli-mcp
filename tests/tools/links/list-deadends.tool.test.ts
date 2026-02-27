import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listDeadendsHandler, registerListDeadendsTool } from '../../../src/tools/links/list-deadends.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listDeadendsHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI deadends command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('note-a.md\nnote-b.md')

    await listDeadendsHandler({ total: undefined, all: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('deadends', { total: undefined, all: undefined, vault: undefined })
  })

  it('passes all flag when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await listDeadendsHandler({ total: undefined, all: true, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('deadends', expect.objectContaining({ all: true }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Vault error'))

    const result = await listDeadendsHandler({ total: undefined, all: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListDeadendsTool', () => {
  it('registers tool with name obsidian_list_deadends', () => {
    const server = { registerTool: vi.fn() }
    registerListDeadendsTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_deadends', expect.objectContaining({ title: 'List Dead-end Links' }), expect.any(Function))
  })
})
