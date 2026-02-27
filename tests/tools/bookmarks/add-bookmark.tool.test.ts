import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { addBookmarkHandler, registerAddBookmarkTool } from '../../../src/tools/bookmarks/add-bookmark.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('addBookmarkHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI bookmark command with file', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Bookmark added')

    await addBookmarkHandler({ file: 'My Note', folder: undefined, search: undefined, url: undefined, subpath: undefined, title: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('bookmark', expect.objectContaining({ file: 'My Note' }))
  })

  it('calls CLI bookmark command with url', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Bookmark added')

    await addBookmarkHandler({ file: undefined, folder: undefined, search: undefined, url: 'https://example.com', subpath: undefined, title: 'Example', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('bookmark', expect.objectContaining({ url: 'https://example.com', title: 'Example' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Invalid bookmark'))

    const result = await addBookmarkHandler({ file: undefined, folder: undefined, search: undefined, url: undefined, subpath: undefined, title: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerAddBookmarkTool', () => {
  it('registers tool with name obsidian_add_bookmark', () => {
    const server = { registerTool: vi.fn() }
    registerAddBookmarkTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_add_bookmark', expect.objectContaining({ title: 'Add Bookmark' }), expect.any(Function))
  })
})
