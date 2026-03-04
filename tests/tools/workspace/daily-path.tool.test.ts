import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { dailyPathHandler, registerDailyPathTool } from '../../../src/tools/workspace/daily-path.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('dailyPathHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI daily:path command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Daily/2026-03-05.md')

    await dailyPathHandler({ vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('daily:path', { vault: undefined })
  })

  it('passes vault param when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await dailyPathHandler({ vault: 'MyVault' }, cli)

    expect(cli.run).toHaveBeenCalledWith('daily:path', expect.objectContaining({ vault: 'MyVault' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Vault error'))

    const result = await dailyPathHandler({ vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerDailyPathTool', () => {
  it('registers tool with name obsidian_daily_path', () => {
    const server = { registerTool: vi.fn() }
    registerDailyPathTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_daily_path', expect.objectContaining({ title: 'Get Daily Note Path' }), expect.any(Function))
  })
})
