import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { enablePluginHandler, registerEnablePluginTool } from '../../../src/tools/plugins/enable-plugin.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('enablePluginHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI plugin:enable command with id', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Enabled')

    await enablePluginHandler({ id: 'calendar', filter: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('plugin:enable', { id: 'calendar', filter: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Plugin not found'))

    const result = await enablePluginHandler({ id: 'missing', filter: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerEnablePluginTool', () => {
  it('registers tool with name obsidian_enable_plugin', () => {
    const server = { registerTool: vi.fn() }
    registerEnablePluginTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_enable_plugin', expect.objectContaining({ title: 'Enable Plugin' }), expect.any(Function))
  })
})
