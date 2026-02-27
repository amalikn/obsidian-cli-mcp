import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listTemplatesHandler, registerListTemplatesTool } from '../../../src/tools/templates/list-templates.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listTemplatesHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI templates command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('template-a.md\ntemplate-b.md')

    await listTemplatesHandler({ total: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('templates', { total: undefined, vault: undefined })
  })

  it('passes total flag when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('42')

    await listTemplatesHandler({ total: true, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('templates', expect.objectContaining({ total: true }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('No templates folder'))

    const result = await listTemplatesHandler({ total: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListTemplatesTool', () => {
  it('registers tool with name obsidian_list_templates', () => {
    const server = { registerTool: vi.fn() }
    registerListTemplatesTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_templates', expect.objectContaining({ title: 'List Templates' }), expect.any(Function))
  })
})
