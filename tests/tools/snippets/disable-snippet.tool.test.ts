import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { disableSnippetHandler, registerDisableSnippetTool } from '../../../src/tools/snippets/disable-snippet.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('disableSnippetHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI snippet:disable command with name', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Disabled')

    await disableSnippetHandler({ name: 'my-snippet', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('snippet:disable', { name: 'my-snippet', vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Snippet not found'))

    const result = await disableSnippetHandler({ name: 'NonExistent', vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerDisableSnippetTool', () => {
  it('registers tool with name obsidian_disable_snippet', () => {
    const server = { registerTool: vi.fn() }
    registerDisableSnippetTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_disable_snippet', expect.objectContaining({ title: 'Disable Snippet' }), expect.any(Function))
  })
})
