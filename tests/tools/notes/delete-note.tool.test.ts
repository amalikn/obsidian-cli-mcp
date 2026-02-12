import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { deleteNoteHandler, registerDeleteNoteTool } from '../../../src/tools/notes/delete-note.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('deleteNoteHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => {
    cli = makeCli()
  })

  it('calls CLI delete command with file arg', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('')

    await deleteNoteHandler({ file: 'Old Note', path: undefined, permanent: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('delete', {
      file: 'Old Note',
      path: undefined,
      permanent: undefined,
      vault: undefined,
    })
  })

  it('passes permanent flag when requested', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('')

    await deleteNoteHandler({ file: 'Old Note', path: undefined, permanent: true, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('delete', expect.objectContaining({ permanent: true }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('File not found'))

    const result = await deleteNoteHandler({ file: 'Missing', path: undefined, permanent: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerDeleteNoteTool', () => {
  it('registers tool with name obsidian_delete_note', () => {
    const server = { registerTool: vi.fn() }
    registerDeleteNoteTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_delete_note', expect.objectContaining({ title: 'Delete Note' }), expect.any(Function))
  })
})
