import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listPluginsEnabledHandler, registerListPluginsEnabledTool } from '../../../src/tools/plugins/list-plugins-enabled.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listPluginsEnabledHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI plugins:enabled command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('calendar\ndataview')

    await listPluginsEnabledHandler({ filter: undefined, versions: undefined, format: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('plugins:enabled', { filter: undefined, versions: undefined, format: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Vault error'))

    const result = await listPluginsEnabledHandler({ filter: undefined, versions: undefined, format: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListPluginsEnabledTool', () => {
  it('registers tool with name obsidian_list_plugins_enabled', () => {
    const server = { registerTool: vi.fn() }
    registerListPluginsEnabledTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_plugins_enabled', expect.objectContaining({ title: 'List Enabled Plugins' }), expect.any(Function))
  })
})
