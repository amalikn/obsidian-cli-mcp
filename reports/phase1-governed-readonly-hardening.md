# Phase 1 Governed Read-Only Hardening

## 1. Executive summary
- Phase 1 is implemented.
- What was changed:
  - added explicit runtime profiles with `governed-readonly` as the default and `personal-unrestricted` as an explicit compatibility profile
  - moved tool exposure behind a central profile-aware registry
  - hardened HTTP defaults so it remains opt-in and binds loopback-only by default
  - required `OBSIDIAN_VAULT` in governed-readonly mode and disabled per-call vault overrides there
- What risk was reduced:
  - `obsidian_eval` and `obsidian_execute_command` are no longer in the default governed surface
  - note mutation, runtime/app-state mutation, restore operations, and governance-sensitive runtime inventory are excluded from governed-readonly
  - HTTP no longer defaults to `0.0.0.0`
  - governed startup now fails closed when vault pinning is missing
- What remains out of scope:
  - governed mutation profile
  - full HTTP authentication / authorization
  - full vault allowlisting / policy engine
  - dependency vulnerability remediation

## 2. Audit reconciliation
- Prior findings addressed now:
  - `obsidian_eval` exposed by default
  - `obsidian_execute_command` exposed by default
  - unconditional registration of mutating, restore, and runtime-state tools
  - HTTP transport binding `0.0.0.0` without a hardened default
  - governed mode lacking an explicit pinned-vault requirement
- Prior findings deferred:
  - full governed mutation profile and approval gates
  - HTTP auth / authorization
  - vault allowlisting beyond a single required pinned vault
  - dependency and package vulnerability remediation
  - broader transport policy beyond loopback-default and opt-in HTTP
- Why deferred:
  - Phase 1 was intentionally scoped to reduce the default blast radius with centralized, reviewable enforcement rather than attempt a broad security redesign

## 3. Tool classification
| tool | category | read_only | governed_readonly allowed/blocked | reason |
|---|---|---:|---|---|
| `obsidian_read_note` | note content | true | allowed | canonical note read |
| `obsidian_vault_info` | vault metadata | true | allowed | bounded vault introspection |
| `obsidian_list_files` | vault listing | true | allowed | read-only listing |
| `obsidian_list_folders` | vault listing | true | allowed | read-only listing |
| `obsidian_search` | search | true | allowed | governed content discovery |
| `obsidian_search_context` | search | true | allowed | governed content discovery |
| `obsidian_list_properties` | metadata | true | allowed | frontmatter read |
| `obsidian_get_property` | metadata | true | allowed | frontmatter read |
| `obsidian_list_tags` | metadata | true | allowed | tag read |
| `obsidian_get_tag` | metadata | true | allowed | tag read |
| `obsidian_list_links` | graph | true | allowed | outgoing link read |
| `obsidian_list_backlinks` | graph | true | allowed | backlink read |
| `obsidian_list_orphans` | graph | true | allowed | read-only graph audit |
| `obsidian_read_daily` | daily notes | true | allowed | note read |
| `obsidian_list_tasks` | task discovery | true | allowed | read-only task inspection |
| `obsidian_list_templates` | templates | true | allowed | read-only listing |
| `obsidian_read_template` | templates | true | allowed | read-only template inspection |
| `obsidian_list_deadends` | graph | true | allowed | read-only graph audit |
| `obsidian_list_unresolved` | graph | true | allowed | read-only graph audit |
| `obsidian_outline` | note structure | true | allowed | note introspection |
| `obsidian_wordcount` | note structure | true | allowed | note introspection |
| `obsidian_file_info` | note metadata | true | allowed | file metadata read |
| `obsidian_list_bases` | bases | true | allowed | read-only inventory |
| `obsidian_query_base` | bases | true | allowed | read-only query |
| `obsidian_list_base_views` | bases | true | allowed | read-only inventory |
| `obsidian_version` | version | true | allowed | safe environment info |
| `obsidian_random_read` | note content | true | allowed | bounded note read |
| `obsidian_list_aliases` | metadata | true | allowed | alias read |
| `obsidian_diff` | note comparison | true | allowed | read-only comparison |
| `obsidian_create_note` | note mutation | false | blocked | note creation |
| `obsidian_append_note` | note mutation | false | blocked | note write |
| `obsidian_prepend_note` | note mutation | false | blocked | note write |
| `obsidian_move_note` | note mutation | false | blocked | path mutation |
| `obsidian_delete_note` | destructive note mutation | false | blocked | destructive operation |
| `obsidian_set_property` | metadata mutation | false | blocked | frontmatter mutation |
| `obsidian_remove_property` | metadata mutation | false | blocked | frontmatter mutation |
| `obsidian_append_daily` | daily note mutation | false | blocked | note write |
| `obsidian_prepend_daily` | daily note mutation | false | blocked | note write |
| `obsidian_toggle_task` | task mutation | false | blocked | task state mutation |
| `obsidian_insert_template` | note mutation | false | blocked | writes into note context |
| `obsidian_add_bookmark` | runtime-state mutation | false | blocked | bookmark mutation |
| `obsidian_rename_note` | note mutation | false | blocked | rename mutation |
| `obsidian_create_base_item` | bases mutation | false | blocked | base data mutation |
| `obsidian_execute_command` | execute | false | blocked | open-ended command execution |
| `obsidian_eval` | execute | false | blocked | arbitrary code execution |
| `obsidian_enable_plugin` | runtime-state mutation | false | blocked | `.obsidian` / plugin state mutation |
| `obsidian_disable_plugin` | runtime-state mutation | false | blocked | `.obsidian` / plugin state mutation |
| `obsidian_install_plugin` | runtime-state mutation | false | blocked | plugin payload mutation |
| `obsidian_uninstall_plugin` | runtime-state mutation | false | blocked | plugin payload mutation |
| `obsidian_history_restore` | restore mutation | false | blocked | content restore mutation |
| `obsidian_sync_restore` | restore mutation | false | blocked | content restore mutation |
| `obsidian_set_theme` | runtime-state mutation | false | blocked | theme mutation |
| `obsidian_install_theme` | runtime-state mutation | false | blocked | theme payload mutation |
| `obsidian_uninstall_theme` | runtime-state mutation | false | blocked | theme payload mutation |
| `obsidian_enable_snippet` | runtime-state mutation | false | blocked | snippet mutation |
| `obsidian_disable_snippet` | runtime-state mutation | false | blocked | snippet mutation |
| `obsidian_list_vaults` | environment introspection | true | blocked | expands vault discovery beyond governed scope |
| `obsidian_list_recents` | workspace/session introspection | true | blocked | transient session state |
| `obsidian_workspace` | workspace/session introspection | true | blocked | non-canonical runtime state |
| `obsidian_list_tabs` | workspace/session introspection | true | blocked | non-canonical runtime state |
| `obsidian_daily_path` | workspace/session introspection | true | blocked | runtime-dependent path resolution |
| `obsidian_list_commands` | command introspection | true | blocked | primarily feeds later command execution |
| `obsidian_list_hotkeys` | command introspection | true | blocked | app/runtime introspection |
| `obsidian_get_hotkey` | command introspection | true | blocked | app/runtime introspection |
| `obsidian_list_plugins` | runtime inventory | true | blocked | non-canonical plugin state |
| `obsidian_list_plugins_enabled` | runtime inventory | true | blocked | non-canonical plugin state |
| `obsidian_get_plugin` | runtime inventory | true | blocked | non-canonical plugin state |
| `obsidian_history_list` | history introspection | true | blocked | retention/privacy-sensitive history surface |
| `obsidian_history_read` | history introspection | true | blocked | retention/privacy-sensitive history surface |
| `obsidian_sync_status` | sync introspection | true | blocked | sync subsystem state |
| `obsidian_sync_history` | sync introspection | true | blocked | sync subsystem state |
| `obsidian_sync_read` | sync introspection | true | blocked | sync subsystem state |
| `obsidian_sync_deleted` | sync introspection | true | blocked | sync subsystem state |
| `obsidian_list_themes` | runtime inventory | true | blocked | non-canonical theme state |
| `obsidian_get_theme` | runtime inventory | true | blocked | non-canonical theme state |
| `obsidian_list_snippets` | runtime inventory | true | blocked | non-canonical snippet state |
| `obsidian_list_snippets_enabled` | runtime inventory | true | blocked | non-canonical snippet state |
| `obsidian_list_bookmarks` | runtime inventory | true | blocked | bookmark state is non-canonical `.obsidian` runtime data |

## 4. Code changes made
- Files changed:
  - `src/runtime-config.ts`
  - `src/tool-registry.ts`
  - `src/server.ts`
  - `src/index.ts`
  - `src/services/obsidian-cli.service.ts`
  - `src/transports/http.ts`
  - `tests/runtime-config.test.ts`
  - `tests/tool-registry.test.ts`
  - `tests/services/obsidian-cli.service.test.ts`
  - `README.md`
  - `CHANGELOG.md`
  - `reports/phase1-governed-readonly-hardening.md`
  - `reports/phase1-governed-readonly-hardening.json`
- Architectural approach:
  - added `src/runtime-config.ts` to resolve and validate profile / transport settings centrally
  - added `src/tool-registry.ts` to define the full tool registry and the governed-readonly allowlist in one place
  - reduced `src/server.ts` to profile-aware registration plus profile-aware CLI service construction
- Profile mechanism:
  - `MCP_PROFILE=governed-readonly` is now the default
  - `MCP_PROFILE=personal-unrestricted` preserves the broader legacy surface explicitly
  - unsupported profile values now fail closed
- Transport changes:
  - stdio remains the default transport
  - HTTP remains opt-in
  - `MCP_HTTP_HOST` defaults to `127.0.0.1`
  - HTTP documentation now marks the transport as non-governed / non-default
- Vault-scope changes:
  - governed-readonly requires `OBSIDIAN_VAULT`
  - governed-readonly disables per-call `vault=` overrides inside `ObsidianCliService`
  - personal-unrestricted retains the prior per-call override capability

## 5. Tests and validation
- Commands run:
  - `npm run lint`
  - `npm run build`
  - `npm test`
- Results:
  - `npm run lint`: passed
  - `npm run build`: failed once on a `??` / `||` precedence bug in `src/server.ts`, then passed after the fix
  - `npm test`: passed
  - final test suite result: 81 test files passed, 305 tests passed
- What is proven:
  - profile selection is deterministic and validated
  - governed-readonly excludes execute/eval, mutating, restore, and governance-sensitive runtime-state tools
  - personal-unrestricted still exposes the broader legacy surface explicitly
  - HTTP no longer defaults to `0.0.0.0`
  - governed-readonly rejects per-call vault overrides
- What is not proven:
  - behavior against a live or disposable Obsidian vault
  - comprehensive policy beyond Phase 1 profile gating
  - HTTP safety beyond loopback-default and opt-in posture

## 6. Remaining gaps for Phase 2+
- vault allowlisting / stronger pinning policy beyond a single required default vault
- governed mutation profile and approval gates
- HTTP auth / authorization and broader transport hardening
- dependency remediation and supply-chain hygiene
- deeper policy around sync/history/runtime-state features if any of them need governed exposure later

## 7. Final status
- Governed-readonly is usable now for governed read-only operation under these conditions:
  - use the default `stdio` transport
  - set `OBSIDIAN_VAULT` explicitly
  - do not treat HTTP as governed deployment
- What must still be avoided:
  - `personal-unrestricted` in governed environments
  - exposing HTTP beyond loopback without later auth/hardening work
  - assuming Phase 1 solves destructive mutation policy, vault allowlisting, or dependency/security issues
