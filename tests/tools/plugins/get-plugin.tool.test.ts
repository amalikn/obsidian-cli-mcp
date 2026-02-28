import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { getPluginHandler, registerGetPluginTool } from '../../../src/tools/plugins/get-plugin.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('getPluginHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI plugin command with id', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('id: calendar\nversion: 1.5.0')

    await getPluginHandler({ id: 'calendar', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('plugin', { id: 'calendar', vault: undefined })
  })

  it('returns plugin info as text', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('id: calendar')

    const result = await getPluginHandler({ id: 'calendar', vault: undefined }, cli)

    expect(result).toEqual({ content: [{ type: 'text', text: 'id: calendar' }] })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Plugin not found'))

    const result = await getPluginHandler({ id: 'missing', vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerGetPluginTool', () => {
  it('registers tool with name obsidian_get_plugin', () => {
    const server = { registerTool: vi.fn() }
    registerGetPluginTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_get_plugin', expect.objectContaining({ title: 'Get Plugin' }), expect.any(Function))
  })
})
