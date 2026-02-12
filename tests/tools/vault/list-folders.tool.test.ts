import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listFoldersHandler, registerListFoldersTool } from '../../../src/tools/vault/list-folders.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listFoldersHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI folders command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('notes/\narchive/')

    await listFoldersHandler({ folder: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('folders', { folder: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('error'))

    const result = await listFoldersHandler({ folder: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListFoldersTool', () => {
  it('registers tool with name obsidian_list_folders', () => {
    const server = { registerTool: vi.fn() }
    registerListFoldersTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_folders', expect.objectContaining({ title: 'List Folders' }), expect.any(Function))
  })
})
