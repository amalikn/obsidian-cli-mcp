import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { queryBaseHandler, registerQueryBaseTool } from '../../../src/tools/bases/query-base.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('queryBaseHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI base:query command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('item1\nitem2')

    await queryBaseHandler({ file: 'projects.base', path: undefined, view: undefined, format: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('base:query', { file: 'projects.base', path: undefined, view: undefined, format: undefined, vault: undefined })
  })

  it('passes view and format when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('[{"name":"item1"}]')

    await queryBaseHandler({ file: 'projects.base', path: undefined, view: 'table', format: 'json', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('base:query', expect.objectContaining({ view: 'table', format: 'json' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Base not found'))

    const result = await queryBaseHandler({ file: 'missing.base', path: undefined, view: undefined, format: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerQueryBaseTool', () => {
  it('registers tool with name obsidian_query_base', () => {
    const server = { registerTool: vi.fn() }
    registerQueryBaseTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_query_base', expect.objectContaining({ title: 'Query Base' }), expect.any(Function))
  })
})
