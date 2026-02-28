import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { syncHistoryHandler, registerSyncHistoryTool } from '../../../src/tools/sync/sync-history.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('syncHistoryHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI sync:history command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('v1 2024-01-01\nv2 2024-01-02')

    await syncHistoryHandler({ file: 'My Note', path: undefined, total: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('sync:history', { file: 'My Note', path: undefined, total: undefined, vault: undefined })
  })

  it('passes total flag when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('5')

    await syncHistoryHandler({ file: 'My Note', path: undefined, total: true, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('sync:history', expect.objectContaining({ total: true }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Sync not enabled'))

    const result = await syncHistoryHandler({ file: 'My Note', path: undefined, total: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerSyncHistoryTool', () => {
  it('registers tool with name obsidian_sync_history', () => {
    const server = { registerTool: vi.fn() }
    registerSyncHistoryTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_sync_history', expect.objectContaining({ title: 'Sync History' }), expect.any(Function))
  })
})
