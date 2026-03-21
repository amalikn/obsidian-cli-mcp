import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ObsidianCliService } from './services/obsidian-cli.service.js'
import { GovernedVaultService } from './services/governed-vault.service.js'
import type { VaultPolicy } from './vault-policy.js'
import { isGovernedProfile, type McpProfile, DEFAULT_MCP_PROFILE } from './runtime-config.js'
import { registerToolsForProfile } from './tool-registry.js'

interface CreateServerOptions {
  obsidianBin?: string
  defaultVault?: string
  profile?: McpProfile
  vaultPolicy?: VaultPolicy
}

export function createServer(options: CreateServerOptions = {}): McpServer {
  const profile = options.profile ?? DEFAULT_MCP_PROFILE
  const governedVault = isGovernedProfile(profile) && options.vaultPolicy
    ? new GovernedVaultService(options.vaultPolicy)
    : undefined
  const cli = new ObsidianCliService(
    options.obsidianBin ?? process.env['OBSIDIAN_BIN'] ?? 'obsidian',
    options.defaultVault ?? process.env['OBSIDIAN_VAULT'] ?? undefined,
    {
      allowPerCallVaultOverride: !isGovernedProfile(profile),
      profile,
      vaultPolicy: options.vaultPolicy,
    },
  )

  const server = new McpServer({ name: 'obsidian-cli-mcp', version: '0.1.0' })

  registerToolsForProfile(server, cli, profile, governedVault)

  return server
}
