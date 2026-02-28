import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listPluginsHandler, registerListPluginsTool } from '../../../src/tools/plugins/list-plugins.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listPluginsHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI plugins command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('plugin-a\nplugin-b')

    await listPluginsHandler({ filter: undefined, versions: undefined, format: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('plugins', { filter: undefined, versions: undefined, format: undefined, vault: undefined })
  })

  it('passes filter and versions flag when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await listPluginsHandler({ filter: 'calendar', versions: true, format: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('plugins', expect.objectContaining({ filter: 'calendar', versions: true }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Vault error'))

    const result = await listPluginsHandler({ filter: undefined, versions: undefined, format: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListPluginsTool', () => {
  it('registers tool with name obsidian_list_plugins', () => {
    const server = { registerTool: vi.fn() }
    registerListPluginsTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_plugins', expect.objectContaining({ title: 'List Plugins' }), expect.any(Function))
  })
})
