import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { enableSnippetHandler, registerEnableSnippetTool } from '../../../src/tools/snippets/enable-snippet.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('enableSnippetHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI snippet:enable command with name', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Enabled')

    await enableSnippetHandler({ name: 'my-snippet', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('snippet:enable', { name: 'my-snippet', vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Snippet not found'))

    const result = await enableSnippetHandler({ name: 'NonExistent', vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerEnableSnippetTool', () => {
  it('registers tool with name obsidian_enable_snippet', () => {
    const server = { registerTool: vi.fn() }
    registerEnableSnippetTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_enable_snippet', expect.objectContaining({ title: 'Enable Snippet' }), expect.any(Function))
  })
})
