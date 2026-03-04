import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ObsidianCliService } from '../../../src/services/obsidian-cli.service.js'
import { workspaceHandler, registerWorkspaceTool } from '../../../src/tools/workspace/workspace.tool.js'

const makeCli = () => ({ run: vi.fn() }) as unknown as ObsidianCliService

describe('workspaceHandler', () => {
  let cli: ObsidianCliService

  beforeEach(() => { cli = makeCli() })

  it('calls CLI workspace command', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('workspace layout')

    await workspaceHandler({ ids: undefined, vault: undefined }, cli)

    expect(cli.run).toHaveBeenCalledWith('workspace', { ids: undefined, vault: undefined })
  })

  it('passes params when provided', async () => {
    vi.mocked(cli.run).mockResolvedValueOnce('...')

    await workspaceHandler({ ids: true, vault: 'MyVault' }, cli)

    expect(cli.run).toHaveBeenCalledWith('workspace', expect.objectContaining({ ids: true, vault: 'MyVault' }))
  })

  it('returns isError:true when CLI throws', async () => {
    vi.mocked(cli.run).mockRejectedValueOnce(new Error('Vault error'))

    const result = await workspaceHandler({ ids: undefined, vault: undefined }, cli)

    expect(result.isError).toBe(true)
  })
})

describe('registerWorkspaceTool', () => {
  it('registers tool with name obsidian_workspace', () => {
    const server = { registerTool: vi.fn() }
    registerWorkspaceTool(server as never, makeCli())
    expect(server.registerTool).toHaveBeenCalledWith('obsidian_workspace', expect.objectContaining({ title: 'Get Workspace' }), expect.any(Function))
  })
})
