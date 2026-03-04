import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listHotkeysHandler, registerListHotkeysTool } from '../../../src/tools/commands/list-hotkeys.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listHotkeysHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI hotkeys command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Ctrl+B: toggle-bold')

    await listHotkeysHandler({ total: undefined, verbose: undefined, format: undefined, all: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('hotkeys', { total: undefined, verbose: undefined, format: undefined, all: undefined, vault: undefined })
  })

  it('passes params when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await listHotkeysHandler({ total: true, verbose: true, format: 'json', all: true, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('hotkeys', expect.objectContaining({ total: true, verbose: true, format: 'json', all: true }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Vault error'))

    const result = await listHotkeysHandler({ total: undefined, verbose: undefined, format: undefined, all: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListHotkeysTool', () => {
  it('registers tool with name obsidian_list_hotkeys', () => {
    const server = { registerTool: vi.fn() }
    registerListHotkeysTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_hotkeys', expect.objectContaining({ title: 'List Hotkeys' }), expect.any(Function))
  })
})
