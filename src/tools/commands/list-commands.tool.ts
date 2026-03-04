import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListCommandsParams = {
  filter: string | undefined
  vault: string | undefined
}

export async function listCommandsHandler(params: ListCommandsParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('commands', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListCommandsTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_commands',
    {
      title: 'List Commands',
      description: 'List all available Obsidian commands (command palette entries). Use this when the user asks about available commands, command palette, or what actions Obsidian can perform.',
      inputSchema: {
        filter: z.string().optional().describe('Filter commands by name or id'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listCommandsHandler(params, cli),
  )
}
