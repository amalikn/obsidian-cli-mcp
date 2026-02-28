import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { uninstallPluginHandler, registerUninstallPluginTool } from '../../../src/tools/plugins/uninstall-plugin.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('uninstallPluginHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI plugin:uninstall command with id', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Uninstalled')

    await uninstallPluginHandler({ id: 'calendar', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('plugin:uninstall', { id: 'calendar', vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Plugin not found'))

    const result = await uninstallPluginHandler({ id: 'missing', vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerUninstallPluginTool', () => {
  it('registers tool with name obsidian_uninstall_plugin', () => {
    const server = { registerTool: vi.fn() }
    registerUninstallPluginTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_uninstall_plugin', expect.objectContaining({ title: 'Uninstall Plugin' }), expect.any(Function))
  })
})
