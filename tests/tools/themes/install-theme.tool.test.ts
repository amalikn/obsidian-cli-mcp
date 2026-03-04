import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { installThemeHandler, registerInstallThemeTool } from '../../../src/tools/themes/install-theme.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('installThemeHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI theme:install command with name', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Installed')

    await installThemeHandler({ name: 'Minimal', enable: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('theme:install', { name: 'Minimal', enable: undefined, vault: undefined })
  })

  it('passes enable flag when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Installed and enabled')

    await installThemeHandler({ name: 'Minimal', enable: true, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('theme:install', expect.objectContaining({ enable: true }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Install failed'))

    const result = await installThemeHandler({ name: 'NonExistent', enable: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerInstallThemeTool', () => {
  it('registers tool with name obsidian_install_theme', () => {
    const server = { registerTool: vi.fn() }
    registerInstallThemeTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_install_theme', expect.objectContaining({ title: 'Install Theme' }), expect.any(Function))
  })
})
