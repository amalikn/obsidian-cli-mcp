import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListSnippetsParams = {
  vault: string | undefined
}

export async function listSnippetsHandler(params: ListSnippetsParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('snippets', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListSnippetsTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_snippets',
    {
      title: 'List Snippets',
      description: 'List all CSS snippets installed in the Obsidian vault. Use this when the user asks about CSS snippets, custom styles, or installed style overrides.',
      inputSchema: {
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listSnippetsHandler(params, cli),
  )
}
