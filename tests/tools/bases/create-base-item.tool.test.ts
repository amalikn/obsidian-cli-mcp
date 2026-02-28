import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { createBaseItemHandler, registerCreateBaseItemTool } from '../../../src/tools/bases/create-base-item.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('createBaseItemHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI base:create command with required params', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Item created')

    await createBaseItemHandler({ file: 'projects.base', path: undefined, view: undefined, name: 'New Project', content: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('base:create', { file: 'projects.base', path: undefined, view: undefined, name: 'New Project', content: undefined, vault: undefined })
  })

  it('passes view and content when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Item created')

    await createBaseItemHandler({ file: 'projects.base', path: undefined, view: 'table', name: 'New Project', content: '# New Project', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('base:create', expect.objectContaining({ view: 'table', content: '# New Project' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Base not found'))

    const result = await createBaseItemHandler({ file: 'missing.base', path: undefined, view: undefined, name: 'item', content: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerCreateBaseItemTool', () => {
  it('registers tool with name obsidian_create_base_item', () => {
    const server = { registerTool: vi.fn() }
    registerCreateBaseItemTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_create_base_item', expect.objectContaining({ title: 'Create Base Item' }), expect.any(Function))
  })
})
