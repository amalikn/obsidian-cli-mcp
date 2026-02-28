import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type UninstallPluginParams = { id: string; vault: string | undefined }

export async function uninstallPluginHandler(params: UninstallPluginParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('plugin:uninstall', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerUninstallPluginTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_uninstall_plugin',
    {
      title: 'Uninstall Plugin',
      description: 'Uninstall a community plugin by its id',
      inputSchema: {
        id: z.string().describe('Plugin id (required)'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => uninstallPluginHandler(params, cli),
  )
}
