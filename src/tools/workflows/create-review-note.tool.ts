import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { GovernedVaultService } from '../../services/governed-vault.service.js'

const variablesSchema = z.record(z.string()).optional()

type CreateReviewNoteParams = {
  sourcePath: string
  destinationPath: string | undefined
  variables: Record<string, string> | undefined
}

export function registerCreateReviewNoteTool(
  server: McpServer,
  governedVault: GovernedVaultService,
): void {
  server.registerTool(
    'obsidian_create_review_note',
    {
      title: 'Create Review Note',
      description: 'Create a provenance-preserving review note for a governed source note',
      inputSchema: {
        sourcePath: z.string().describe('Exact governed source note path'),
        destinationPath: z.string().optional().describe('Optional exact destination path override'),
        variables: variablesSchema.describe('Optional controlled template variables'),
      },
    },
    (params: CreateReviewNoteParams) => {
      try {
        const result = governedVault.createReviewNote(
          params.sourcePath,
          params.destinationPath,
          params.variables,
        )
        return {
          content: [
            {
              type: 'text' as const,
              text: `Created review note ${result.destinationPath} from ${params.sourcePath}.`,
            },
          ],
        }
      } catch (error) {
        return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
      }
    },
  )
}
