import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { historyReadHandler, registerHistoryReadTool } from '../../../src/tools/history/history-read.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('historyReadHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI history:read command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('# Old content')

    await historyReadHandler({ file: 'My Note', path: undefined, version: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('history:read', { file: 'My Note', path: undefined, version: undefined, vault: undefined })
  })

  it('passes version when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('# Content v2')

    await historyReadHandler({ file: 'My Note', path: undefined, version: 2, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('history:read', expect.objectContaining({ version: 2 }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Version not found'))

    const result = await historyReadHandler({ file: 'My Note', path: undefined, version: 99, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerHistoryReadTool', () => {
  it('registers tool with name obsidian_history_read', () => {
    const server = { registerTool: vi.fn() }
    registerHistoryReadTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_history_read', expect.objectContaining({ title: 'History Read' }), expect.any(Function))
  })
})
