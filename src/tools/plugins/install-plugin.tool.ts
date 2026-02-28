import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from '../../services/obsidian-cli.service.js'

type InstallPluginParams = { id: string; enable: boolean | undefined; vault: string | undefined }

export async function installPluginHandler(params: InstallPluginParams, cli: ObsidianCliService) {
  try {
    const output = await cli.run('plugin:install', params)
    return { content: [{ type: 'text' as const, text: output }] }
  } catch (error) {
    return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
  }
}

export function registerInstallPluginTool(server: McpServer, cli: ObsidianCliService): void {
  server.registerTool(
    'obsidian_install_plugin',
    {
      title: 'Install Plugin',
      description: 'Install a community plugin by its id',
      inputSchema: {
        id: z.string().describe('Plugin id (required)'),
        enable: z.boolean().optional().describe('Enable the plugin after installation'),
        vault: z.string().optional().describe('Vault name. Uses default vault if omitted.'),
      },
    },
    (params) => installPluginHandler(params, cli),
  )
}
