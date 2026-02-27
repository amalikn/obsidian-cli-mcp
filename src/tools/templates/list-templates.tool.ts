import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListTemplatesParams = { total: boolean | undefined; vault: string | undefined }

export async function listTemplatesHandler(params: ListTemplatesParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('templates', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListTemplatesTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_templates',
    {
      title: 'List Templates',
      description: 'List all templates available in the vault',
      inputSchema: {
        total: z.boolean().optional().describe('Show only the total count'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listTemplatesHandler(params, cli),
  )
}
