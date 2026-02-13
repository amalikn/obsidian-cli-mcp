import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type ToggleTaskParams = {
  file: string | undefined
  path: string | undefined
  line: string
  vault: string | undefined
}

export async function toggleTaskHandler(params: ToggleTaskParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('task', { ...params, toggle: true })
    return { content: [{ type: 'text' as const, text: output || 'Task toggled.' }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerToggleTaskTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_toggle_task',
    {
      title: 'Toggle Task',
      description: 'Toggle the completion status of a task by line number',
      inputSchema: {
        file: z.string().optional().describe('Note name (fuzzy match)'),
        path: z.string().optional().describe('Exact file path'),
        line: z.string().describe('Line number of the task (required)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => toggleTaskHandler(params, cli),
  )
}
