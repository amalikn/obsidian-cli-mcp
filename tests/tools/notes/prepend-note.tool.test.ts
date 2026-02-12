import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { prependNoteHandler, registerPrependNoteTool } from '../../../src/tools/notes/prepend-note.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('prependNoteHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => {
    cli = makeCli()
  })

  it('calls CLI prepend command with content', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('')

    await prependNoteHandler({ file: 'My Note', content: 'Intro', path: undefined, inline: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('prepend', {
      file: 'My Note',
      content: 'Intro',
      path: undefined,
      inline: undefined,
      vault: undefined,
    })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Note not found'))

    const result = await prependNoteHandler({ file: 'Missing', content: 'text', path: undefined, inline: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerPrependNoteTool', () => {
  it('registers tool with name obsidian_prepend_note', () => {
    const server = { registerTool: vi.fn() }
    registerPrependNoteTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_prepend_note', expect.objectContaining({ title: 'Prepend to Note' }), expect.any(Function))
  })
})
