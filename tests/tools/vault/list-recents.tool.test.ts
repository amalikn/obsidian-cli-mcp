import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listRecentsHandler, registerListRecentsTool } from '../../../src/tools/vault/list-recents.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listRecentsHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI recents command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('note-a.md\nnote-b.md')

    await listRecentsHandler({ total: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('recents', { total: undefined, vault: undefined })
  })

  it('passes params when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await listRecentsHandler({ total: true, vault: 'my-vault' }, cli)

    expect(cli.run).toHaveBeenCalledWith('recents', expect.objectContaining({ total: true, vault: 'my-vault' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('CLI error'))

    const result = await listRecentsHandler({ total: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListRecentsTool', () => {
  it('registers tool with name obsidian_list_recents', () => {
    const server = { registerTool: vi.fn() }
    registerListRecentsTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_recents', expect.objectContaining({ title: 'List Recent Files' }), expect.any(Function))
  })
})
