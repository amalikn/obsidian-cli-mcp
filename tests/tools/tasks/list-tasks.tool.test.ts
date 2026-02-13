import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listTasksHandler, registerListTasksTool } from '../../../src/tools/tasks/list-tasks.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listTasksHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI tasks command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('- [ ] Write tests')
    await listTasksHandler({ file: undefined, path: undefined, done: undefined, todo: undefined, vault: undefined }, cli)
    expect(cli.run).toHaveBeenCalledWith('tasks', { file: undefined, path: undefined, done: undefined, todo: undefined, vault: undefined })
  })

  it('passes todo filter when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('- [ ] task')
    await listTasksHandler({ file: undefined, path: undefined, done: undefined, todo: true, vault: undefined }, cli)
    expect(cli.run).toHaveBeenCalledWith('tasks', expect.objectContaining({ todo: true }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('error'))
    const result = await listTasksHandler({ file: undefined, path: undefined, done: undefined, todo: undefined, vault: undefined }, cli)
    expect(result.isError).toBe(true)
  })
})

describe('registerListTasksTool', () => {
  it('registers tool with name obsidian_list_tasks', () => {
    const server = { registerTool: vi.fn() }
    registerListTasksTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_tasks', expect.objectContaining({ title: 'List Tasks' }), expect.any(Function))
  })
})
