import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type EnableSnippetParams = {
  name: string
  vault: string | undefined
}

export async function enableSnippetHandler(params: EnableSnippetParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('snippet:enable', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerEnableSnippetTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_enable_snippet',
    {
      title: 'Enable Snippet',
      description: 'Enable a CSS snippet by name. Use this when the user wants to activate, turn on, or apply a CSS snippet.',
      inputSchema: {
        name: z.string().describe('Snippet name (required)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => enableSnippetHandler(params, cli),
  )
}
