import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { GovernedVaultService } from '../../services/governed-vault.service.js'

type LogPromotionParams = {
  sourcePath: string
  curatedPath: string
  destinationPath: string | undefined
  notes: string | undefined
}

export function registerLogPromotionTool(
  server: McpServer,
  governedVault: GovernedVaultService,
): void {
  server.registerTool(
    'obsidian_log_promotion',
    {
      title: 'Log Promotion',
      description: 'Create a governed promotion log entry linking the source and curated notes',
      inputSchema: {
        sourcePath: z.string().describe('Exact governed source note path'),
        curatedPath: z.string().describe('Exact governed curated note path'),
        destinationPath: z.string().optional().describe('Optional exact promotion log note path'),
        notes: z.string().optional().describe('Optional promotion notes to include in the log'),
      },
    },
    (params: LogPromotionParams) => {
      try {
        const result = governedVault.logPromotion({
          sourcePath: params.sourcePath,
          curatedPath: params.curatedPath,
          destinationPath: params.destinationPath,
          notes: params.notes,
        })
        return {
          content: [
            {
              type: 'text' as const,
              text: `Created promotion log ${result.destinationPath} for ${params.sourcePath}.`,
            },
          ],
        }
      } catch (error) {
        return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
      }
    },
  )
}
