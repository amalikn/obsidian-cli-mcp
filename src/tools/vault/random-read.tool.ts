import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type RandomReadParams = {
  folder: string | undefined
  vault: string | undefined
}

export async function randomReadHandler(params: RandomReadParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('random:read', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerRandomReadTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_random_read',
    {
      title: 'Read Random Note',
      description: 'Read a random note from the vault or from a specific folder. Use this when the user wants to discover a random note or explore the vault randomly.',
      inputSchema: {
        folder: z.string().optional().describe('Folder to pick a random note from'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => randomReadHandler(params, cli),
  )
}
