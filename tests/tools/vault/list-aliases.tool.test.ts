import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listAliasesHandler, registerListAliasesTool } from '../../../src/tools/vault/list-aliases.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listAliasesHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI aliases command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('alias-a\nalias-b')

    await listAliasesHandler({ file: undefined, path: undefined, total: undefined, verbose: undefined, active: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('aliases', { file: undefined, path: undefined, total: undefined, verbose: undefined, active: undefined, vault: undefined })
  })

  it('passes params when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await listAliasesHandler({ file: 'note.md', path: undefined, total: true, verbose: true, active: true, vault: 'my-vault' }, cli)

    expect(cli.run).toHaveBeenCalledWith('aliases', expect.objectContaining({ file: 'note.md', total: true, verbose: true, active: true, vault: 'my-vault' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('CLI error'))

    const result = await listAliasesHandler({ file: undefined, path: undefined, total: undefined, verbose: undefined, active: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListAliasesTool', () => {
  it('registers tool with name obsidian_list_aliases', () => {
    const server = { registerTool: vi.fn() }
    registerListAliasesTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_aliases', expect.objectContaining({ title: 'List Aliases' }), expect.any(Function))
  })
})
