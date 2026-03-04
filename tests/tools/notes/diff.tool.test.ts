import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { diffHandler, registerDiffTool } from '../../../src/tools/notes/diff.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('diffHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI diff command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('- old line\n+ new line')

    await diffHandler({ file: 'note.md', path: undefined, from: undefined, to: undefined, filter: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('diff', expect.objectContaining({ file: 'note.md' }))
  })

  it('passes from and to dates when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await diffHandler({ file: 'note.md', path: undefined, from: '2024-01-01', to: '2024-01-31', filter: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('diff', expect.objectContaining({ from: '2024-01-01', to: '2024-01-31' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Vault error'))

    const result = await diffHandler({ file: undefined, path: undefined, from: undefined, to: undefined, filter: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerDiffTool', () => {
  it('registers tool with name obsidian_diff', () => {
    const server = { registerTool: vi.fn() }
    registerDiffTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_diff', expect.objectContaining({ title: 'Diff Note Versions' }), expect.any(Function))
  })
})
