import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { moveNoteHandler, registerMoveNoteTool } from '../../../src/tools/notes/move-note.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('moveNoteHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => {
    cli = makeCli()
  })

  it('calls CLI move command with file and to args', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('')

    await moveNoteHandler({ file: 'My Note', to: 'Archive/', path: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('move', {
      file: 'My Note',
      to: 'Archive/',
      path: undefined,
      vault: undefined,
    })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Destination not found'))

    const result = await moveNoteHandler({ file: 'note', to: 'bad/path', path: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerMoveNoteTool', () => {
  it('registers tool with name obsidian_move_note', () => {
    const server = { registerTool: vi.fn() }
    registerMoveNoteTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_move_note', expect.objectContaining({ title: 'Move Note' }), expect.any(Function))
  })
})
