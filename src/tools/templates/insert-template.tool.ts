import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type InsertTemplateParams = { name: string; vault: string | undefined }

export async function insertTemplateHandler(params: InsertTemplateParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('template:insert', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerInsertTemplateTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_insert_template',
    {
      title: 'Insert Template',
      description: 'Insert a template into the currently active note in Obsidian',
      inputSchema: {
        name: z.string().describe('Template name (required)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => insertTemplateHandler(params, cli),
  )
}
