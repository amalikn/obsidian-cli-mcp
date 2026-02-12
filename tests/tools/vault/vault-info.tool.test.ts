import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { vaultInfoHandler, registerVaultInfoTool } from '../../../src/tools/vault/vault-info.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('vaultInfoHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI vault command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('vault: MyVault\npath: /path/to/vault')

    await vaultInfoHandler({ vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('vault', { vault: undefined })
  })

  it('returns vault info as text', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('vault: MyVault')

    const result = await vaultInfoHandler({ vault: undefined }, cli)

    expect(result.content[0].text).toBe('vault: MyVault')
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('No vault open'))

    const result = await vaultInfoHandler({ vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerVaultInfoTool', () => {
  it('registers tool with name obsidian_vault_info', () => {
    const server = { registerTool: vi.fn() }
    registerVaultInfoTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_vault_info', expect.objectContaining({ title: 'Vault Info' }), expect.any(Function))
  })
})
