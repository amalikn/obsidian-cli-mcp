import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { appendDailyHandler, registerAppendDailyTool } from '../../../src/tools/daily/append-daily.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('appendDailyHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI daily:append command with content', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('')
    await appendDailyHandler({ content: 'New entry', inline: undefined, vault: undefined }, cli)
    expect(cli.run).toHaveBeenCalledWith('daily:append', { content: 'New entry', inline: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('error'))
    const result = await appendDailyHandler({ content: 'text', inline: undefined, vault: undefined }, cli)
    expect(result.isError).toBe(true)
  })
})

describe('registerAppendDailyTool', () => {
  it('registers tool with name obsidian_append_daily', () => {
    const server = { registerTool: vi.fn() }
    registerAppendDailyTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_append_daily', expect.objectContaining({ title: "Append to Daily Note" }), expect.any(Function))
  })
})
