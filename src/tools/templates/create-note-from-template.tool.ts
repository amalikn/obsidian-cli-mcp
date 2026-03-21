import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { GovernedVaultService } from '../../services/governed-vault.service.js'

const variablesSchema = z.record(z.string()).optional()

type CreateNoteFromTemplateParams = {
  templateType: string
  destinationPath: string
  variables: Record<string, string> | undefined
  provenance: Record<string, string> | undefined
}

export function registerCreateNoteFromTemplateTool(
  server: McpServer,
  governedVault: GovernedVaultService,
): void {
  server.registerTool(
    'obsidian_create_note_from_template',
    {
      title: 'Create Note From Governed Template',
      description: 'Create a governed note from an approved template type into an approved destination path',
      inputSchema: {
        templateType: z.string().describe('Approved governed template type'),
        destinationPath: z.string().describe('Exact destination path for the new note'),
        variables: variablesSchema.describe('Optional controlled template variables'),
        provenance: variablesSchema.describe('Optional provenance fields to merge into frontmatter'),
      },
    },
    (params: CreateNoteFromTemplateParams) => {
      try {
        const result = governedVault.createNoteFromTemplate({
          templateType: params.templateType,
          destinationPath: params.destinationPath,
          variables: params.variables,
          provenance: params.provenance,
        })

        return {
          content: [
            {
              type: 'text' as const,
              text: `Created ${result.destinationPath} from governed template ${result.templateType}.`,
            },
          ],
        }
      } catch (error) {
        return { isError: true, content: [{ type: 'text' as const, text: (error as Error).message }] }
      }
    },
  )
}
