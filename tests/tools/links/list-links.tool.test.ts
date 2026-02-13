import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listLinksHandler, registerListLinksTool } from '../../../src/tools/links/list-links.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listLinksHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI links command with file', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('other-note.md')
    await listLinksHandler({ file: 'My Note', path: undefined, vault: undefined }, cli)
    expect(cli.run).toHaveBeenCalledWith('links', { file: 'My Note', path: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('error'))
    const result = await listLinksHandler({ file: undefined, path: undefined, vault: undefined }, cli)
    expect(result.isError).toBe(true)
  })
})

describe('registerListLinksTool', () => {
  it('registers tool with name obsidian_list_links', () => {
    const server = { registerTool: vi.fn() }
    registerListLinksTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_links', expect.objectContaining({ title: 'List Links' }), expect.any(Function))
  })
})
