import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type WorkspaceParams = {
  ids: boolean | undefined
  vault: string | undefined
}

export async function workspaceHandler(params: WorkspaceParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('workspace', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerWorkspaceTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_workspace',
    {
      title: 'Get Workspace',
      description: 'Get the current Obsidian workspace layout including open panes and tabs. Use this when the user asks about the current workspace, open panes, or window layout.',
      inputSchema: {
        ids: z.boolean().optional().describe('Include IDs in output'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => workspaceHandler(params, cli),
  )
}
