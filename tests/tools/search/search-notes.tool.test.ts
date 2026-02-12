import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { searchNotesHandler, registerSearchNotesTool } from '../../../src/tools/search/search-notes.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('searchNotesHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI search command with query', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('note1.md\nnote2.md')

    await searchNotesHandler({ query: 'TDD', path: undefined, limit: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('search', { query: 'TDD', path: undefined, limit: undefined, vault: undefined })
  })

  it('passes path and limit filters when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('notes/a.md')

    await searchNotesHandler({ query: 'test', path: 'notes', limit: '5', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('search', expect.objectContaining({ path: 'notes', limit: '5' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Search failed'))

    const result = await searchNotesHandler({ query: 'test', path: undefined, limit: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerSearchNotesTool', () => {
  it('registers tool with name obsidian_search', () => {
    const server = { registerTool: vi.fn() }
    registerSearchNotesTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_search', expect.objectContaining({ title: 'Search Notes' }), expect.any(Function))
  })
})
