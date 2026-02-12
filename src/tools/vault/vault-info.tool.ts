import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type VaultInfoParams = { vault: string | undefined }

export async function vaultInfoHandler(params: VaultInfoParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('vault', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerVaultInfoTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_vault_info',
    {
      title: 'Vault Info',
      description: 'Show information about the current Obsidian vault (name, path, file count)',
      inputSchema: {
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => vaultInfoHandler(params, cli),
  )
}
