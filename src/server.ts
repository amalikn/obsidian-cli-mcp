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
import { registerListTemplatesTool } from './tools/templates/list-templates.tool.js'
import { registerReadTemplateTool } from './tools/templates/read-template.tool.js'
import { registerInsertTemplateTool } from './tools/templates/insert-template.tool.js'
import { registerListBookmarksTool } from './tools/bookmarks/list-bookmarks.tool.js'
import { registerAddBookmarkTool } from './tools/bookmarks/add-bookmark.tool.js'
import { registerListDeadendsTool } from './tools/links/list-deadends.tool.js'
import { registerListUnresolvedTool } from './tools/links/list-unresolved.tool.js'
import { registerOutlineTool } from './tools/notes/outline.tool.js'
import { registerWordcountTool } from './tools/notes/wordcount.tool.js'
import { registerRenameNoteTool } from './tools/notes/rename-note.tool.js'
import { registerFileInfoTool } from './tools/notes/file-info.tool.js'
import { registerListPluginsTool } from './tools/plugins/list-plugins.tool.js'
import { registerListPluginsEnabledTool } from './tools/plugins/list-plugins-enabled.tool.js'
import { registerGetPluginTool } from './tools/plugins/get-plugin.tool.js'
import { registerEnablePluginTool } from './tools/plugins/enable-plugin.tool.js'
import { registerDisablePluginTool } from './tools/plugins/disable-plugin.tool.js'
import { registerInstallPluginTool } from './tools/plugins/install-plugin.tool.js'
import { registerUninstallPluginTool } from './tools/plugins/uninstall-plugin.tool.js'
import { registerHistoryListTool } from './tools/history/history-list.tool.js'
import { registerHistoryReadTool } from './tools/history/history-read.tool.js'
import { registerHistoryRestoreTool } from './tools/history/history-restore.tool.js'
import { registerSyncStatusTool } from './tools/sync/sync-status.tool.js'
import { registerSyncHistoryTool } from './tools/sync/sync-history.tool.js'
import { registerSyncReadTool } from './tools/sync/sync-read.tool.js'
import { registerSyncRestoreTool } from './tools/sync/sync-restore.tool.js'
import { registerSyncDeletedTool } from './tools/sync/sync-deleted.tool.js'
import { registerListBasesTool } from './tools/bases/list-bases.tool.js'
import { registerQueryBaseTool } from './tools/bases/query-base.tool.js'
import { registerListBaseViewsTool } from './tools/bases/list-base-views.tool.js'
import { registerCreateBaseItemTool } from './tools/bases/create-base-item.tool.js'
import { registerListVaultsTool } from './tools/vault/list-vaults.tool.js'
import { registerVersionTool } from './tools/vault/version.tool.js'
import { registerListRecentsTool } from './tools/vault/list-recents.tool.js'
import { registerRandomReadTool } from './tools/vault/random-read.tool.js'
import { registerListAliasesTool } from './tools/vault/list-aliases.tool.js'
import { registerWorkspaceTool } from './tools/workspace/workspace.tool.js'
import { registerListTabsTool } from './tools/workspace/list-tabs.tool.js'
import { registerDailyPathTool } from './tools/workspace/daily-path.tool.js'
import { registerListCommandsTool } from './tools/commands/list-commands.tool.js'
import { registerExecuteCommandTool } from './tools/commands/execute-command.tool.js'
import { registerListHotkeysTool } from './tools/commands/list-hotkeys.tool.js'
import { registerGetHotkeyTool } from './tools/commands/get-hotkey.tool.js'
import { registerListThemesTool } from './tools/themes/list-themes.tool.js'
import { registerGetThemeTool } from './tools/themes/get-theme.tool.js'
import { registerSetThemeTool } from './tools/themes/set-theme.tool.js'
import { registerInstallThemeTool } from './tools/themes/install-theme.tool.js'
import { registerUninstallThemeTool } from './tools/themes/uninstall-theme.tool.js'
import { registerListSnippetsTool } from './tools/snippets/list-snippets.tool.js'
import { registerListSnippetsEnabledTool } from './tools/snippets/list-snippets-enabled.tool.js'
import { registerEnableSnippetTool } from './tools/snippets/enable-snippet.tool.js'
import { registerDisableSnippetTool } from './tools/snippets/disable-snippet.tool.js'
import { registerDiffTool } from './tools/notes/diff.tool.js'
import { registerEvalTool } from './tools/notes/eval.tool.js'

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
  registerListTemplatesTool(server, cli)
  registerReadTemplateTool(server, cli)
  registerInsertTemplateTool(server, cli)
  registerListBookmarksTool(server, cli)
  registerAddBookmarkTool(server, cli)
  registerListDeadendsTool(server, cli)
  registerListUnresolvedTool(server, cli)
  registerOutlineTool(server, cli)
  registerWordcountTool(server, cli)
  registerRenameNoteTool(server, cli)
  registerFileInfoTool(server, cli)
  registerListPluginsTool(server, cli)
  registerListPluginsEnabledTool(server, cli)
  registerGetPluginTool(server, cli)
  registerEnablePluginTool(server, cli)
  registerDisablePluginTool(server, cli)
  registerInstallPluginTool(server, cli)
  registerUninstallPluginTool(server, cli)
  registerHistoryListTool(server, cli)
  registerHistoryReadTool(server, cli)
  registerHistoryRestoreTool(server, cli)
  registerSyncStatusTool(server, cli)
  registerSyncHistoryTool(server, cli)
  registerSyncReadTool(server, cli)
  registerSyncRestoreTool(server, cli)
  registerSyncDeletedTool(server, cli)
  registerListBasesTool(server, cli)
  registerQueryBaseTool(server, cli)
  registerListBaseViewsTool(server, cli)
  registerCreateBaseItemTool(server, cli)
  registerListVaultsTool(server, cli)
  registerVersionTool(server, cli)
  registerListRecentsTool(server, cli)
  registerRandomReadTool(server, cli)
  registerListAliasesTool(server, cli)
  registerWorkspaceTool(server, cli)
  registerListTabsTool(server, cli)
  registerDailyPathTool(server, cli)
  registerListCommandsTool(server, cli)
  registerExecuteCommandTool(server, cli)
  registerListHotkeysTool(server, cli)
  registerGetHotkeyTool(server, cli)
  registerListThemesTool(server, cli)
  registerGetThemeTool(server, cli)
  registerSetThemeTool(server, cli)
  registerInstallThemeTool(server, cli)
  registerUninstallThemeTool(server, cli)
  registerListSnippetsTool(server, cli)
  registerListSnippetsEnabledTool(server, cli)
  registerEnableSnippetTool(server, cli)
  registerDisableSnippetTool(server, cli)
  registerDiffTool(server, cli)
  registerEvalTool(server, cli)

  return server
}
