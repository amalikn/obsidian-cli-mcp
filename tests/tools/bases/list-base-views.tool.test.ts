import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listBaseViewsHandler, registerListBaseViewsTool } from '../../../src/tools/bases/list-base-views.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listBaseViewsHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI base:views command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('table\ngallery')

    await listBaseViewsHandler({ file: 'projects.base', path: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('base:views', { file: 'projects.base', path: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Base not found'))

    const result = await listBaseViewsHandler({ file: 'missing.base', path: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListBaseViewsTool', () => {
  it('registers tool with name obsidian_list_base_views', () => {
    const server = { registerTool: vi.fn() }
    registerListBaseViewsTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_base_views', expect.objectContaining({ title: 'List Base Views' }), expect.any(Function))
  })
})
