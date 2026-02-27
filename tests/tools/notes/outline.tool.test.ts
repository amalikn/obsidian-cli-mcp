import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { outlineHandler, registerOutlineTool } from '../../../src/tools/notes/outline.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('outlineHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI outline command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('# H1\n## H2')

    await outlineHandler({ file: 'My Note', path: undefined, format: undefined, total: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('outline', { file: 'My Note', path: undefined, format: undefined, total: undefined, vault: undefined })
  })

  it('returns outline as text', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('# H1\n## H2')

    const result = await outlineHandler({ file: 'My Note', path: undefined, format: undefined, total: undefined, vault: undefined }, cli)

    expect(result).toEqual({ content: [{ type: 'text', text: '# H1\n## H2' }] })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Note not found'))

    const result = await outlineHandler({ file: 'missing', path: undefined, format: undefined, total: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerOutlineTool', () => {
  it('registers tool with name obsidian_outline', () => {
    const server = { registerTool: vi.fn() }
    registerOutlineTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_outline', expect.objectContaining({ title: 'Note Outline' }), expect.any(Function))
  })
})
