import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { historyRestoreHandler, registerHistoryRestoreTool } from '../../../src/tools/history/history-restore.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('historyRestoreHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI history:restore command with version', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Restored to version 2')

    await historyRestoreHandler({ file: 'My Note', path: undefined, version: 2, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('history:restore', { file: 'My Note', path: undefined, version: 2, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Version not found'))

    const result = await historyRestoreHandler({ file: 'My Note', path: undefined, version: 99, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerHistoryRestoreTool', () => {
  it('registers tool with name obsidian_history_restore', () => {
    const server = { registerTool: vi.fn() }
    registerHistoryRestoreTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_history_restore', expect.objectContaining({ title: 'History Restore' }), expect.any(Function))
  })
})
