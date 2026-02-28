import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { syncRestoreHandler, registerSyncRestoreTool } from '../../../src/tools/sync/sync-restore.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('syncRestoreHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI sync:restore command with version', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Restored to version 3')

    await syncRestoreHandler({ file: 'My Note', path: undefined, version: 3, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('sync:restore', { file: 'My Note', path: undefined, version: 3, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Version not found'))

    const result = await syncRestoreHandler({ file: 'My Note', path: undefined, version: 99, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerSyncRestoreTool', () => {
  it('registers tool with name obsidian_sync_restore', () => {
    const server = { registerTool: vi.fn() }
    registerSyncRestoreTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_sync_restore', expect.objectContaining({ title: 'Sync Restore' }), expect.any(Function))
  })
})
