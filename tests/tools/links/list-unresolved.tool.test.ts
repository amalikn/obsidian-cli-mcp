import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listUnresolvedHandler, registerListUnresolvedTool } from '../../../src/tools/links/list-unresolved.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listUnresolvedHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI unresolved command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('[[broken-link]]')

    await listUnresolvedHandler({ total: undefined, counts: undefined, verbose: undefined, format: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('unresolved', { total: undefined, counts: undefined, verbose: undefined, format: undefined, vault: undefined })
  })

  it('passes counts flag when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('42')

    await listUnresolvedHandler({ total: undefined, counts: true, verbose: undefined, format: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('unresolved', expect.objectContaining({ counts: true }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Vault error'))

    const result = await listUnresolvedHandler({ total: undefined, counts: undefined, verbose: undefined, format: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListUnresolvedTool', () => {
  it('registers tool with name obsidian_list_unresolved', () => {
    const server = { registerTool: vi.fn() }
    registerListUnresolvedTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_unresolved', expect.objectContaining({ title: 'List Unresolved Links' }), expect.any(Function))
  })
})
