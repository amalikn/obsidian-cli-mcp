import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listThemesHandler, registerListThemesTool } from '../../../src/tools/themes/list-themes.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listThemesHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI themes command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('theme-a\ntheme-b')

    await listThemesHandler({ versions: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('themes', { versions: undefined, vault: undefined })
  })

  it('passes versions flag when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await listThemesHandler({ versions: true, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('themes', expect.objectContaining({ versions: true }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Vault error'))

    const result = await listThemesHandler({ versions: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListThemesTool', () => {
  it('registers tool with name obsidian_list_themes', () => {
    const server = { registerTool: vi.fn() }
    registerListThemesTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_themes', expect.objectContaining({ title: 'List Themes' }), expect.any(Function))
  })
})
