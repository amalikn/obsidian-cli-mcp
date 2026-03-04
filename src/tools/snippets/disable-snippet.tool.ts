import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type DisableSnippetParams = {
  name: string
  vault: string | undefined
}

export async function disableSnippetHandler(params: DisableSnippetParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('snippet:disable', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerDisableSnippetTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_disable_snippet',
    {
      title: 'Disable Snippet',
      description: 'Disable a CSS snippet by name. Use this when the user wants to deactivate, turn off, or remove a CSS snippet.',
      inputSchema: {
        name: z.string().describe('Snippet name (required)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => disableSnippetHandler(params, cli),
  )
}
