import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { setPropertyHandler, registerSetPropertyTool } from '../../../src/tools/properties/set-property.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('setPropertyHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI property:set command with name and value', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('')

    await setPropertyHandler({ name: 'status', value: 'done', type: undefined, file: 'My Note', path: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('property:set', { name: 'status', value: 'done', type: undefined, file: 'My Note', path: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('error'))

    const result = await setPropertyHandler({ name: 'p', value: 'v', type: undefined, file: undefined, path: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerSetPropertyTool', () => {
  it('registers tool with name obsidian_set_property', () => {
    const server = { registerTool: vi.fn() }
    registerSetPropertyTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_set_property', expect.objectContaining({ title: 'Set Property' }), expect.any(Function))
  })
})
