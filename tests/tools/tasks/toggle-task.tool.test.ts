import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { toggleTaskHandler, registerToggleTaskTool } from '../../../src/tools/tasks/toggle-task.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('toggleTaskHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI task command with toggle flag and line', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('')
    await toggleTaskHandler({ file: 'My Note', path: undefined, line: '5', vault: undefined }, cli)
    expect(cli.run).toHaveBeenCalledWith('task', expect.objectContaining({ toggle: true, line: '5', file: 'My Note' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Line not found'))
    const result = await toggleTaskHandler({ file: undefined, path: undefined, line: '99', vault: undefined }, cli)
    expect(result.isError).toBe(true)
  })
})

describe('registerToggleTaskTool', () => {
  it('registers tool with name obsidian_toggle_task', () => {
    const server = { registerTool: vi.fn() }
    registerToggleTaskTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_toggle_task', expect.objectContaining({ title: 'Toggle Task' }), expect.any(Function))
  })
})
