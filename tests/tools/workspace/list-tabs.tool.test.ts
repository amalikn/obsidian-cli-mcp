import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listTabsHandler, registerListTabsTool } from '../../../src/tools/workspace/list-tabs.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listTabsHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI tabs command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('tab1\ntab2')

    await listTabsHandler({ ids: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('tabs', { ids: undefined, vault: undefined })
  })

  it('passes params when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await listTabsHandler({ ids: true, vault: 'MyVault' }, cli)

    expect(cli.run).toHaveBeenCalledWith('tabs', expect.objectContaining({ ids: true, vault: 'MyVault' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Vault error'))

    const result = await listTabsHandler({ ids: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListTabsTool', () => {
  it('registers tool with name obsidian_list_tabs', () => {
    const server = { registerTool: vi.fn() }
    registerListTabsTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_tabs', expect.objectContaining({ title: 'List Tabs' }), expect.any(Function))
  })
})
