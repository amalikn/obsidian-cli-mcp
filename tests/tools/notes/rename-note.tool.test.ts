import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { renameNoteHandler, registerRenameNoteTool } from '../../../src/tools/notes/rename-note.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('renameNoteHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI rename command with file and new name', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Renamed')

    await renameNoteHandler({ file: 'Old Name', path: undefined, name: 'New Name', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('rename', { file: 'Old Name', path: undefined, name: 'New Name', vault: undefined })
  })

  it('calls CLI rename command with path', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Renamed')

    await renameNoteHandler({ file: undefined, path: 'folder/old.md', name: 'new', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('rename', expect.objectContaining({ path: 'folder/old.md', name: 'new' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Note not found'))

    const result = await renameNoteHandler({ file: 'missing', path: undefined, name: 'new', vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerRenameNoteTool', () => {
  it('registers tool with name obsidian_rename_note', () => {
    const server = { registerTool: vi.fn() }
    registerRenameNoteTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_rename_note', expect.objectContaining({ title: 'Rename Note' }), expect.any(Function))
  })
})
