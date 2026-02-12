import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { readNoteHandler, registerReadNoteTool } from '../../../src/tools/notes/read-note.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('readNoteHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => {
    cli = makeCli()
  })

  it('calls CLI read command with file arg', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('# My Note\nContent')

    await readNoteHandler({ file: 'My Note', path: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('read', { file: 'My Note', path: undefined, vault: undefined })
  })

  it('calls CLI read command with path arg', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('# Note')

    await readNoteHandler({ file: undefined, path: 'folder/note.md', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('read', { file: undefined, path: 'folder/note.md', vault: undefined })
  })

  it('returns CLI output as text content', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('# My Note\nContent')

    const result = await readNoteHandler({ file: 'My Note', path: undefined, vault: undefined }, cli)

    expect(result).toEqual({ content: [{ type: 'text', text: '# My Note\nContent' }] })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Note not found'))

    const result = await readNoteHandler({ file: 'Missing', path: undefined, vault: undefined }, cli)

    expect(result).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'Note not found' }],
    })
  })
})

describe('registerReadNoteTool', () => {
  it('registers tool with name obsidian_read_note', () => {
    const server = { registerTool: vi.fn() }
    const cli = makeCli()

    registerReadNoteTool(server as never, cli)

    expect(server.registerTool).toHaveBeenCalledWith(
      'obsidian_read_note',
      expect.objectContaining({ title: 'Read Note' }),
      expect.any(Function),
    )
  })
})
