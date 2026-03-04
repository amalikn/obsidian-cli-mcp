import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListVaultsParams = {
  total: boolean | undefined
  verbose: boolean | undefined
}

export async function listVaultsHandler(params: ListVaultsParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('vaults', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListVaultsTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_vaults',
    {
      title: 'List Vaults',
      description: 'List all Obsidian vaults known to the application. Use this when the user asks which vaults are available, configured, or accessible.',
      inputSchema: {
        total: z.boolean().optional().describe('Show total count only'),
        verbose: z.boolean().optional().describe('Show verbose output'),
      },
    },
    (params) => listVaultsHandler(params, cli),
  )
}
