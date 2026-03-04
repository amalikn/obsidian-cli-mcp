import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { getThemeHandler, registerGetThemeTool } from '../../../src/tools/themes/get-theme.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('getThemeHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI theme command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('theme info')

    await getThemeHandler({ name: 'Minimal', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('theme', { name: 'Minimal', vault: undefined })
  })

  it('calls CLI theme command without name', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('current theme info')

    await getThemeHandler({ name: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('theme', { name: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Theme not found'))

    const result = await getThemeHandler({ name: 'NonExistent', vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerGetThemeTool', () => {
  it('registers tool with name obsidian_get_theme', () => {
    const server = { registerTool: vi.fn() }
    registerGetThemeTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_get_theme', expect.objectContaining({ title: 'Get Theme' }), expect.any(Function))
  })
})
