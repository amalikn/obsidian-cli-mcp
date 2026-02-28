import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { syncStatusHandler, registerSyncStatusTool } from '../../../src/tools/sync/sync-status.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('syncStatusHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI sync:status command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Synced')

    await syncStatusHandler({ vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('sync:status', { vault: undefined })
  })

  it('returns sync status as text', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Synced')

    const result = await syncStatusHandler({ vault: undefined }, cli)

    expect(result).toEqual({ content: [{ type: 'text', text: 'Synced' }] })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Obsidian Sync not active'))

    const result = await syncStatusHandler({ vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerSyncStatusTool', () => {
  it('registers tool with name obsidian_sync_status', () => {
    const server = { registerTool: vi.fn() }
    registerSyncStatusTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_sync_status', expect.objectContaining({ title: 'Sync Status' }), expect.any(Function))
  })
})
