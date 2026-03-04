import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { evalHandler, registerEvalTool } from '../../../src/tools/notes/eval.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('evalHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI eval command with code', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('42')

    await evalHandler({ code: 'app.vault.getName()', vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('eval', expect.objectContaining({ code: 'app.vault.getName()' }))
  })

  it('passes vault when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('result')

    await evalHandler({ code: '1 + 1', vault: 'MyVault' }, cli)

    expect(cli.run).toHaveBeenCalledWith('eval', expect.objectContaining({ vault: 'MyVault' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Eval error'))

    const result = await evalHandler({ code: 'throw new Error()', vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerEvalTool', () => {
  it('registers tool with name obsidian_eval', () => {
    const server = { registerTool: vi.fn() }
    registerEvalTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_eval', expect.objectContaining({ title: 'Evaluate JavaScript' }), expect.any(Function))
  })
})
