import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { searchContextHandler, registerSearchContextTool } from '../../../src/tools/search/search-context.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('searchContextHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI search:context command with query', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('note.md:5: matching line')

    await searchContextHandler({ query: 'TDD', path: undefined, limit: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('search:context', { query: 'TDD', path: undefined, limit: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('error'))

    const result = await searchContextHandler({ query: 'test', path: undefined, limit: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerSearchContextTool', () => {
  it('registers tool with name obsidian_search_context', () => {
    const server = { registerTool: vi.fn() }
    registerSearchContextTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_search_context', expect.objectContaining({ title: 'Search with Context' }), expect.any(Function))
  })
})
