import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listVaultsHandler, registerListVaultsTool } from '../../../src/tools/vault/list-vaults.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listVaultsHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI vaults command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('vault-a\nvault-b')

    await listVaultsHandler({ total: undefined, verbose: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('vaults', { total: undefined, verbose: undefined })
  })

  it('passes params when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await listVaultsHandler({ total: true, verbose: true }, cli)

    expect(cli.run).toHaveBeenCalledWith('vaults', expect.objectContaining({ total: true, verbose: true }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('CLI error'))

    const result = await listVaultsHandler({ total: undefined, verbose: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListVaultsTool', () => {
  it('registers tool with name obsidian_list_vaults', () => {
    const server = { registerTool: vi.fn() }
    registerListVaultsTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_vaults', expect.objectContaining({ title: 'List Vaults' }), expect.any(Function))
  })
})
