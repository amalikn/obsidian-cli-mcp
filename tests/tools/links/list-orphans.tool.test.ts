import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listOrphansHandler, registerListOrphansTool } from '../../../src/tools/links/list-orphans.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listOrphansHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI orphans command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('lonely.md')
    await listOrphansHandler({ vault: undefined }, cli)
    expect(cli.run).toHaveBeenCalledWith('orphans', { vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('error'))
    const result = await listOrphansHandler({ vault: undefined }, cli)
    expect(result.isError).toBe(true)
  })
})

describe('registerListOrphansTool', () => {
  it('registers tool with name obsidian_list_orphans', () => {
    const server = { registerTool: vi.fn() }
    registerListOrphansTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_orphans', expect.objectContaining({ title: 'List Orphans' }), expect.any(Function))
  })
})
