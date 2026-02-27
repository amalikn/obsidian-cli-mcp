import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { readTemplateHandler, registerReadTemplateTool } from '../../../src/tools/templates/read-template.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('readTemplateHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI template:read command with name', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('# {{title}}\n\nContent')

    await readTemplateHandler({ name: 'daily', resolve: undefined, title: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('template:read', { name: 'daily', resolve: undefined, title: undefined, vault: undefined })
  })

  it('passes resolve flag when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('# My Note\n\nContent')

    await readTemplateHandler({ name: 'daily', resolve: true, title: 'My Note', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('template:read', expect.objectContaining({ resolve: true, title: 'My Note' }))
  })

  it('returns template content as text', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('# {{title}}')

    const result = await readTemplateHandler({ name: 'daily', resolve: undefined, title: undefined, vault: undefined }, cli)

    expect(result).toEqual({ content: [{ type: 'text', text: '# {{title}}' }] })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Template not found'))

    const result = await readTemplateHandler({ name: 'missing', resolve: undefined, title: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerReadTemplateTool', () => {
  it('registers tool with name obsidian_read_template', () => {
    const server = { registerTool: vi.fn() }
    registerReadTemplateTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_read_template', expect.objectContaining({ title: 'Read Template' }), expect.any(Function))
  })
})
