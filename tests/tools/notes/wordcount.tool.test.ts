import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { wordcountHandler, registerWordcountTool } from '../../../src/tools/notes/wordcount.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('wordcountHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI wordcount command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('words: 120, characters: 650')

    await wordcountHandler({ file: 'My Note', path: undefined, words: undefined, characters: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('wordcount', { file: 'My Note', path: undefined, words: undefined, characters: undefined, vault: undefined })
  })

  it('passes words flag when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('120')

    await wordcountHandler({ file: 'My Note', path: undefined, words: true, characters: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('wordcount', expect.objectContaining({ words: true }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Note not found'))

    const result = await wordcountHandler({ file: 'missing', path: undefined, words: undefined, characters: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerWordcountTool', () => {
  it('registers tool with name obsidian_wordcount', () => {
    const server = { registerTool: vi.fn() }
    registerWordcountTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_wordcount', expect.objectContaining({ title: 'Word Count' }), expect.any(Function))
  })
})
