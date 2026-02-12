import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { listPropertiesHandler, registerListPropertiesTool } from '../../../src/tools/properties/list-properties.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('listPropertiesHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI properties command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('tags:\nstatus:')

    await listPropertiesHandler({ file: undefined, path: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('properties', { file: undefined, path: undefined, vault: undefined })
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('error'))

    const result = await listPropertiesHandler({ file: undefined, path: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerListPropertiesTool', () => {
  it('registers tool with name obsidian_list_properties', () => {
    const server = { registerTool: vi.fn() }
    registerListPropertiesTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_list_properties', expect.objectContaining({ title: 'List Properties' }), expect.any(Function))
  })
})
