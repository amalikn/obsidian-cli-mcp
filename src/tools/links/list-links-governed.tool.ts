import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { GovernedVaultService } from '../../services/governed-vault.service.js'

type GovernedListLinksParams = {
  path: string
}

export function registerGovernedListLinksTool(
  server: McpServer,
  governedVault: GovernedVaultService,
): void {
  server.registerTool(
    'obsidian_list_links',
    {
      title: 'List Governed Links',
      description: 'List outgoing links from an allowed note with server-side policy filtering',
      inputSchema: {
        path: z.string().describe('Exact governed note path'),
      },
    },
    (params: GovernedListLinksParams) => {
      try {
        const links = governedVault.listLinks(params.path)
        return {
          content: [{ type: 'text' as const, text: links.length ? links.join('\n') : 'No governed links found.' }],
        }
      } catch (error) {
        return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
      }
    },
  )
}
