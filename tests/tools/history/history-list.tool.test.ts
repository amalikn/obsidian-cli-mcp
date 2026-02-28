import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { historyListHandler, registerHistoryListTool } from '../../../src/tools/history/history-list.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('historyListHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI history:list command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('2024-01-01 note.md v1\n2024-01-02 note.md v2')

    await historyListHandler({ vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('history:list', { vault: undefined })
  })

  it('returns history list as text', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('2024-01-01 note.md')

    const result = await historyListHandler({ vault: undefined }, cli)

    expect(result).toEqual({ content: [{ type: 'text', text: '2024-01-01 note.md' }] })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('File Recovery plugin not enabled'))

    const result = await historyListHandler({ vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerHistoryListTool', () => {
  it('registers tool with name obsidian_history_list', () => {
    const server = { registerTool: vi.fn() }
    registerHistoryListTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_history_list', expect.objectContaining({ title: 'History List' }), expect.any(Function))
  })
})
