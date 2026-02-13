import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { readDailyHandler, registerReadDailyTool } from '../../../src/tools/daily/read-daily.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('readDailyHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI daily:read command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('# 2026-03-05\n- [ ] task')
    await readDailyHandler({ vault: undefined }, cli)
    expect(cli.run).toHaveBeenCalledWith('daily:read', { vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('No daily note'))
    const result = await readDailyHandler({ vault: undefined }, cli)
    expect(result.isError).toBe(true)
  })
})

describe('registerReadDailyTool', () => {
  it('registers tool with name obsidian_read_daily', () => {
    const server = { registerTool: vi.fn() }
    registerReadDailyTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_read_daily', expect.objectContaining({ title: 'Read Daily Note' }), expect.any(Function))
  })
})
