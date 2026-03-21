import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { GovernedVaultService } from '../../services/governed-vault.service.js'

type GovernedListBacklinksParams = {
  path: string
}

export function registerGovernedListBacklinksTool(
  server: McpServer,
  governedVault: GovernedVaultService,
): void {
  server.registerTool(
    'obsidian_list_backlinks',
    {
      title: 'List Governed Backlinks',
      description: 'List backlinks to an allowed note with server-side policy filtering',
      inputSchema: {
        path: z.string().describe('Exact governed note path'),
      },
    },
    (params: GovernedListBacklinksParams) => {
      try {
        const links = governedVault.listBacklinks(params.path)
        return {
          content: [
            { type: 'text' as const, text: links.length ? links.join('\n') : 'No governed backlinks found.' },
          ],
        }
      } catch (error) {
        return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
      }
    },
  )
}
