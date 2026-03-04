import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ExecuteCommandParams = {
  id: string
  vault: string | undefined
}

export async function executeCommandHandler(params: ExecuteCommandParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('command', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerExecuteCommandTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_execute_command',
    {
      title: 'Execute Command',
      description: 'Execute an Obsidian command by its ID. Use this when the user wants to run a command, trigger an action, or execute something from the command palette.',
      inputSchema: {
        id: z.string().describe('The command ID to execute'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => executeCommandHandler(params, cli),
  )
}
