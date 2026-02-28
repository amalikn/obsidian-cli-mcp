import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listBasesHandler, registerListBasesTool } from '../../../src/tools/bases/list-bases.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listBasesHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI bases command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('projects.base\ntasks.base')

    await listBasesHandler({ vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('bases', { vault: undefined })
  })

  it('returns bases list as text', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('projects.base')

    const result = await listBasesHandler({ vault: undefined }, cli)

    expect(result).toEqual({ content: [{ type: 'text', text: 'projects.base' }] })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Bases plugin not enabled'))

    const result = await listBasesHandler({ vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListBasesTool', () => {
  it('registers tool with name obsidian_list_bases', () => {
    const server = { registerTool: vi.fn() }
    registerListBasesTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_bases', expect.objectContaining({ title: 'List Bases' }), expect.any(Function))
  })
})
