import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listFilesHandler, registerListFilesTool } from '../../../src/tools/vault/list-files.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listFilesHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI files command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('note1.md\nnote2.md')

    await listFilesHandler({ folder: undefined, ext: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('files', { folder: undefined, ext: undefined, vault: undefined })
  })

  it('passes folder filter when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('notes/a.md')

    await listFilesHandler({ folder: 'notes', ext: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('files', expect.objectContaining({ folder: 'notes' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Vault not found'))

    const result = await listFilesHandler({ folder: undefined, ext: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListFilesTool', () => {
  it('registers tool with name obsidian_list_files', () => {
    const server = { registerTool: vi.fn() }
    registerListFilesTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_files', expect.objectContaining({ title: 'List Files' }), expect.any(Function))
  })
})
