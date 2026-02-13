import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listBacklinksHandler, registerListBacklinksTool } from '../../../src/tools/links/list-backlinks.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listBacklinksHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI backlinks command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('source.md')
    await listBacklinksHandler({ file: 'Target', path: undefined, vault: undefined }, cli)
    expect(cli.run).toHaveBeenCalledWith('backlinks', { file: 'Target', path: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('error'))
    const result = await listBacklinksHandler({ file: undefined, path: undefined, vault: undefined }, cli)
    expect(result.isError).toBe(true)
  })
})

describe('registerListBacklinksTool', () => {
  it('registers tool with name obsidian_list_backlinks', () => {
    const server = { registerTool: vi.fn() }
    registerListBacklinksTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_backlinks', expect.objectContaining({ title: 'List Backlinks' }), expect.any(Function))
  })
})
