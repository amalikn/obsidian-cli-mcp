import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { getHotkeyHandler, registerGetHotkeyTool } from '../../../src/tools/commands/get-hotkey.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('getHotkeyHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI hotkey command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Ctrl+B')

    await getHotkeyHandler({ id: 'editor:toggle-bold', verbose: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('hotkey', { id: 'editor:toggle-bold', verbose: undefined, vault: undefined })
  })

  it('passes id and verbose params correctly', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await getHotkeyHandler({ id: 'editor:toggle-bold', verbose: true, vault: 'MyVault' }, cli)

    expect(cli.run).toHaveBeenCalledWith('hotkey', expect.objectContaining({ id: 'editor:toggle-bold', verbose: true, vault: 'MyVault' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Command not found'))

    const result = await getHotkeyHandler({ id: 'unknown:command', verbose: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerGetHotkeyTool', () => {
  it('registers tool with name obsidian_get_hotkey', () => {
    const server = { registerTool: vi.fn() }
    registerGetHotkeyTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_get_hotkey', expect.objectContaining({ title: 'Get Hotkey' }), expect.any(Function))
  })
})
