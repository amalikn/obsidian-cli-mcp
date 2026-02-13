import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ListTasksParams = {
  file: string | undefined
  path: string | undefined
  done: boolean | undefined
  todo: boolean | undefined
  vault: string | undefined
}

export async function listTasksHandler(params: ListTasksParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('tasks', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerListTasksTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_list_tasks',
    {
      title: 'List Tasks',
      description: 'List tasks in the vault, optionally filtered by completion status or file',
      inputSchema: {
        file: z.string().optional().describe('Filter by note name'),
        path: z.string().optional().describe('Filter by exact file path'),
        done: z.boolean().optional().describe('Show only completed tasks'),
        todo: z.boolean().optional().describe('Show only incomplete tasks'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => listTasksHandler(params, cli),
  )
}
