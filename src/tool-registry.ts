import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ObsidianCliService } from './services/obsidian-cli.service.js'
import type { GovernedVaultService } from './services/governed-vault.service.js'
import type { McpProfile } from './runtime-config.js'
import { isGovernedProfile } from './runtime-config.js'
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
import { registerGovernedSearchNotesTool } from './tools/search/search-notes-governed.tool.js'
import { registerSearchContextTool } from './tools/search/search-context.tool.js'
import { registerGovernedSearchContextTool } from './tools/search/search-context-governed.tool.js'
import { registerListPropertiesTool } from './tools/properties/list-properties.tool.js'
import { registerGetPropertyTool } from './tools/properties/get-property.tool.js'
import { registerSetPropertyTool } from './tools/properties/set-property.tool.js'
import { registerRemovePropertyTool } from './tools/properties/remove-property.tool.js'
import { registerListTagsTool } from './tools/tags/list-tags.tool.js'
import { registerGetTagTool } from './tools/tags/get-tag.tool.js'
import { registerListLinksTool } from './tools/links/list-links.tool.js'
import { registerGovernedListLinksTool } from './tools/links/list-links-governed.tool.js'
import { registerListBacklinksTool } from './tools/links/list-backlinks.tool.js'
import { registerGovernedListBacklinksTool } from './tools/links/list-backlinks-governed.tool.js'
import { registerListOrphansTool } from './tools/links/list-orphans.tool.js'
import { registerReadDailyTool } from './tools/daily/read-daily.tool.js'
import { registerAppendDailyTool } from './tools/daily/append-daily.tool.js'
import { registerPrependDailyTool } from './tools/daily/prepend-daily.tool.js'
import { registerListTasksTool } from './tools/tasks/list-tasks.tool.js'
import { registerToggleTaskTool } from './tools/tasks/toggle-task.tool.js'
import { registerListTemplatesTool } from './tools/templates/list-templates.tool.js'
import { registerReadTemplateTool } from './tools/templates/read-template.tool.js'
import { registerInsertTemplateTool } from './tools/templates/insert-template.tool.js'
import { registerCreateNoteFromTemplateTool } from './tools/templates/create-note-from-template.tool.js'
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
import { registerCreateReviewNoteTool } from './tools/workflows/create-review-note.tool.js'
import { registerCreatePromotionCandidateTool } from './tools/workflows/create-promotion-candidate.tool.js'
import { registerCreateCuratedNoteTool } from './tools/workflows/create-curated-note.tool.js'
import { registerLogPromotionTool } from './tools/workflows/log-promotion.tool.js'

type ToolRegistrar = (server: McpServer, cli: ObsidianCliService) => void
type GovernedToolRegistrar = (server: McpServer, governedVault: GovernedVaultService) => void

export interface ToolRegistration {
  tool: string
  register?: ToolRegistrar
  registerGoverned?: GovernedToolRegistrar
}

export const TOOL_REGISTRATIONS: readonly ToolRegistration[] = [
  { tool: 'obsidian_read_note', register: registerReadNoteTool },
  { tool: 'obsidian_create_note', register: registerCreateNoteTool },
  { tool: 'obsidian_append_note', register: registerAppendNoteTool },
  { tool: 'obsidian_prepend_note', register: registerPrependNoteTool },
  { tool: 'obsidian_move_note', register: registerMoveNoteTool },
  { tool: 'obsidian_delete_note', register: registerDeleteNoteTool },
  { tool: 'obsidian_vault_info', register: registerVaultInfoTool },
  { tool: 'obsidian_list_files', register: registerListFilesTool },
  { tool: 'obsidian_list_folders', register: registerListFoldersTool },
  { tool: 'obsidian_search', register: registerSearchNotesTool, registerGoverned: registerGovernedSearchNotesTool },
  {
    tool: 'obsidian_search_context',
    register: registerSearchContextTool,
    registerGoverned: registerGovernedSearchContextTool,
  },
  { tool: 'obsidian_list_properties', register: registerListPropertiesTool },
  { tool: 'obsidian_get_property', register: registerGetPropertyTool },
  { tool: 'obsidian_set_property', register: registerSetPropertyTool },
  { tool: 'obsidian_remove_property', register: registerRemovePropertyTool },
  { tool: 'obsidian_list_tags', register: registerListTagsTool },
  { tool: 'obsidian_get_tag', register: registerGetTagTool },
  { tool: 'obsidian_list_links', register: registerListLinksTool, registerGoverned: registerGovernedListLinksTool },
  {
    tool: 'obsidian_list_backlinks',
    register: registerListBacklinksTool,
    registerGoverned: registerGovernedListBacklinksTool,
  },
  { tool: 'obsidian_list_orphans', register: registerListOrphansTool },
  { tool: 'obsidian_read_daily', register: registerReadDailyTool },
  { tool: 'obsidian_append_daily', register: registerAppendDailyTool },
  { tool: 'obsidian_prepend_daily', register: registerPrependDailyTool },
  { tool: 'obsidian_list_tasks', register: registerListTasksTool },
  { tool: 'obsidian_toggle_task', register: registerToggleTaskTool },
  { tool: 'obsidian_list_templates', register: registerListTemplatesTool },
  { tool: 'obsidian_read_template', register: registerReadTemplateTool },
  { tool: 'obsidian_insert_template', register: registerInsertTemplateTool },
  { tool: 'obsidian_list_bookmarks', register: registerListBookmarksTool },
  { tool: 'obsidian_add_bookmark', register: registerAddBookmarkTool },
  { tool: 'obsidian_list_deadends', register: registerListDeadendsTool },
  { tool: 'obsidian_list_unresolved', register: registerListUnresolvedTool },
  { tool: 'obsidian_outline', register: registerOutlineTool },
  { tool: 'obsidian_wordcount', register: registerWordcountTool },
  { tool: 'obsidian_rename_note', register: registerRenameNoteTool },
  { tool: 'obsidian_file_info', register: registerFileInfoTool },
  { tool: 'obsidian_list_plugins', register: registerListPluginsTool },
  { tool: 'obsidian_list_plugins_enabled', register: registerListPluginsEnabledTool },
  { tool: 'obsidian_get_plugin', register: registerGetPluginTool },
  { tool: 'obsidian_enable_plugin', register: registerEnablePluginTool },
  { tool: 'obsidian_disable_plugin', register: registerDisablePluginTool },
  { tool: 'obsidian_install_plugin', register: registerInstallPluginTool },
  { tool: 'obsidian_uninstall_plugin', register: registerUninstallPluginTool },
  { tool: 'obsidian_history_list', register: registerHistoryListTool },
  { tool: 'obsidian_history_read', register: registerHistoryReadTool },
  { tool: 'obsidian_history_restore', register: registerHistoryRestoreTool },
  { tool: 'obsidian_sync_status', register: registerSyncStatusTool },
  { tool: 'obsidian_sync_history', register: registerSyncHistoryTool },
  { tool: 'obsidian_sync_read', register: registerSyncReadTool },
  { tool: 'obsidian_sync_restore', register: registerSyncRestoreTool },
  { tool: 'obsidian_sync_deleted', register: registerSyncDeletedTool },
  { tool: 'obsidian_list_bases', register: registerListBasesTool },
  { tool: 'obsidian_query_base', register: registerQueryBaseTool },
  { tool: 'obsidian_list_base_views', register: registerListBaseViewsTool },
  { tool: 'obsidian_create_base_item', register: registerCreateBaseItemTool },
  { tool: 'obsidian_list_vaults', register: registerListVaultsTool },
  { tool: 'obsidian_version', register: registerVersionTool },
  { tool: 'obsidian_list_recents', register: registerListRecentsTool },
  { tool: 'obsidian_random_read', register: registerRandomReadTool },
  { tool: 'obsidian_list_aliases', register: registerListAliasesTool },
  { tool: 'obsidian_workspace', register: registerWorkspaceTool },
  { tool: 'obsidian_list_tabs', register: registerListTabsTool },
  { tool: 'obsidian_daily_path', register: registerDailyPathTool },
  { tool: 'obsidian_list_commands', register: registerListCommandsTool },
  { tool: 'obsidian_execute_command', register: registerExecuteCommandTool },
  { tool: 'obsidian_list_hotkeys', register: registerListHotkeysTool },
  { tool: 'obsidian_get_hotkey', register: registerGetHotkeyTool },
  { tool: 'obsidian_list_themes', register: registerListThemesTool },
  { tool: 'obsidian_get_theme', register: registerGetThemeTool },
  { tool: 'obsidian_set_theme', register: registerSetThemeTool },
  { tool: 'obsidian_install_theme', register: registerInstallThemeTool },
  { tool: 'obsidian_uninstall_theme', register: registerUninstallThemeTool },
  { tool: 'obsidian_list_snippets', register: registerListSnippetsTool },
  { tool: 'obsidian_list_snippets_enabled', register: registerListSnippetsEnabledTool },
  { tool: 'obsidian_enable_snippet', register: registerEnableSnippetTool },
  { tool: 'obsidian_disable_snippet', register: registerDisableSnippetTool },
  { tool: 'obsidian_diff', register: registerDiffTool },
  { tool: 'obsidian_eval', register: registerEvalTool },
  { tool: 'obsidian_create_note_from_template', registerGoverned: registerCreateNoteFromTemplateTool },
  { tool: 'obsidian_create_review_note', registerGoverned: registerCreateReviewNoteTool },
  { tool: 'obsidian_create_promotion_candidate', registerGoverned: registerCreatePromotionCandidateTool },
  { tool: 'obsidian_create_curated_note', registerGoverned: registerCreateCuratedNoteTool },
  { tool: 'obsidian_log_promotion', registerGoverned: registerLogPromotionTool },
] as const

const LEGACY_TOOL_NAMES = TOOL_REGISTRATIONS.filter(({ register }) => register).map(({ tool }) => tool)

export const GOVERNED_READONLY_TOOL_NAMES = [
  'obsidian_read_note',
  'obsidian_vault_info',
  'obsidian_search',
  'obsidian_search_context',
  'obsidian_list_properties',
  'obsidian_get_property',
  'obsidian_list_links',
  'obsidian_list_backlinks',
  'obsidian_outline',
  'obsidian_wordcount',
  'obsidian_file_info',
  'obsidian_version',
  'obsidian_diff',
] as const

export const GOVERNED_MUTATION_TOOL_NAMES = [
  'obsidian_read_note',
  'obsidian_create_note',
  'obsidian_append_note',
  'obsidian_prepend_note',
  'obsidian_vault_info',
  'obsidian_search',
  'obsidian_search_context',
  'obsidian_list_properties',
  'obsidian_get_property',
  'obsidian_set_property',
  'obsidian_remove_property',
  'obsidian_list_links',
  'obsidian_list_backlinks',
  'obsidian_outline',
  'obsidian_wordcount',
  'obsidian_file_info',
  'obsidian_version',
  'obsidian_diff',
  'obsidian_create_note_from_template',
  'obsidian_create_review_note',
  'obsidian_create_promotion_candidate',
  'obsidian_create_curated_note',
  'obsidian_log_promotion',
] as const

const PROFILE_ALLOWLISTS: Record<McpProfile, ReadonlySet<string>> = {
  'governed-readonly': new Set(GOVERNED_READONLY_TOOL_NAMES),
  'governed-mutation': new Set(GOVERNED_MUTATION_TOOL_NAMES),
  'personal-unrestricted': new Set(LEGACY_TOOL_NAMES),
}

export function getRegisteredToolNames(profile: McpProfile): string[] {
  return TOOL_REGISTRATIONS.filter(({ tool }) => PROFILE_ALLOWLISTS[profile].has(tool)).map(({ tool }) => tool)
}

export function registerToolsForProfile(
  server: McpServer,
  cli: ObsidianCliService,
  profile: McpProfile,
  governedVault?: GovernedVaultService,
): void {
  const allowedTools = PROFILE_ALLOWLISTS[profile]

  for (const registration of TOOL_REGISTRATIONS) {
    if (!allowedTools.has(registration.tool)) {
      continue
    }

    if (isGovernedProfile(profile) && registration.registerGoverned) {
      if (!governedVault) {
        throw new Error(`Governed tool registration requires a governed vault service: ${registration.tool}`)
      }

      registration.registerGoverned(server, governedVault)
      continue
    }

    if (registration.register) {
      registration.register(server, cli)
      continue
    }

    throw new Error(`Tool registration missing supported registrar for profile ${profile}: ${registration.tool}`)
  }
}
