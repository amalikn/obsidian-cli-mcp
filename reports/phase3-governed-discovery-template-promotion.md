# Phase 3 Governed Discovery + Template Creation + Promotion Workflows

## 0. Pre-code implementation plan
- Reconcile the Phase 2 deferred discovery/template items against the current runtime/profile/tool/policy code and keep all legacy broad discovery tools blocked unless replaced with server-side filtered governed equivalents.
- Extend the governed policy model in one central layer to cover discovery zones, approved templates, and workflow routing so Phase 3 stays configuration-driven rather than hardcoded to one vault layout.
- Add a governed filesystem workflow service for bounded search, template-aware note creation, and provenance-preserving promotion helpers without re-enabling runtime-state-dependent Obsidian CLI behaviors.
- Register only the new governed-safe discovery/workflow tools in governed profiles, add bounded tests around filtering and provenance rules, then validate with lint, build, and test before completing this report.

## 1. Executive summary
- What changed:
  - added policy-filtered governed discovery for `obsidian_search`, `obsidian_search_context`, `obsidian_list_links`, and `obsidian_list_backlinks`
  - added template-aware governed note creation through approved template types under `00_system/templates`
  - added provenance-preserving review, promotion-candidate, curated-note, and promotion-log workflows
  - extended the Phase 2 policy model with discovery, template, and workflow routing rules
- What risk was reduced:
  - governed discovery no longer has to stay broadly disabled just to avoid leaking blocked paths
  - governed graph/search results are now filtered server-side rather than trusted from the underlying CLI
  - governed template and promotion helpers create new notes only and keep source notes immutable
- What usability improved:
  - governed-readonly is now practical for bounded review and search work
  - governed-mutation can now create review and curated artifacts without widening into rename/move/delete/runtime-state mutation
- What remains out of scope:
  - broad governed folder listing, tag discovery, task discovery, base discovery, and template name-based discovery
  - destructive/path-crossing mutation
  - runtime-state mutation
  - internet-safe HTTP claims

## 2. Phase 2 reconciliation
- Phase 2 deferred items addressed now:
  - denylist-safe governed search
  - denylist-safe governed search-with-context
  - denylist-safe governed outgoing link and backlink discovery
  - template-aware governed creation under `00_system/templates`
  - review-oriented promotion helpers with explicit provenance
- Deferred items that remain deferred:
  - broad listing surfaces such as `obsidian_list_files`, `obsidian_list_folders`, `obsidian_list_tags`, `obsidian_list_tasks`, and base discovery
  - governed template listing/reading through the legacy template tools
  - rename/move/delete/restore/task-toggle in governed profiles
  - stronger transport identity/authorization beyond bearer-authenticated controlled HTTP
- Why some items remain deferred:
  - this run stayed fail-closed and did not re-expose broad CLI discovery where results still depend on name-based or runtime-state behavior

## 3. Profile model
- `governed-readonly`
  - intended use: pinned-vault review work with bounded search and filtered graph discovery
  - current governed-safe surface: exact-path note/property reads, filtered search, filtered search-with-context, filtered links, filtered backlinks, bounded vault metadata
  - still blocked: all mutation, runtime-state introspection, and broad vault-wide discovery
- `governed-mutation`
  - intended use: governed review plus bounded creation/promotion helpers
  - current governed-safe surface: everything in `governed-readonly`, exact-path note/property mutation, template-aware note creation, review note creation, promotion-candidate creation, curated note creation, promotion logging
  - still blocked: rename, move, delete, restore, task toggle, runtime-state mutation, active-note template insertion
- `personal-unrestricted`
  - intended use: compatibility profile for the broad legacy CLI surface
  - current behavior: retains the existing legacy tool surface only when explicitly selected
  - no implicit fallback: governed profiles do not fall back to `personal-unrestricted`

## 4. Discovery model
- What discovery/search is now allowed:
  - `obsidian_search` with server-side filtering over `discoveryAllowlist`
  - `obsidian_search_context` with server-side filtering over `discoveryAllowlist`
  - `obsidian_list_links` for allowed notes with blocked targets filtered out
  - `obsidian_list_backlinks` for allowed notes with blocked sources filtered out
- How server-side filtering works:
  - governed discovery walks only allowed discovery roots
  - every candidate file path is still checked against denylist, hidden-path rules, `.obsidian` denial, traversal blocking, and optional symlink blocking
  - graph resolution happens in the server layer and drops blocked targets/sources before returning results
- What is still blocked:
  - broad folder/file listing
  - tag/task/base discovery
  - template discovery through the legacy name-based tools
  - orphans/deadends/unresolved graph audits
- Why:
  - those legacy surfaces still expand beyond explicit policy-bounded paths or return results that are not yet filtered safely enough

## 5. Template-aware creation model
- Approved template flow:
  - operator config defines `templateAllowlist`
  - operator config maps `templateType -> templatePath + destinationRoots + requiredProvenance`
  - `obsidian_create_note_from_template` resolves template type, reads the approved template file, applies minimal `{{variable}}` substitution, merges governed metadata, and writes only to approved destinations
- Destination routing rules:
  - destination path must be explicit for the generic template tool
  - destination path must satisfy both `writeAllowlist` and the selected template type’s `destinationRoots`
  - overwrite is blocked
- Variable handling:
  - simple explicit string substitution only
  - no active-note or runtime-state insertion behavior
  - workflow helpers add deterministic variables like `source_path` and `source_name`
- Guardrails:
  - unknown template types fail closed
  - template reads outside `templateAllowlist` fail closed
  - destinations outside approved roots fail closed
  - templates that require provenance fail without provenance input

## 6. Promotion workflow model
- Review note creation:
  - `obsidian_create_review_note`
  - source path must be inside configured review `sourceRoots`
  - destination defaults deterministically under the configured review root and preserves source subpath structure
  - provenance frontmatter and source links are added
- Promotion-candidate creation:
  - `obsidian_create_promotion_candidate`
  - same bounded-source behavior as review notes
  - deterministic destination and provenance behavior
- Curated note creation:
  - `obsidian_create_curated_note`
  - source path must be approved
  - template type must be in curated workflow `allowedTemplateTypes`
  - destination must be explicit and inside both curated workflow destination roots and the selected template type’s destination roots
  - provenance is preserved in frontmatter and links
- Promotion log behavior:
  - `obsidian_log_promotion`
  - writes only under configured promotion-log roots
  - logs source and curated note references without mutating either
  - can use an approved log template if configured
- What stays out of scope:
  - moving raw imports into curated zones
  - deleting or rewriting source notes
  - hidden approval state mutation
  - bulk promotion

## 7. Tool classification
| tool | category | read_only | governed_readonly | governed_mutation | personal_unrestricted | policy_required | reason |
|---|---|---:|---|---|---|---|---|
| `obsidian_read_note` | note content | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | canonical note read |
| `obsidian_create_note` | note mutation | false | blocked | policy-gated | allowed | exact note path inside writeAllowlist; no name selector; no template insertion; overwrite blocked | note creation |
| `obsidian_append_note` | note mutation | false | blocked | policy-gated | allowed | exact note path inside writeAllowlist; per-call vault override disabled | note write |
| `obsidian_prepend_note` | note mutation | false | blocked | policy-gated | allowed | exact note path inside writeAllowlist; per-call vault override disabled | note write |
| `obsidian_move_note` | note mutation | false | blocked | blocked | allowed | none | blocked in governed-mutation because move operations cross path boundaries and need stronger policy reasoning |
| `obsidian_delete_note` | destructive note mutation | false | blocked | blocked | allowed | none | destructive operation |
| `obsidian_vault_info` | vault metadata | true | allowed | allowed | allowed | none | bounded vault introspection |
| `obsidian_list_files` | vault listing | true | blocked | blocked | allowed | none | blocked in governed profiles because broad folder enumeration cannot currently guarantee denylist-safe filtering |
| `obsidian_list_folders` | vault listing | true | blocked | blocked | allowed | none | blocked in governed profiles because broad folder enumeration cannot currently guarantee denylist-safe filtering |
| `obsidian_search` | search | true | policy-gated | policy-gated | allowed | query limited to discoveryAllowlist; optional path filter inside discoveryAllowlist; results filtered server-side | bounded full-text discovery without blocked-path leakage |
| `obsidian_search_context` | search | true | policy-gated | policy-gated | allowed | query limited to discoveryAllowlist; optional path filter inside discoveryAllowlist; results filtered server-side | bounded search with context without blocked-path leakage |
| `obsidian_list_properties` | metadata | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | frontmatter read |
| `obsidian_get_property` | metadata | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | frontmatter read |
| `obsidian_set_property` | metadata mutation | false | blocked | policy-gated | allowed | exact note path inside writeAllowlist; per-call vault override disabled | frontmatter mutation |
| `obsidian_remove_property` | metadata mutation | false | blocked | policy-gated | allowed | exact note path inside writeAllowlist; per-call vault override disabled | frontmatter mutation |
| `obsidian_list_tags` | metadata | true | blocked | blocked | allowed | none | blocked in governed profiles because vault-wide metadata discovery bypasses exact-path policy checks |
| `obsidian_get_tag` | metadata | true | blocked | blocked | allowed | none | blocked in governed profiles because tag queries are vault-wide discovery operations |
| `obsidian_list_links` | graph | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist and discoveryAllowlist; linked results filtered server-side | filtered outgoing link discovery |
| `obsidian_list_backlinks` | graph | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist and discoveryAllowlist; backlink sources filtered server-side | filtered backlink discovery |
| `obsidian_list_orphans` | graph | true | blocked | blocked | allowed | none | blocked in governed profiles because vault-wide graph audits bypass exact-path policy checks |
| `obsidian_read_daily` | daily notes | true | blocked | blocked | allowed | none | blocked in governed profiles because runtime-derived daily note resolution bypasses exact-path policy checks |
| `obsidian_append_daily` | daily note mutation | false | blocked | blocked | allowed | none | blocked in governed-mutation because runtime-derived daily note resolution bypasses exact-path policy |
| `obsidian_prepend_daily` | daily note mutation | false | blocked | blocked | allowed | none | blocked in governed-mutation because runtime-derived daily note resolution bypasses exact-path policy |
| `obsidian_list_tasks` | task discovery | true | blocked | blocked | allowed | none | blocked in governed profiles because task discovery can expand beyond explicit policy-bounded paths |
| `obsidian_toggle_task` | task mutation | false | blocked | blocked | allowed | none | blocked in governed-mutation because line-based task toggles are deferred until they can be bounded more tightly |
| `obsidian_list_templates` | templates | true | blocked | blocked | allowed | none | blocked in governed profiles because template discovery is not yet bound to explicit path policy |
| `obsidian_read_template` | templates | true | blocked | blocked | allowed | none | blocked in governed profiles because template resolution is name-based rather than exact-path governed |
| `obsidian_insert_template` | note mutation | false | blocked | blocked | allowed | none | blocked in governed-mutation because active-note template insertion depends on runtime state rather than exact-path policy |
| `obsidian_list_bookmarks` | runtime inventory | true | blocked | blocked | allowed | none | bookmark state is non-canonical `.obsidian` runtime data |
| `obsidian_add_bookmark` | runtime-state mutation | false | blocked | blocked | allowed | none | bookmark mutation |
| `obsidian_list_deadends` | graph | true | blocked | blocked | allowed | none | blocked in governed profiles because vault-wide graph audits bypass exact-path policy checks |
| `obsidian_list_unresolved` | graph | true | blocked | blocked | allowed | none | blocked in governed profiles because vault-wide graph audits bypass exact-path policy checks |
| `obsidian_outline` | note structure | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | note introspection |
| `obsidian_wordcount` | note structure | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | note introspection |
| `obsidian_rename_note` | note mutation | false | blocked | blocked | allowed | none | blocked in governed-mutation because rename moves identity and backlink state across paths |
| `obsidian_file_info` | note metadata | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | file metadata read |
| `obsidian_list_plugins` | runtime inventory | true | blocked | blocked | allowed | none | non-canonical plugin state |
| `obsidian_list_plugins_enabled` | runtime inventory | true | blocked | blocked | allowed | none | non-canonical plugin state |
| `obsidian_get_plugin` | runtime inventory | true | blocked | blocked | allowed | none | non-canonical plugin state |
| `obsidian_enable_plugin` | runtime-state mutation | false | blocked | blocked | allowed | none | `.obsidian` / plugin state mutation |
| `obsidian_disable_plugin` | runtime-state mutation | false | blocked | blocked | allowed | none | `.obsidian` / plugin state mutation |
| `obsidian_install_plugin` | runtime-state mutation | false | blocked | blocked | allowed | none | plugin payload mutation |
| `obsidian_uninstall_plugin` | runtime-state mutation | false | blocked | blocked | allowed | none | plugin payload mutation |
| `obsidian_history_list` | history introspection | true | blocked | blocked | allowed | none | retention/privacy-sensitive history surface |
| `obsidian_history_read` | history introspection | true | blocked | blocked | allowed | none | retention/privacy-sensitive history surface |
| `obsidian_history_restore` | restore mutation | false | blocked | blocked | allowed | none | content restore mutation |
| `obsidian_sync_status` | sync introspection | true | blocked | blocked | allowed | none | sync subsystem state |
| `obsidian_sync_history` | sync introspection | true | blocked | blocked | allowed | none | sync subsystem state |
| `obsidian_sync_read` | sync introspection | true | blocked | blocked | allowed | none | sync subsystem state |
| `obsidian_sync_restore` | restore mutation | false | blocked | blocked | allowed | none | content restore mutation |
| `obsidian_sync_deleted` | sync introspection | true | blocked | blocked | allowed | none | sync subsystem state |
| `obsidian_list_bases` | bases | true | blocked | blocked | allowed | none | blocked in governed profiles because base discovery is vault-wide and not exact-path policy-bounded |
| `obsidian_query_base` | bases | true | blocked | blocked | allowed | none | blocked in governed profiles because base queries are not constrained by exact-path vault policy |
| `obsidian_list_base_views` | bases | true | blocked | blocked | allowed | none | blocked in governed profiles because base view discovery is not exact-path policy-bounded |
| `obsidian_create_base_item` | bases mutation | false | blocked | blocked | allowed | none | base data mutation |
| `obsidian_list_vaults` | environment introspection | true | blocked | blocked | allowed | none | expands vault discovery beyond governed scope |
| `obsidian_version` | version | true | allowed | allowed | allowed | none | safe environment info |
| `obsidian_list_recents` | workspace/session introspection | true | blocked | blocked | allowed | none | transient session state |
| `obsidian_random_read` | note content | true | blocked | blocked | allowed | none | blocked in governed profiles because random note selection bypasses exact-path policy checks |
| `obsidian_list_aliases` | metadata | true | blocked | blocked | allowed | none | blocked in governed profiles because vault-wide alias discovery bypasses exact-path policy checks |
| `obsidian_workspace` | workspace/session introspection | true | blocked | blocked | allowed | none | non-canonical runtime state |
| `obsidian_list_tabs` | workspace/session introspection | true | blocked | blocked | allowed | none | non-canonical runtime state |
| `obsidian_daily_path` | workspace/session introspection | true | blocked | blocked | allowed | none | runtime-dependent path resolution |
| `obsidian_list_commands` | command introspection | true | blocked | blocked | allowed | none | primarily feeds later command execution |
| `obsidian_execute_command` | execute | false | blocked | blocked | allowed | none | open-ended command execution |
| `obsidian_list_hotkeys` | command introspection | true | blocked | blocked | allowed | none | app/runtime introspection |
| `obsidian_get_hotkey` | command introspection | true | blocked | blocked | allowed | none | app/runtime introspection |
| `obsidian_list_themes` | runtime inventory | true | blocked | blocked | allowed | none | non-canonical theme state |
| `obsidian_get_theme` | runtime inventory | true | blocked | blocked | allowed | none | non-canonical theme state |
| `obsidian_set_theme` | runtime-state mutation | false | blocked | blocked | allowed | none | theme mutation |
| `obsidian_install_theme` | runtime-state mutation | false | blocked | blocked | allowed | none | theme payload mutation |
| `obsidian_uninstall_theme` | runtime-state mutation | false | blocked | blocked | allowed | none | theme payload mutation |
| `obsidian_list_snippets` | runtime inventory | true | blocked | blocked | allowed | none | non-canonical snippet state |
| `obsidian_list_snippets_enabled` | runtime inventory | true | blocked | blocked | allowed | none | non-canonical snippet state |
| `obsidian_enable_snippet` | runtime-state mutation | false | blocked | blocked | allowed | none | snippet mutation |
| `obsidian_disable_snippet` | runtime-state mutation | false | blocked | blocked | allowed | none | snippet mutation |
| `obsidian_diff` | note comparison | true | policy-gated | policy-gated | allowed | exact note path inside readAllowlist; per-call vault override disabled | read-only comparison |
| `obsidian_eval` | execute | false | blocked | blocked | allowed | none | arbitrary code execution |
| `obsidian_create_note_from_template` | template workflow | false | blocked | policy-gated | blocked | approved templateType, templateAllowlist read, template destination roots, writeAllowlist, no overwrite | deterministic template-based note creation without runtime-state insertion |
| `obsidian_create_review_note` | promotion workflow | false | blocked | policy-gated | blocked | review workflow sourceRoots, destinationRoot, templateType, writeAllowlist, provenance required | create provenance-preserving review notes from approved import sources |
| `obsidian_create_promotion_candidate` | promotion workflow | false | blocked | policy-gated | blocked | promotionCandidate workflow sourceRoots, destinationRoot, templateType, writeAllowlist, provenance required | create provenance-preserving promotion candidates from approved import sources |
| `obsidian_create_curated_note` | promotion workflow | false | blocked | policy-gated | blocked | curatedNote sourceRoots, destinationRoots, allowedTemplateTypes, template destination roots, writeAllowlist | create curated notes with explicit provenance and destination controls |
| `obsidian_log_promotion` | promotion workflow | false | blocked | policy-gated | blocked | promotionLog destinationRoot, optional templateType, source and curated paths inside governed policy | record promotion events without mutating source notes |

## 8. Policy model changes
- Discovery policy:
  - added `discoveryAllowlist`
  - discovery roots must remain inside the governing read allowlist
  - search and graph discovery now check discovery policy plus denylist/hidden path rules
- Template policy:
  - added `templateAllowlist`
  - added `templateTypes`
  - each template type defines an approved template path, destination roots, and whether provenance is required
- Workflow destination rules:
  - added `workflows.review`
  - added `workflows.promotionCandidate`
  - added `workflows.curatedNote`
  - added `workflows.promotionLog`
  - workflow config is validated at load time so bad routing fails at startup rather than leaking into runtime behavior
- Denylist/allowlist interactions:
  - denylist still overrides discovery, read, write, and template scopes
  - `.obsidian/**` remains denied by default
  - hidden paths and traversal attempts remain blocked
  - optional symlink blocking remains enforced when enabled

## 9. Code changes made
- Files changed:
  - `src/vault-policy.ts`
  - `src/services/governed-vault.service.ts`
  - `src/tool-registry.ts`
  - `src/server.ts`
  - `src/runtime-config.ts`
  - `src/tools/search/search-notes-governed.tool.ts`
  - `src/tools/search/search-context-governed.tool.ts`
  - `src/tools/links/list-links-governed.tool.ts`
  - `src/tools/links/list-backlinks-governed.tool.ts`
  - `src/tools/templates/create-note-from-template.tool.ts`
  - `src/tools/workflows/create-review-note.tool.ts`
  - `src/tools/workflows/create-promotion-candidate.tool.ts`
  - `src/tools/workflows/create-curated-note.tool.ts`
  - `src/tools/workflows/log-promotion.tool.ts`
  - `tests/services/governed-vault.service.test.ts`
  - `tests/vault-policy.test.ts`
  - `tests/tool-registry.test.ts`
  - `examples/governed-vault-policy.example.json`
  - `README.md`
  - `CHANGELOG.md`
  - `reports/phase3-governed-discovery-template-promotion.md`
  - `reports/phase3-governed-discovery-template-promotion.json`
- Architecture:
  - kept the CLI service for the legacy and exact-path Phase 2 surface
  - added a separate governed filesystem service for Phase 3 discovery and workflow features
  - kept policy parsing and validation centralized in `src/vault-policy.ts`
  - kept profile switching centralized in `src/tool-registry.ts`
- Notable decisions:
  - did not re-enable broad discovery tools that still depend on unsafe downstream behavior
  - replaced governed search/graph behavior server-side instead of trusting CLI output filtering
  - kept promotion helpers create-only and provenance-first
- Compatibility notes:
  - `personal-unrestricted` still exposes the broad legacy surface only when explicitly selected
  - the new governed workflow tools are governed-only and do not become a fallback path for unrestricted mode

## 10. Tests and validation
- Commands run:
  - `npm run lint`
  - `npm run build`
  - `npm test -- --run tests/services/governed-vault.service.test.ts tests/vault-policy.test.ts tests/tool-registry.test.ts`
  - `npm test`
- Results:
  - `npm run lint`: passed
  - `npm run build`: passed
  - focused Phase 3 suite: passed
  - `npm test`: passed
  - final suite result: 84 test files passed, 337 tests passed
- What is proven:
  - governed discovery returns only allowed results and hides denylisted and `.obsidian` paths
  - governed outgoing links and backlinks are filtered server-side
  - approved templates can create notes only in approved destinations
  - disallowed template types and destinations are blocked deterministically
  - review, promotion-candidate, curated-note, and promotion-log workflows preserve provenance
  - source notes are not mutated by the Phase 3 workflow helpers
  - governed-readonly and governed-mutation profile registration stayed bounded
- What is not proven:
  - no real-vault behavior was exercised
  - no live Obsidian desktop runtime-state behavior was exercised for the new governed workflows because the Phase 3 design intentionally avoids those dependencies

## 11. Remaining gaps for Phase 4+
- Unresolved discovery limitations:
  - broad folder listing
  - tag discovery
  - task discovery
  - base discovery
  - template list/read under governed mode
- Unresolved mutation limitations:
  - rename
  - move
  - delete
  - restore
  - task toggle
  - daily note mutation
- Unresolved promotion limitations:
  - no approval-state transitions
  - no bulk promotion
  - no source-note relinking or rewrite workflow
- Unresolved transport or supply-chain items:
  - HTTP remains bearer-auth controlled use only
  - no stronger identity/authorization layer
  - no dependency remediation run in this phase

## 12. Final status
- Governed discovery usable now:
  - yes, for bounded search, bounded search-with-context, and filtered link/backlink review inside approved discovery roots
- Template-aware creation usable now:
  - yes, when the operator defines approved template types and destination roots in the policy file
- Promotion workflows usable now:
  - yes, for review-note creation, promotion-candidate creation, curated-note creation, and promotion-log creation inside approved zones
- What still must be avoided:
  - destructive or path-crossing mutation
  - runtime-state mutation
  - name-based template discovery in governed mode
  - internet-facing HTTP claims

## 13. Evidence appendix
- Files inspected:
  - `reports/phase2-governed-mutation-http-vault-hardening.md`
  - `reports/phase2-governed-mutation-http-vault-hardening.json`
  - `src/runtime-config.ts`
  - `src/tool-registry.ts`
  - `src/vault-policy.ts`
  - `src/server.ts`
  - `src/services/obsidian-cli.service.ts`
  - representative existing tools and tests under `src/tools/` and `tests/`
- Commands run:
  - `git status --short`
  - `rg --files src/tools`
  - `npm run lint`
  - `npm run build`
  - `npm test -- --run tests/services/governed-vault.service.test.ts tests/vault-policy.test.ts tests/tool-registry.test.ts`
  - `npm test`
- Tests run:
  - focused Phase 3 policy/workflow tests
  - full Vitest suite
- Runtime checks performed:
  - disposable temp vaults only
  - no real Obsidian vault access
