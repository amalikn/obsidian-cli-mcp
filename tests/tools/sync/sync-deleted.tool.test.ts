import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { syncDeletedHandler, registerSyncDeletedTool } from '../../../src/tools/sync/sync-deleted.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('syncDeletedHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI sync:deleted command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('deleted-note.md')

    await syncDeletedHandler({ total: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('sync:deleted', { total: undefined, vault: undefined })
  })

  it('passes total flag when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('3')

    await syncDeletedHandler({ total: true, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('sync:deleted', expect.objectContaining({ total: true }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Sync not enabled'))

    const result = await syncDeletedHandler({ total: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerSyncDeletedTool', () => {
  it('registers tool with name obsidian_sync_deleted', () => {
    const server = { registerTool: vi.fn() }
    registerSyncDeletedTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_sync_deleted', expect.objectContaining({ title: 'Sync Deleted' }), expect.any(Function))
  })
})
