import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { appendNoteHandler, registerAppendNoteTool } from '../../../src/tools/notes/append-note.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('appendNoteHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => {
    cli = makeCli()
  })

  it('calls CLI append command with content', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('')

    await appendNoteHandler({ file: 'My Note', content: 'New line', path: undefined, inline: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('append', {
      file: 'My Note',
      content: 'New line',
      path: undefined,
      inline: undefined,
      vault: undefined,
    })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Note not found'))

    const result = await appendNoteHandler({ file: 'Missing', content: 'text', path: undefined, inline: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerAppendNoteTool', () => {
  it('registers tool with name obsidian_append_note', () => {
    const server = { registerTool: vi.fn() }
    registerAppendNoteTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_append_note', expect.objectContaining({ title: 'Append to Note' }), expect.any(Function))
  })
})
