import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { prependDailyHandler, registerPrependDailyTool } from '../../../src/tools/daily/prepend-daily.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('prependDailyHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI daily:prepend command with content', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('')
    await prependDailyHandler({ content: 'Top entry', inline: undefined, vault: undefined }, cli)
    expect(cli.run).toHaveBeenCalledWith('daily:prepend', { content: 'Top entry', inline: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('error'))
    const result = await prependDailyHandler({ content: 'text', inline: undefined, vault: undefined }, cli)
    expect(result.isError).toBe(true)
  })
})

describe('registerPrependDailyTool', () => {
  it('registers tool with name obsidian_prepend_daily', () => {
    const server = { registerTool: vi.fn() }
    registerPrependDailyTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_prepend_daily', expect.objectContaining({ title: "Prepend to Daily Note" }), expect.any(Function))
  })
})
