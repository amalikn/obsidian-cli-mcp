import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listCommandsHandler, registerListCommandsTool } from '../../../src/tools/commands/list-commands.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listCommandsHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI commands command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('command-a\ncommand-b')

    await listCommandsHandler({ filter: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('commands', { filter: undefined, vault: undefined })
  })

  it('passes filter param when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await listCommandsHandler({ filter: 'toggle', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('commands', expect.objectContaining({ filter: 'toggle' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Vault error'))

    const result = await listCommandsHandler({ filter: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListCommandsTool', () => {
  it('registers tool with name obsidian_list_commands', () => {
    const server = { registerTool: vi.fn() }
    registerListCommandsTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_commands', expect.objectContaining({ title: 'List Commands' }), expect.any(Function))
  })
})
