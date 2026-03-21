# Phase 2 Governed Mutation + Vault Policy + HTTP Hardening

## 1. Executive summary
- What changed:
  - added an explicit `governed-mutation` profile without changing the default-safe profile away from `governed-readonly`
  - replaced Phase 1 vault pinning-only behavior with a real governed vault policy engine that requires `OBSIDIAN_VAULT`, `OBSIDIAN_VAULT_ROOT`, and `OBSIDIAN_POLICY_FILE`
  - narrowed governed profiles to exact-path note/property operations so policy can be enforced deterministically before the Obsidian CLI is invoked
  - hardened HTTP startup so governed HTTP requires an explicit bearer token and remote bind requires a separate explicit opt-in flag
  - added bounded tests for profile registration, vault policy enforcement, and HTTP auth/startup validation
- What risk was reduced:
  - governed mutation is now explicit, narrow, and backed by write allowlists instead of broad legacy mutation exposure
  - governed vault access no longer relies only on a pinned vault name; exact-path reads and writes are checked against canonical filesystem policy
  - governed HTTP no longer starts without authentication and remote bind now fails closed unless explicitly enabled
- What remains out of scope:
  - broad governed search/list/discovery surfaces that would need denylist-safe filtering
  - rename/move/delete/task-toggle/template-insert/daily mutation in governed mode
  - internet-safe or zero-trust HTTP deployment
  - dependency remediation and supply-chain hardening

## 2. Phase 1 reconciliation
- Phase 1 deferred items addressed:
  - governed mutation profile
  - vault allowlisting / stronger pinning policy
  - HTTP authentication / startup hardening
- Phase 1 deferred items still deferred:
  - dependency and package vulnerability remediation
  - broader governed transport policy beyond bearer-authenticated controlled HTTP
  - broader governed discovery surfaces that need result filtering to preserve denylist guarantees
  - deeper governance for runtime-state, sync/history, template insertion, and path-crossing mutation
- Why some items remain deferred:
  - this run stayed fail-closed and avoided widening the MCP surface where the current Obsidian CLI integration cannot prove denylist-safe behavior locally

## 3. Profile model
- `governed-readonly`
  - intended use: exact-path governed note/property/graph reads inside one pinned vault
  - transport expectation: stdio by default; HTTP only when explicitly enabled with auth and bind safeguards
  - vault policy expectation: requires pinned vault name, vault root, and policy file
- `governed-mutation`
  - intended use: exact-path governed note/property mutation inside one pinned vault
  - transport expectation: stdio by default; governed HTTP allowed only with explicit auth and bind safeguards
  - vault policy expectation: same as `governed-readonly`, with write allowlist enforcement
- `personal-unrestricted`
  - intended use: compatibility profile for the broad legacy surface
  - transport expectation: stdio preferred; HTTP remains opt-in
  - vault policy expectation: no governed vault policy enforcement

## 4. Tool classification
| tool | category | read_only | governed_readonly | governed_mutation | personal_unrestricted | policy_required | reason |
|---|---|---:|---|---|---|---|---|
| `obsidian_read_note` | note content | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | canonical note read |
| `obsidian_vault_info` | vault metadata | true | allowed | allowed | allowed | none | bounded vault introspection |
| `obsidian_list_files` | vault listing | true | blocked | blocked | allowed | none | blocked in governed profiles because broad folder enumeration cannot currently guarantee denylist-safe filtering |
| `obsidian_list_folders` | vault listing | true | blocked | blocked | allowed | none | blocked in governed profiles because broad folder enumeration cannot currently guarantee denylist-safe filtering |
| `obsidian_search` | search | true | blocked | blocked | allowed | none | blocked in governed profiles because folder-scoped search results are not denylist-filtered server-side |
| `obsidian_search_context` | search | true | blocked | blocked | allowed | none | blocked in governed profiles because folder-scoped search results are not denylist-filtered server-side |
| `obsidian_list_properties` | metadata | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | frontmatter read |
| `obsidian_get_property` | metadata | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | frontmatter read |
| `obsidian_list_tags` | metadata | true | blocked | blocked | allowed | none | blocked in governed profiles because vault-wide metadata discovery bypasses exact-path policy checks |
| `obsidian_get_tag` | metadata | true | blocked | blocked | allowed | none | blocked in governed profiles because tag queries are vault-wide discovery operations |
| `obsidian_list_links` | graph | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | outgoing link read |
| `obsidian_list_backlinks` | graph | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | backlink read |
| `obsidian_list_orphans` | graph | true | blocked | blocked | allowed | none | blocked in governed profiles because vault-wide graph audits bypass exact-path policy checks |
| `obsidian_read_daily` | daily notes | true | blocked | blocked | allowed | none | blocked in governed profiles because runtime-derived daily note resolution bypasses exact-path policy checks |
| `obsidian_list_tasks` | task discovery | true | blocked | blocked | allowed | none | blocked in governed profiles because task discovery can expand beyond explicit policy-bounded paths |
| `obsidian_list_templates` | templates | true | blocked | blocked | allowed | none | blocked in governed profiles because template discovery is not yet bound to explicit path policy |
| `obsidian_read_template` | templates | true | blocked | blocked | allowed | none | blocked in governed profiles because template resolution is name-based rather than exact-path governed |
| `obsidian_list_deadends` | graph | true | blocked | blocked | allowed | none | blocked in governed profiles because vault-wide graph audits bypass exact-path policy checks |
| `obsidian_list_unresolved` | graph | true | blocked | blocked | allowed | none | blocked in governed profiles because vault-wide graph audits bypass exact-path policy checks |
| `obsidian_outline` | note structure | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | note introspection |
| `obsidian_wordcount` | note structure | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | note introspection |
| `obsidian_file_info` | note metadata | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | file metadata read |
| `obsidian_list_bases` | bases | true | blocked | blocked | allowed | none | blocked in governed profiles because base discovery is vault-wide and not exact-path policy-bounded |
| `obsidian_query_base` | bases | true | blocked | blocked | allowed | none | blocked in governed profiles because base queries are not constrained by exact-path vault policy |
| `obsidian_list_base_views` | bases | true | blocked | blocked | allowed | none | blocked in governed profiles because base view discovery is not exact-path policy-bounded |
| `obsidian_version` | version | true | allowed | allowed | allowed | none | safe environment info |
| `obsidian_random_read` | note content | true | blocked | blocked | allowed | none | blocked in governed profiles because random note selection bypasses exact-path policy checks |
| `obsidian_list_aliases` | metadata | true | blocked | blocked | allowed | none | blocked in governed profiles because vault-wide alias discovery bypasses exact-path policy checks |
| `obsidian_diff` | note comparison | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | read-only comparison |
| `obsidian_create_note` | note mutation | false | blocked | policy-gated | allowed | exact note path inside writeAllowlist; no name selector; no template insertion; overwrite blocked | note creation |
| `obsidian_append_note` | note mutation | false | blocked | policy-gated | allowed | exact note path inside writeAllowlist; per-call vault override disabled | note write |
| `obsidian_prepend_note` | note mutation | false | blocked | policy-gated | allowed | exact note path inside writeAllowlist; per-call vault override disabled | note write |
| `obsidian_move_note` | note mutation | false | blocked | blocked | allowed | none | blocked in governed-mutation because move operations cross path boundaries and need stronger policy reasoning |
| `obsidian_delete_note` | destructive note mutation | false | blocked | blocked | allowed | none | destructive operation |
| `obsidian_set_property` | metadata mutation | false | blocked | policy-gated | allowed | exact note path inside writeAllowlist; per-call vault override disabled | frontmatter mutation |
| `obsidian_remove_property` | metadata mutation | false | blocked | policy-gated | allowed | exact note path inside writeAllowlist; per-call vault override disabled | frontmatter mutation |
| `obsidian_append_daily` | daily note mutation | false | blocked | blocked | allowed | none | blocked in governed-mutation because runtime-derived daily note resolution bypasses exact-path policy |
| `obsidian_prepend_daily` | daily note mutation | false | blocked | blocked | allowed | none | blocked in governed-mutation because runtime-derived daily note resolution bypasses exact-path policy |
| `obsidian_toggle_task` | task mutation | false | blocked | blocked | allowed | none | blocked in governed-mutation because line-based task toggles are deferred until they can be bounded more tightly |
| `obsidian_insert_template` | note mutation | false | blocked | blocked | allowed | none | blocked in governed-mutation because active-note template insertion depends on runtime state rather than exact-path policy |
| `obsidian_add_bookmark` | runtime-state mutation | false | blocked | blocked | allowed | none | bookmark mutation |
| `obsidian_rename_note` | note mutation | false | blocked | blocked | allowed | none | blocked in governed-mutation because rename moves identity and backlink state across paths |
| `obsidian_create_base_item` | bases mutation | false | blocked | blocked | allowed | none | base data mutation |
| `obsidian_execute_command` | execute | false | blocked | blocked | allowed | none | open-ended command execution |
| `obsidian_eval` | execute | false | blocked | blocked | allowed | none | arbitrary code execution |
| `obsidian_enable_plugin` | runtime-state mutation | false | blocked | blocked | allowed | none | `.obsidian` / plugin state mutation |
| `obsidian_disable_plugin` | runtime-state mutation | false | blocked | blocked | allowed | none | `.obsidian` / plugin state mutation |
| `obsidian_install_plugin` | runtime-state mutation | false | blocked | blocked | allowed | none | plugin payload mutation |
| `obsidian_uninstall_plugin` | runtime-state mutation | false | blocked | blocked | allowed | none | plugin payload mutation |
| `obsidian_history_restore` | restore mutation | false | blocked | blocked | allowed | none | content restore mutation |
| `obsidian_sync_restore` | restore mutation | false | blocked | blocked | allowed | none | content restore mutation |
| `obsidian_set_theme` | runtime-state mutation | false | blocked | blocked | allowed | none | theme mutation |
| `obsidian_install_theme` | runtime-state mutation | false | blocked | blocked | allowed | none | theme payload mutation |
| `obsidian_uninstall_theme` | runtime-state mutation | false | blocked | blocked | allowed | none | theme payload mutation |
| `obsidian_enable_snippet` | runtime-state mutation | false | blocked | blocked | allowed | none | snippet mutation |
| `obsidian_disable_snippet` | runtime-state mutation | false | blocked | blocked | allowed | none | snippet mutation |
| `obsidian_list_vaults` | environment introspection | true | blocked | blocked | allowed | none | expands vault discovery beyond governed scope |
| `obsidian_list_recents` | workspace/session introspection | true | blocked | blocked | allowed | none | transient session state |
| `obsidian_workspace` | workspace/session introspection | true | blocked | blocked | allowed | none | non-canonical runtime state |
| `obsidian_list_tabs` | workspace/session introspection | true | blocked | blocked | allowed | none | non-canonical runtime state |
| `obsidian_daily_path` | workspace/session introspection | true | blocked | blocked | allowed | none | runtime-dependent path resolution |
| `obsidian_list_commands` | command introspection | true | blocked | blocked | allowed | none | primarily feeds later command execution |
| `obsidian_list_hotkeys` | command introspection | true | blocked | blocked | allowed | none | app/runtime introspection |
| `obsidian_get_hotkey` | command introspection | true | blocked | blocked | allowed | none | app/runtime introspection |
| `obsidian_list_plugins` | runtime inventory | true | blocked | blocked | allowed | none | non-canonical plugin state |
| `obsidian_list_plugins_enabled` | runtime inventory | true | blocked | blocked | allowed | none | non-canonical plugin state |
| `obsidian_get_plugin` | runtime inventory | true | blocked | blocked | allowed | none | non-canonical plugin state |
| `obsidian_history_list` | history introspection | true | blocked | blocked | allowed | none | retention/privacy-sensitive history surface |
| `obsidian_history_read` | history introspection | true | blocked | blocked | allowed | none | retention/privacy-sensitive history surface |
| `obsidian_sync_status` | sync introspection | true | blocked | blocked | allowed | none | sync subsystem state |
| `obsidian_sync_history` | sync introspection | true | blocked | blocked | allowed | none | sync subsystem state |
| `obsidian_sync_read` | sync introspection | true | blocked | blocked | allowed | none | sync subsystem state |
| `obsidian_sync_deleted` | sync introspection | true | blocked | blocked | allowed | none | sync subsystem state |
| `obsidian_list_themes` | runtime inventory | true | blocked | blocked | allowed | none | non-canonical theme state |
| `obsidian_get_theme` | runtime inventory | true | blocked | blocked | allowed | none | non-canonical theme state |
| `obsidian_list_snippets` | runtime inventory | true | blocked | blocked | allowed | none | non-canonical snippet state |
| `obsidian_list_snippets_enabled` | runtime inventory | true | blocked | blocked | allowed | none | non-canonical snippet state |
| `obsidian_list_bookmarks` | runtime inventory | true | blocked | blocked | allowed | none | bookmark state is non-canonical `.obsidian` runtime data |

## 5. Vault policy design
- Policy model:
  - repo-local example at `examples/governed-vault-policy.example.json`
  - runtime policy file loaded from `OBSIDIAN_POLICY_FILE`
  - policy schema: `version`, `readAllowlist`, `writeAllowlist`, `denylist`, `denyHiddenPaths`, `denySymlinks`
- Defaults:
  - governed profiles require a pinned vault name plus a canonical filesystem root
  - `.obsidian` is added to the denylist by default
  - hidden paths are denied by default
  - symlink traversal is denied by default
- Deny paths:
  - explicit denylist entries override allowlists
  - hidden segments are rejected even if allowlists are broad
  - `.obsidian/**` is always blocked in governed profiles
- Read/write rules:
  - exact-path reads must land inside `readAllowlist`
  - exact-path writes must land inside `writeAllowlist`
  - write operations outside allowlists fail before the Obsidian CLI is spawned
- Path normalization/enforcement:
  - all governed paths are normalized relative to `OBSIDIAN_VAULT_ROOT`
  - traversal attempts such as `../outside.md` fail
  - canonical root containment is enforced
  - symlink traversal is rejected when enabled
- Config shape:
  - policy is operator-configurable JSON rather than hardcoded vault layout logic
  - sample conservative second-brain policy is included, but it is not the only supported layout
- Failure behavior:
  - deterministic startup errors when governed configuration is incomplete
  - deterministic operation errors when a governed command uses fuzzy selectors, non-allowlisted paths, hidden paths, denied paths, or symlinked paths

## 6. HTTP hardening design
- Auth model:
  - bearer token via `MCP_HTTP_AUTH_TOKEN`
  - constant-time token comparison using `timingSafeEqual`
  - authenticated requests only when a token is configured
- Host/bind model:
  - HTTP remains opt-in
  - bind host defaults to `127.0.0.1`
  - non-loopback bind requires `MCP_HTTP_ALLOW_REMOTE_BIND=true`
- Startup validation:
  - governed HTTP fails closed without `MCP_HTTP_AUTH_TOKEN`
  - any remote bind request fails closed without explicit remote-bind opt-in
  - remote bind also requires auth
- What is now safe enough:
  - controlled governed HTTP on explicitly configured loopback or explicitly opted-in remote bind, with bearer auth and fail-closed startup validation
- What is still not safe enough:
  - internet-facing deployment
  - claims of strong client identity, authorization tiers, or defense against token leakage
  - broad trust in HTTP beyond the explicit controlled-governed scope

## 7. Code changes made
- Files changed:
  - `src/runtime-config.ts`
  - `src/tool-registry.ts`
  - `src/server.ts`
  - `src/services/obsidian-cli.service.ts`
  - `src/transports/http.ts`
  - `src/index.ts`
  - `src/vault-policy.ts`
  - `tests/runtime-config.test.ts`
  - `tests/tool-registry.test.ts`
  - `tests/services/obsidian-cli.service.test.ts`
  - `tests/transports/http.test.ts`
  - `tests/vault-policy.test.ts`
  - `examples/governed-vault-policy.example.json`
  - `README.md`
  - `CHANGELOG.md`
  - `reports/phase2-governed-mutation-http-vault-hardening.md`
  - `reports/phase2-governed-mutation-http-vault-hardening.json`
- Architecture:
  - kept Phase 1’s central runtime/profile/tool-registry shape
  - added a dedicated vault-policy module and enforced it from the single CLI execution boundary
  - kept HTTP hardening inside the transport layer plus startup validation in runtime config
- Notable decisions:
  - narrowed governed-readonly further rather than leaving broad discovery tools exposed without denylist-safe filtering
  - deferred governed task toggle, rename, move, daily mutation, and template insertion until they can be bounded by exact-path policy
- Compatibility notes:
  - `personal-unrestricted` retains the broader legacy surface when explicitly selected
  - governed deployments now need `OBSIDIAN_VAULT_ROOT` and `OBSIDIAN_POLICY_FILE` in addition to `OBSIDIAN_VAULT`

## 8. Tests and validation
- Commands run:
  - `npm run lint`
  - `npm run build`
  - `npm test`
- Results:
  - `npm run lint`: passed
  - `npm run build`: passed
  - `npm test`: passed
  - final test suite result: 83 test files passed, 324 tests passed
- What is proven:
  - `governed-readonly` registers only the new exact-path governed read surface
  - `governed-mutation` registers only the intended exact-path mutation subset
  - `personal-unrestricted` still exposes the broad legacy surface explicitly
  - governed profiles reject per-call vault overrides
  - writes outside the write allowlist are blocked
  - writes inside the write allowlist are allowed
  - `.obsidian/**` writes are blocked
  - denylist paths are blocked
  - normalized traversal attempts are blocked
  - symlink traversal can be blocked
  - HTTP remains opt-in
  - loopback remains the default bind
  - governed HTTP startup fails without auth
  - authenticated HTTP requests succeed and unauthenticated requests fail
  - remote bind fails without explicit opt-in
- What is not proven:
  - end-to-end behavior against a live Obsidian desktop instance
  - denylist-safe filtering for broad governed search/list/discovery surfaces, which were intentionally left blocked instead
  - anything about internet-safe HTTP deployment beyond the bounded startup/auth checks implemented here

## 9. Remaining gaps for Phase 3+
- unresolved policy limitations:
  - broad governed search/list/discovery would need server-side result filtering or stronger CLI primitives
  - rename/move/delete/task-toggle/template-insert/daily mutation still need stricter path and state modeling
- unresolved transport limitations:
  - bearer auth is shared-secret only
  - no authorization tiers, no mTLS, no request signing, no OIDC
- unresolved mutation limitations:
  - no governed support for path-crossing or destructive note mutation
  - no governed support for runtime/app/plugin/theme/snippet mutation
- dependency/supply-chain items still deferred:
  - no dependency remediation was attempted in this run

## 10. Final status
- Is governed-mutation usable now:
  - yes, for exact-path note/property mutation inside a pinned vault root with a configured policy file and write allowlist
- Under what constraints:
  - use exact `path` selectors only
  - keep `OBSIDIAN_VAULT`, `OBSIDIAN_VAULT_ROOT`, and `OBSIDIAN_POLICY_FILE` configured
  - treat stdio as the preferred transport
  - if HTTP is used, provide `MCP_HTTP_AUTH_TOKEN` and do not assume internet-safe deployment
- What still must be avoided:
  - real-vault destructive or path-crossing mutation in governed profiles
  - runtime-state mutation surfaces
  - broad governed discovery assumptions beyond the explicit exact-path surface

## 11. Evidence appendix
- Files inspected:
  - `package.json`
  - `reports/phase1-governed-readonly-hardening.md`
  - `reports/phase1-governed-readonly-hardening.json`
  - `src/runtime-config.ts`
  - `src/tool-registry.ts`
  - `src/server.ts`
  - `src/services/obsidian-cli.service.ts`
  - `src/index.ts`
  - `src/transports/http.ts`
  - exact-path tool handlers under `src/tools/`
  - `tests/runtime-config.test.ts`
  - `tests/tool-registry.test.ts`
  - `tests/services/obsidian-cli.service.test.ts`
- Commands run:
  - `git status --short`
  - `git diff --stat`
  - `npm run lint`
  - `npm run build`
  - `npm test`
- Tests run:
  - registry/profile tests
  - vault-policy unit tests
  - governed service enforcement tests with disposable temp vault roots
  - HTTP transport tests with mocked streamable transport and Fastify inject
- Runtime checks performed:
  - disposable temp vault roots and policy files only
  - no real Obsidian vault was touched
  - `npm test` required execution outside the sandbox because Vitest writes temporary Vite config artifacts under `node_modules/.vite-temp` for this repo path
