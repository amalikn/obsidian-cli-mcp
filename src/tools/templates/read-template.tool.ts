import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ReadTemplateParams = {
  name: string
  resolve: boolean | undefined
  title: string | undefined
  vault: string | undefined
}

export async function readTemplateHandler(params: ReadTemplateParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('template:read', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerReadTemplateTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_read_template',
    {
      title: 'Read Template',
      description: 'Read the content of a template, optionally resolving variables',
      inputSchema: {
        name: z.string().describe('Template name (required)'),
        resolve: z.boolean().optional().describe('Resolve template variables (e.g. {{title}}, {{date}})'),
        title: z.string().optional().describe('Title to use when resolving template variables'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => readTemplateHandler(params, cli),
  )
}
