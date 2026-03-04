import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type EvalParams = {
  code: string
  vault: string | undefined
}

export async function evalHandler(params: EvalParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('eval', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerEvalTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_eval',
    {
      title: 'Evaluate JavaScript',
      description: 'Execute a JavaScript expression in the Obsidian application context and return the result. Use this for advanced automation when the user wants to run custom JS code inside Obsidian.',
      inputSchema: {
        code: z.string().describe('JavaScript expression or code to execute inside Obsidian'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => evalHandler(params, cli),
  )
}
