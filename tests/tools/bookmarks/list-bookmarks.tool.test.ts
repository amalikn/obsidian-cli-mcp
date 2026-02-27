import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listBookmarksHandler, registerListBookmarksTool } from '../../../src/tools/bookmarks/list-bookmarks.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listBookmarksHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI bookmarks command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('bookmark1\nbookmark2')

    await listBookmarksHandler({ total: undefined, verbose: undefined, format: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('bookmarks', { total: undefined, verbose: undefined, format: undefined, vault: undefined })
  })

  it('passes verbose and total flags when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await listBookmarksHandler({ total: true, verbose: true, format: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('bookmarks', expect.objectContaining({ total: true, verbose: true }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('No bookmarks'))

    const result = await listBookmarksHandler({ total: undefined, verbose: undefined, format: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListBookmarksTool', () => {
  it('registers tool with name obsidian_list_bookmarks', () => {
    const server = { registerTool: vi.fn() }
    registerListBookmarksTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_bookmarks', expect.objectContaining({ title: 'List Bookmarks' }), expect.any(Function))
  })
})
