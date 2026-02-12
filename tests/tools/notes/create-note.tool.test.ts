import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { createNoteHandler, registerCreateNoteTool } from '../../../src/tools/notes/create-note.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('createNoteHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => {
    cli = makeCli()
  })

  it('calls CLI create command with name and content', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('')

    await createNoteHandler({ name: 'New Note', content: '# New Note', path: undefined, template: undefined, overwrite: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('create', {
      name: 'New Note',
      content: '# New Note',
      path: undefined,
      template: undefined,
      overwrite: undefined,
      vault: undefined,
    })
  })

  it('returns success confirmation text', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('')

    const result = await createNoteHandler({ name: 'New Note', content: undefined, path: undefined, template: undefined, overwrite: undefined, vault: undefined }, cli)

    expect(result.content[0].type).toBe('text')
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('File already exists'))

    const result = await createNoteHandler({ name: 'Existing', content: undefined, path: undefined, template: undefined, overwrite: undefined, vault: undefined }, cli)

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'File already exists' }],
    })
  })
})

describe('registerCreateNoteTool', () => {
  it('registers tool with name obsidian_create_note', () => {
    const server = { registerTool: vi.fn() }
    registerCreateNoteTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_create_note', expect.objectContaining({ title: 'Create Note' }), expect.any(Function))
  })
})
