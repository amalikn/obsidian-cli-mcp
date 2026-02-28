import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { syncReadHandler, registerSyncReadTool } from '../../../src/tools/sync/sync-read.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('syncReadHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI sync:read command with version', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('# Old content v2')

    await syncReadHandler({ file: 'My Note', path: undefined, version: 2, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('sync:read', { file: 'My Note', path: undefined, version: 2, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Version not found'))

    const result = await syncReadHandler({ file: 'My Note', path: undefined, version: 99, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerSyncReadTool', () => {
  it('registers tool with name obsidian_sync_read', () => {
    const server = { registerTool: vi.fn() }
    registerSyncReadTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_sync_read', expect.objectContaining({ title: 'Sync Read' }), expect.any(Function))
  })
})
