import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listTagsHandler, registerListTagsTool } from '../../../src/tools/tags/list-tags.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listTagsHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI tags command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('#project\n#todo')
    await listTagsHandler({ file: undefined, path: undefined, vault: undefined }, cli)
    expect(cli.run).toHaveBeenCalledWith('tags', { file: undefined, path: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('error'))
    const result = await listTagsHandler({ file: undefined, path: undefined, vault: undefined }, cli)
    expect(result.isError).toBe(true)
  })
})

describe('registerListTagsTool', () => {
  it('registers tool with name obsidian_list_tags', () => {
    const server = { registerTool: vi.fn() }
    registerListTagsTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_tags', expect.objectContaining({ title: 'List Tags' }), expect.any(Function))
  })
})
