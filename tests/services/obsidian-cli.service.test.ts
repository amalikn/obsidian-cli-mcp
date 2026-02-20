import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Mock } from 'vitest'

const mockExecFile: Mock = vi.fn()

vi.mock('node:child_process', () => ({
  execFile: mockExecFile,
}))

vi.mock('node:util', () => ({
  promisify: (fn: unknown) => fn,
}))

const { ObsidianCliService } = await import('../../src/services/obsidian-cli.service.js')

const BIN = '/Applications/Obsidian.app/Contents/MacOS/Obsidian'

describe('ObsidianCliService', () => {
  let service: InstanceType<typeof ObsidianCliService>

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ObsidianCliService(BIN)
  })

  describe('run()', () => {
    it('calls execFile with the binary and command as first argument', async () => {
      mockExecFile.mockResolvedValueOnce({ stdout: 'output', stderr: '' })

      await service.run('read')

      expect(mockExecFile).toHaveBeenCalledWith(BIN, ['read'])
    })

    it('appends string args as key=value tokens', async () => {
      mockExecFile.mockResolvedValueOnce({ stdout: 'output', stderr: '' })

      await service.run('read', { file: 'My Note' })

      expect(mockExecFile).toHaveBeenCalledWith(BIN, ['read', 'file=My Note'])
    })

    it('appends boolean true args as flag tokens (no value)', async () => {
      mockExecFile.mockResolvedValueOnce({ stdout: 'output', stderr: '' })

      await service.run('files', { total: true })

      expect(mockExecFile).toHaveBeenCalledWith(BIN, ['files', 'total'])
    })

    it('skips undefined args', async () => {
      mockExecFile.mockResolvedValueOnce({ stdout: 'output', stderr: '' })

      await service.run('read', { file: undefined, path: 'notes/foo.md' })

      expect(mockExecFile).toHaveBeenCalledWith(BIN, ['read', 'path=notes/foo.md'])
    })

    it('prepends vault arg when defaultVault is set', async () => {
      mockExecFile.mockResolvedValueOnce({ stdout: 'output', stderr: '' })
      const serviceWithVault = new ObsidianCliService(BIN, 'MyVault')

      await serviceWithVault.run('read', { file: 'note' })

      expect(mockExecFile).toHaveBeenCalledWith(BIN, ['read', 'vault=MyVault', 'file=note'])
    })

    it('overrides defaultVault when vault arg is provided', async () => {
      mockExecFile.mockResolvedValueOnce({ stdout: 'output', stderr: '' })
      const serviceWithVault = new ObsidianCliService(BIN, 'DefaultVault')

      await serviceWithVault.run('read', { vault: 'OtherVault', file: 'note' })

      expect(mockExecFile).toHaveBeenCalledWith(BIN, ['read', 'vault=OtherVault', 'file=note'])
    })

    it('returns trimmed stdout on success', async () => {
      mockExecFile.mockResolvedValueOnce({ stdout: '  # My Note\n\nContent\n', stderr: '' })

      const result = await service.run('read', { file: 'My Note' })

      expect(result).toBe('# My Note\n\nContent')
    })

    it('throws when execFile rejects', async () => {
      mockExecFile.mockRejectedValueOnce(new Error('Command failed'))

      await expect(service.run('read', { file: 'Missing Note' })).rejects.toThrow('Command failed')
    })
  })
})
