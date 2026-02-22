import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import { EventEmitter } from 'node:events'

const mockSpawn: Mock = vi.fn()

vi.mock('node:child_process', () => ({
  spawn: mockSpawn,
}))

const { ObsidianCliService } = await import('../../src/services/obsidian-cli.service.js')

const BIN = '/Applications/Obsidian.app/Contents/MacOS/Obsidian'

function mockChild(stdout = '', exitCode = 0) {
  const childEmitter = new EventEmitter()
  const stdoutEmitter = new EventEmitter()
  const child = { stdout: stdoutEmitter, on: childEmitter.on.bind(childEmitter) }

  process.nextTick(() => {
    if (stdout) stdoutEmitter.emit('data', Buffer.from(stdout))
    childEmitter.emit('close', exitCode)
  })

  mockSpawn.mockReturnValueOnce(child)
  return child
}

function mockChildError(error: Error) {
  const childEmitter = new EventEmitter()
  const stdoutEmitter = new EventEmitter()
  const child = { stdout: stdoutEmitter, on: childEmitter.on.bind(childEmitter) }

  process.nextTick(() => childEmitter.emit('error', error))

  mockSpawn.mockReturnValueOnce(child)
  return child
}

describe('ObsidianCliService', () => {
  let service: InstanceType<typeof ObsidianCliService>

  beforeEach(() => {
    vi.clearAllMocks()
    service = new ObsidianCliService(BIN)
  })

  describe('run()', () => {
    it('calls spawn with the binary and command as first argument', async () => {
      mockChild()

      await service.run('read')

      expect(mockSpawn).toHaveBeenCalledWith(BIN, ['read'], expect.any(Object))
    })

    it('appends string args as key=value tokens', async () => {
      mockChild()

      await service.run('read', { file: 'My Note' })

      expect(mockSpawn).toHaveBeenCalledWith(BIN, ['read', 'file=My Note'], expect.any(Object))
    })

    it('appends boolean true args as flag tokens (no value)', async () => {
      mockChild()

      await service.run('files', { total: true })

      expect(mockSpawn).toHaveBeenCalledWith(BIN, ['files', 'total'], expect.any(Object))
    })

    it('skips undefined args', async () => {
      mockChild()

      await service.run('read', { file: undefined, path: 'notes/foo.md' })

      expect(mockSpawn).toHaveBeenCalledWith(BIN, ['read', 'path=notes/foo.md'], expect.any(Object))
    })

    it('prepends vault arg when defaultVault is set', async () => {
      mockChild()
      const serviceWithVault = new ObsidianCliService(BIN, 'MyVault')

      await serviceWithVault.run('read', { file: 'note' })

      expect(mockSpawn).toHaveBeenCalledWith(BIN, ['read', 'vault=MyVault', 'file=note'], expect.any(Object))
    })

    it('overrides defaultVault when vault arg is provided', async () => {
      mockChild()
      const serviceWithVault = new ObsidianCliService(BIN, 'DefaultVault')

      await serviceWithVault.run('read', { vault: 'OtherVault', file: 'note' })

      expect(mockSpawn).toHaveBeenCalledWith(BIN, ['read', 'vault=OtherVault', 'file=note'], expect.any(Object))
    })

    it('injects HOME, TMPDIR and USER into spawn env for Obsidian IPC to work', async () => {
      mockChild()

      await service.run('vault')

      const [, , spawnOptions] = mockSpawn.mock.calls[0]
      expect(spawnOptions.env).toMatchObject({
        HOME: expect.any(String),
        TMPDIR: expect.any(String),
        USER: expect.any(String),
      })
    })

    it('returns stdout even when process exits non-zero (Electron stderr noise)', async () => {
      mockChild('vault info\n', 1)

      const result = await service.run('vault')

      expect(result).toBe('vault info')
    })

    it('returns trimmed stdout on success', async () => {
      mockChild('  # My Note\n\nContent\n')

      const result = await service.run('read', { file: 'My Note' })

      expect(result).toBe('# My Note\n\nContent')
    })

    it('throws when spawn emits an error event', async () => {
      mockChildError(new Error('spawn ENOENT'))

      await expect(service.run('read', { file: 'Missing Note' })).rejects.toThrow('spawn ENOENT')
    })
  })
})
