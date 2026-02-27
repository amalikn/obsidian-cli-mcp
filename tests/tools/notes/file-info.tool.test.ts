import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { fileInfoHandler, registerFileInfoTool } from '../../../src/tools/notes/file-info.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('fileInfoHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI file command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('path: folder/note.md\nsize: 1024')

    await fileInfoHandler({ file: 'My Note', path: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('file', { file: 'My Note', path: undefined, vault: undefined })
  })

  it('returns file info as text', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('path: folder/note.md')

    const result = await fileInfoHandler({ file: 'My Note', path: undefined, vault: undefined }, cli)

    expect(result).toEqual({ content: [{ type: 'text', text: 'path: folder/note.md' }] })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('File not found'))

    const result = await fileInfoHandler({ file: 'missing', path: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerFileInfoTool', () => {
  it('registers tool with name obsidian_file_info', () => {
    const server = { registerTool: vi.fn() }
    registerFileInfoTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_file_info', expect.objectContaining({ title: 'File Info' }), expect.any(Function))
  })
})
