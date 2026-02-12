import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { removePropertyHandler, registerRemovePropertyTool } from '../../../src/tools/properties/remove-property.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('removePropertyHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI property:remove command with name', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('')

    await removePropertyHandler({ name: 'status', file: 'My Note', path: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('property:remove', { name: 'status', file: 'My Note', path: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('error'))

    const result = await removePropertyHandler({ name: 'p', file: undefined, path: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerRemovePropertyTool', () => {
  it('registers tool with name obsidian_remove_property', () => {
    const server = { registerTool: vi.fn() }
    registerRemovePropertyTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_remove_property', expect.objectContaining({ title: 'Remove Property' }), expect.any(Function))
  })
})
