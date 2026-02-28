import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { installPluginHandler, registerInstallPluginTool } from '../../../src/tools/plugins/install-plugin.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('installPluginHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI plugin:install command with id', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Installed')

    await installPluginHandler({ id: 'calendar', enable: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('plugin:install', { id: 'calendar', enable: undefined, vault: undefined })
  })

  it('passes enable flag when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Installed and enabled')

    await installPluginHandler({ id: 'calendar', enable: true, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('plugin:install', expect.objectContaining({ enable: true }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Install failed'))

    const result = await installPluginHandler({ id: 'bad-plugin', enable: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerInstallPluginTool', () => {
  it('registers tool with name obsidian_install_plugin', () => {
    const server = { registerTool: vi.fn() }
    registerInstallPluginTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_install_plugin', expect.objectContaining({ title: 'Install Plugin' }), expect.any(Function))
  })
})
