import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { executeCommandHandler, registerExecuteCommandTool } from '../../../src/tools/commands/execute-command.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('executeCommandHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI command command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Command executed')

    await executeCommandHandler({ id: 'editor:toggle-bold', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('command', { id: 'editor:toggle-bold', vault: undefined })
  })

  it('passes id param correctly', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await executeCommandHandler({ id: 'app:open-settings', vault: 'MyVault' }, cli)

    expect(cli.run).toHaveBeenCalledWith('command', expect.objectContaining({ id: 'app:open-settings', vault: 'MyVault' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Command not found'))

    const result = await executeCommandHandler({ id: 'unknown:command', vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerExecuteCommandTool', () => {
  it('registers tool with name obsidian_execute_command', () => {
    const server = { registerTool: vi.fn() }
    registerExecuteCommandTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_execute_command', expect.objectContaining({ title: 'Execute Command' }), expect.any(Function))
  })
})
