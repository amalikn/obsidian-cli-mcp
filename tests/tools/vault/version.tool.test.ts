import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { versionHandler, registerVersionTool } from '../../../src/tools/vault/version.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('versionHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI version command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('Obsidian 1.5.0')

    await versionHandler({}, cli)

    expect(cli.run).toHaveBeenCalledWith('version', {})
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('CLI error'))

    const result = await versionHandler({}, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerVersionTool', () => {
  it('registers tool with name obsidian_version', () => {
    const server = { registerTool: vi.fn() }
    registerVersionTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_version', expect.objectContaining({ title: 'Get Version' }), expect.any(Function))
  })
})
