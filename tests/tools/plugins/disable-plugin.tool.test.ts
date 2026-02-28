import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { disablePluginHandler, registerDisablePluginTool } from '../../../src/tools/plugins/disable-plugin.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('disablePluginHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI plugin:disable command with id', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Disabled')

    await disablePluginHandler({ id: 'calendar', filter: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('plugin:disable', { id: 'calendar', filter: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Plugin not found'))

    const result = await disablePluginHandler({ id: 'missing', filter: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerDisablePluginTool', () => {
  it('registers tool with name obsidian_disable_plugin', () => {
    const server = { registerTool: vi.fn() }
    registerDisablePluginTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_disable_plugin', expect.objectContaining({ title: 'Disable Plugin' }), expect.any(Function))
  })
})
