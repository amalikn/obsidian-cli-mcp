import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { uninstallThemeHandler, registerUninstallThemeTool } from '../../../src/tools/themes/uninstall-theme.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('uninstallThemeHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI theme:uninstall command with name', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Uninstalled')

    await uninstallThemeHandler({ name: 'Minimal', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('theme:uninstall', { name: 'Minimal', vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Theme not found'))

    const result = await uninstallThemeHandler({ name: 'NonExistent', vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerUninstallThemeTool', () => {
  it('registers tool with name obsidian_uninstall_theme', () => {
    const server = { registerTool: vi.fn() }
    registerUninstallThemeTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_uninstall_theme', expect.objectContaining({ title: 'Uninstall Theme' }), expect.any(Function))
  })
})
