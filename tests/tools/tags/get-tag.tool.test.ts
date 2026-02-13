import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { getTagHandler, registerGetTagTool } from '../../../src/tools/tags/get-tag.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('getTagHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI tag command with name', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('project: 5 files')
    await getTagHandler({ name: 'project', vault: undefined }, cli)
    expect(cli.run).toHaveBeenCalledWith('tag', { name: 'project', vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('error'))
    const result = await getTagHandler({ name: 'missing', vault: undefined }, cli)
    expect(result.isError).toBe(true)
  })
})

describe('registerGetTagTool', () => {
  it('registers tool with name obsidian_get_tag', () => {
    const server = { registerTool: vi.fn() }
    registerGetTagTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_get_tag', expect.objectContaining({ title: 'Get Tag' }), expect.any(Function))
  })
})
