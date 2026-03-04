import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listSnippetsEnabledHandler, registerListSnippetsEnabledTool } from '../../../src/tools/snippets/list-snippets-enabled.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listSnippetsEnabledHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI snippets:enabled command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('snippet-active')

    await listSnippetsEnabledHandler({ vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('snippets:enabled', { vault: undefined })
  })

  it('passes vault when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await listSnippetsEnabledHandler({ vault: 'MyVault' }, cli)

    expect(cli.run).toHaveBeenCalledWith('snippets:enabled', expect.objectContaining({ vault: 'MyVault' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Vault error'))

    const result = await listSnippetsEnabledHandler({ vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListSnippetsEnabledTool', () => {
  it('registers tool with name obsidian_list_snippets_enabled', () => {
    const server = { registerTool: vi.fn() }
    registerListSnippetsEnabledTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_snippets_enabled', expect.objectContaining({ title: 'List Enabled Snippets' }), expect.any(Function))
  })
})
