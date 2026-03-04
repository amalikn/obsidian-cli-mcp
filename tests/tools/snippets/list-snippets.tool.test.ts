import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listSnippetsHandler, registerListSnippetsTool } from '../../../src/tools/snippets/list-snippets.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listSnippetsHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI snippets command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('snippet-a\nsnippet-b')

    await listSnippetsHandler({ vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('snippets', { vault: undefined })
  })

  it('passes vault when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await listSnippetsHandler({ vault: 'MyVault' }, cli)

    expect(cli.run).toHaveBeenCalledWith('snippets', expect.objectContaining({ vault: 'MyVault' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Vault error'))

    const result = await listSnippetsHandler({ vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListSnippetsTool', () => {
  it('registers tool with name obsidian_list_snippets', () => {
    const server = { registerTool: vi.fn() }
    registerListSnippetsTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_snippets', expect.objectContaining({ title: 'List Snippets' }), expect.any(Function))
  })
})
