import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type GetTagParams = { name: string; vault: string | undefined }

export async function getTagHandler(params: GetTagParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('tag', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerGetTagTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_get_tag',
    {
      title: 'Get Tag',
      description: 'Get info about a specific tag including occurrence count and files',
      inputSchema: {
        name: z.string().describe('Tag name (required)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => getTagHandler(params, cli),
  )
}
