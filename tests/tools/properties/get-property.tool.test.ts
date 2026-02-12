import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { getPropertyHandler, registerGetPropertyTool } from '../../../src/tools/properties/get-property.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('getPropertyHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI property:read command with name', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('done')

    await getPropertyHandler({ name: 'status', file: 'My Note', path: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('property:read', { name: 'status', file: 'My Note', path: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Property not found'))

    const result = await getPropertyHandler({ name: 'missing', file: undefined, path: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerGetPropertyTool', () => {
  it('registers tool with name obsidian_get_property', () => {
    const server = { registerTool: vi.fn() }
    registerGetPropertyTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_get_property', expect.objectContaining({ title: 'Get Property' }), expect.any(Function))
  })
})
