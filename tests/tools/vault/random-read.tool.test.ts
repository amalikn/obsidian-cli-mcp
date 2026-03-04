import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { randomReadHandler, registerRandomReadTool } from '../../../src/tools/vault/random-read.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('randomReadHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI random:read command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('# Random Note\nSome content')

    await randomReadHandler({ folder: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('random:read', { folder: undefined, vault: undefined })
  })

  it('passes params when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await randomReadHandler({ folder: 'notes', vault: 'my-vault' }, cli)

    expect(cli.run).toHaveBeenCalledWith('random:read', expect.objectContaining({ folder: 'notes', vault: 'my-vault' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('CLI error'))

    const result = await randomReadHandler({ folder: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerRandomReadTool', () => {
  it('registers tool with name obsidian_random_read', () => {
    const server = { registerTool: vi.fn() }
    registerRandomReadTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_random_read', expect.objectContaining({ title: 'Read Random Note' }), expect.any(Function))
  })
})
