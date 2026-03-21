import { describe, expect, it } from 'vitest'
import {
  getRegisteredToolNames,
  GOVERNED_MUTATION_TOOL_NAMES,
  GOVERNED_READONLY_TOOL_NAMES,
  TOOL_REGISTRATIONS,
} from '../src/tool-registry.js'

describe('tool registry profiles', () => {
  it('governed-readonly adds bounded governed discovery but no mutation', () => {
    const governedTools = getRegisteredToolNames('governed-readonly')

    expect(governedTools).toEqual([...GOVERNED_READONLY_TOOL_NAMES])
    expect(governedTools).toContain('obsidian_search')
    expect(governedTools).toContain('obsidian_search_context')
    expect(governedTools).toContain('obsidian_list_links')
    expect(governedTools).toContain('obsidian_list_backlinks')
    expect(governedTools).not.toContain('obsidian_eval')
    expect(governedTools).not.toContain('obsidian_execute_command')
    expect(governedTools).not.toContain('obsidian_create_note')
    expect(governedTools).not.toContain('obsidian_list_files')
    expect(governedTools).not.toContain('obsidian_create_review_note')
    expect(governedTools).not.toContain('obsidian_create_note_from_template')
  })

  it('governed-mutation adds workflow-safe creation while keeping destructive discovery tools blocked', () => {
    const governedMutationTools = getRegisteredToolNames('governed-mutation')

    expect(governedMutationTools).toEqual([...GOVERNED_MUTATION_TOOL_NAMES])
    expect(governedMutationTools).toContain('obsidian_create_note')
    expect(governedMutationTools).toContain('obsidian_append_note')
    expect(governedMutationTools).toContain('obsidian_prepend_note')
    expect(governedMutationTools).toContain('obsidian_set_property')
    expect(governedMutationTools).toContain('obsidian_remove_property')
    expect(governedMutationTools).toContain('obsidian_create_note_from_template')
    expect(governedMutationTools).toContain('obsidian_create_review_note')
    expect(governedMutationTools).toContain('obsidian_create_promotion_candidate')
    expect(governedMutationTools).toContain('obsidian_create_curated_note')
    expect(governedMutationTools).toContain('obsidian_log_promotion')
    expect(governedMutationTools).not.toContain('obsidian_toggle_task')
    expect(governedMutationTools).not.toContain('obsidian_rename_note')
    expect(governedMutationTools).not.toContain('obsidian_delete_note')
    expect(governedMutationTools).not.toContain('obsidian_insert_template')
    expect(governedMutationTools).not.toContain('obsidian_list_files')
  })

  it('personal-unrestricted preserves the full legacy tool surface', () => {
    const unrestrictedTools = getRegisteredToolNames('personal-unrestricted')

    expect(unrestrictedTools).toHaveLength(TOOL_REGISTRATIONS.filter(({ register }) => register).length)
    expect(unrestrictedTools).toContain('obsidian_eval')
    expect(unrestrictedTools).toContain('obsidian_execute_command')
    expect(unrestrictedTools).toContain('obsidian_create_note')
    expect(unrestrictedTools).toContain('obsidian_install_plugin')
    expect(unrestrictedTools).not.toContain('obsidian_create_review_note')
    expect(unrestrictedTools).not.toContain('obsidian_log_promotion')
  })

  it('keeps governed-readonly as a strict subset of governed-mutation and personal-unrestricted', () => {
    const governedTools = new Set(getRegisteredToolNames('governed-readonly'))
    const mutationTools = new Set(getRegisteredToolNames('governed-mutation'))
    const unrestrictedTools = new Set(getRegisteredToolNames('personal-unrestricted'))

    expect(governedTools.size).toBeLessThan(mutationTools.size)
    expect(mutationTools.size).toBeLessThan(unrestrictedTools.size)

    for (const toolName of governedTools) {
      expect(mutationTools.has(toolName)).toBe(true)
      expect(unrestrictedTools.has(toolName)).toBe(true)
    }
  })
})
