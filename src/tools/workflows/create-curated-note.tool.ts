import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { GovernedVaultService } from '../../services/governed-vault.service.js'

const variablesSchema = z.record(z.string()).optional()

type CreateCuratedNoteParams = {
  sourcePath: string
  templateType: string
  destinationPath: string
  variables: Record<string, string> | undefined
}

export function registerCreateCuratedNoteTool(
  server: McpServer,
  governedVault: GovernedVaultService,
): void {
  server.registerTool(
    'obsidian_create_curated_note',
    {
      title: 'Create Curated Note',
      description: 'Create a curated governed note from an approved template while preserving source provenance',
      inputSchema: {
        sourcePath: z.string().describe('Exact governed source note path'),
        templateType: z.string().describe('Approved curated template type'),
        destinationPath: z.string().describe('Exact approved destination path'),
        variables: variablesSchema.describe('Optional controlled template variables'),
      },
    },
    (params: CreateCuratedNoteParams) => {
      try {
        const result = governedVault.createCuratedNote(
          params.sourcePath,
          params.templateType,
          params.destinationPath,
          params.variables,
        )
        return {
          content: [
            {
              type: 'text' as const,
              text: `Created curated note ${result.destinationPath} from ${params.sourcePath}.`,
            },
          ],
        }
      } catch (error) {
        return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
      }
    },
  )
}
