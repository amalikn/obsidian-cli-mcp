import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ObsidianCliService } from './services/obsidian-cli.service.js'
import { registerReadNoteTool } from './tools/notes/read-note.tool.js'
import { registerCreateNoteTool } from './tools/notes/create-note.tool.js'
import { registerAppendNoteTool } from './tools/notes/append-note.tool.js'
import { registerPrependNoteTool } from './tools/notes/prepend-note.tool.js'
import { registerMoveNoteTool } from './tools/notes/move-note.tool.js'
import { registerDeleteNoteTool } from './tools/notes/delete-note.tool.js'
import { registerVaultInfoTool } from './tools/vault/vault-info.tool.js'
import { registerListFilesTool } from './tools/vault/list-files.tool.js'
import { registerListFoldersTool } from './tools/vault/list-folders.tool.js'
import { registerSearchNotesTool } from './tools/search/search-notes.tool.js'
import { registerSearchContextTool } from './tools/search/search-context.tool.js'
import { registerListPropertiesTool } from './tools/properties/list-properties.tool.js'
import { registerGetPropertyTool } from './tools/properties/get-property.tool.js'
import { registerSetPropertyTool } from './tools/properties/set-property.tool.js'
import { registerRemovePropertyTool } from './tools/properties/remove-property.tool.js'
import { registerListTagsTool } from './tools/tags/list-tags.tool.js'
import { registerGetTagTool } from './tools/tags/get-tag.tool.js'
import { registerListLinksTool } from './tools/links/list-links.tool.js'
import { registerListBacklinksTool } from './tools/links/list-backlinks.tool.js'
import { registerListOrphansTool } from './tools/links/list-orphans.tool.js'
import { registerReadDailyTool } from './tools/daily/read-daily.tool.js'
import { registerAppendDailyTool } from './tools/daily/append-daily.tool.js'
import { registerPrependDailyTool } from './tools/daily/prepend-daily.tool.js'
import { registerListTasksTool } from './tools/tasks/list-tasks.tool.js'
import { registerToggleTaskTool } from './tools/tasks/toggle-task.tool.js'

export function createServer(): McpServer {
  const cli = new ObsidianCliService(
    process.env['OBSIDIAN_BIN'] ?? 'obsidian',
    process.env['OBSIDIAN_VAULT'] || undefined,
  )

  const server = new McpServer({ name: 'obsidian-cli-mcp', version: '0.1.0' })

  registerReadNoteTool(server, cli)
  registerCreateNoteTool(server, cli)
  registerAppendNoteTool(server, cli)
  registerPrependNoteTool(server, cli)
  registerMoveNoteTool(server, cli)
  registerDeleteNoteTool(server, cli)
  registerVaultInfoTool(server, cli)
  registerListFilesTool(server, cli)
  registerListFoldersTool(server, cli)
  registerSearchNotesTool(server, cli)
  registerSearchContextTool(server, cli)
  registerListPropertiesTool(server, cli)
  registerGetPropertyTool(server, cli)
  registerSetPropertyTool(server, cli)
  registerRemovePropertyTool(server, cli)
  registerListTagsTool(server, cli)
  registerGetTagTool(server, cli)
  registerListLinksTool(server, cli)
  registerListBacklinksTool(server, cli)
  registerListOrphansTool(server, cli)
  registerReadDailyTool(server, cli)
  registerAppendDailyTool(server, cli)
  registerPrependDailyTool(server, cli)
  registerListTasksTool(server, cli)
  registerToggleTaskTool(server, cli)

  return server
}
