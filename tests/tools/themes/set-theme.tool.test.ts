import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { setThemeHandler, registerSetThemeTool } from '../../../src/tools/themes/set-theme.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('setThemeHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI theme:set command with name', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Theme set')

    await setThemeHandler({ name: 'Minimal', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('theme:set', { name: 'Minimal', vault: undefined })
  })

  it('calls CLI theme:set with empty string to reset to default', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Theme reset')

    await setThemeHandler({ name: '', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('theme:set', expect.objectContaining({ name: '' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Theme not found'))

    const result = await setThemeHandler({ name: 'NonExistent', vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerSetThemeTool', () => {
  it('registers tool with name obsidian_set_theme', () => {
    const server = { registerTool: vi.fn() }
    registerSetThemeTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_set_theme', expect.objectContaining({ title: 'Set Theme' }), expect.any(Function))
  })
})
