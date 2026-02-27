import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { insertTemplateHandler, registerInsertTemplateTool } from '../../../src/tools/templates/insert-template.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('insertTemplateHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI template:insert command with name', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('')

    await insertTemplateHandler({ name: 'daily', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('template:insert', { name: 'daily', vault: undefined })
  })

  it('returns CLI output as text', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Template inserted')

    const result = await insertTemplateHandler({ name: 'daily', vault: undefined }, cli)

    expect(result).toEqual({ content: [{ type: 'text', text: 'Template inserted' }] })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('No active file'))

    const result = await insertTemplateHandler({ name: 'daily', vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerInsertTemplateTool', () => {
  it('registers tool with name obsidian_insert_template', () => {
    const server = { registerTool: vi.fn() }
    registerInsertTemplateTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_insert_template', expect.objectContaining({ title: 'Insert Template' }), expect.any(Function))
  })
})
