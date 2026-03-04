import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListSnippetsEnabledParams = {
  vault: string | undefined
}

export async function listSnippetsEnabledHandler(params: ListSnippetsEnabledParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('snippets:enabled', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListSnippetsEnabledTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_snippets_enabled',
    {
      title: 'List Enabled Snippets',
      description: 'List only the currently active/enabled CSS snippets. Use this when the user asks which snippets are active, turned on, or currently applied.',
      inputSchema: {
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listSnippetsEnabledHandler(params, cli),
  )
}
