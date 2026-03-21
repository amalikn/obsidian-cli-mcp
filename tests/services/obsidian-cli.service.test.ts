import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'

const mockSpawn: Mock = vi.fn()
const mockExecFileSync: Mock = vi.fn(() => `${os.tmpdir()}/`)

vi.mock('node:child_process', () => ({
  execFileSync: mockExecFileSync,
  spawn: mockSpawn,
}))

const { ObsidianCliService } = await import('../../src/services/obsidian-cli.service.js')
const { loadVaultPolicy } = await import('../../src/vault-policy.js')

const BIN = '/Applications/Obsidian.app/Contents/MacOS/Obsidian'
const tempPaths: string[] = []

afterEach(() => {
  for (const tempPath of tempPaths.splice(0)) {
    fs.rmSync(tempPath, { recursive: true, force: true })
  }
})

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
    mockExecFileSync.mockReturnValue(`${os.tmpdir()}/`)
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

    it('uses the configured defaultVault when per-call overrides are disabled', async () => {
      mockChild()
      const governedService = new ObsidianCliService(BIN, 'GovernedVault', {
        allowPerCallVaultOverride: false,
      })

      await governedService.run('read', { file: 'note' })

      expect(mockSpawn).toHaveBeenCalledWith(
        BIN,
        ['read', 'vault=GovernedVault', 'file=note'],
        expect.any(Object),
      )
    })

    it('rejects per-call vault overrides when the profile disables them', async () => {
      const governedService = new ObsidianCliService(BIN, 'GovernedVault', {
        allowPerCallVaultOverride: false,
      })

      await expect(governedService.run('read', { vault: 'OtherVault', file: 'note' })).rejects.toThrow(
        'Per-call vault overrides are disabled',
      )

      expect(mockSpawn).not.toHaveBeenCalled()
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

    it('blocks fuzzy note selectors in governed profiles', async () => {
      const governedService = createGovernedService()

      await expect(governedService.run('read', { file: 'Inbox' })).rejects.toThrow(
        'requires exact path-based targeting',
      )
      expect(mockSpawn).not.toHaveBeenCalled()
    })

    it('allows exact-path governed reads inside the read allowlist', async () => {
      mockChild('# Inbox\n')
      const governedService = createGovernedService()

      await governedService.run('read', { path: 'notes/inbox.md' })

      expect(mockSpawn).toHaveBeenCalledWith(
        BIN,
        ['read', 'vault=GovernedVault', 'path=notes/inbox.md'],
        expect.any(Object),
      )
    })

    it('blocks governed writes outside the write allowlist', async () => {
      const governedService = createGovernedService({ profile: 'governed-mutation' })

      await expect(governedService.run('append', { path: 'notes/inbox.md', content: 'extra' })).rejects.toThrow(
        'outside the allowlist',
      )
      expect(mockSpawn).not.toHaveBeenCalled()
    })

    it('allows governed writes inside the write allowlist', async () => {
      mockChild('Content appended.\n')
      const governedService = createGovernedService({ profile: 'governed-mutation' })

      await governedService.run('append', { path: 'inbox/daily.md', content: 'extra' })

      expect(mockSpawn).toHaveBeenCalledWith(
        BIN,
        ['append', 'vault=GovernedVault', 'path=inbox/daily.md', 'content=extra'],
        expect.any(Object),
      )
    })

    it('blocks governed writes into .obsidian paths even when the write allowlist is broad', async () => {
      const governedService = createGovernedService(
        { profile: 'governed-mutation' },
        {
          readAllowlist: ['.'],
          writeAllowlist: ['.'],
          denylist: [],
        },
      )

      await expect(
        governedService.run('create', { path: '.obsidian/plugins/example/data.json', content: '{}' }),
      ).rejects.toThrow('hidden path')
      expect(mockSpawn).not.toHaveBeenCalled()
    })

    it('blocks normalized traversal attempts before spawning the CLI', async () => {
      const governedService = createGovernedService()

      await expect(governedService.run('read', { path: '../outside.md' })).rejects.toThrow(
        'must stay relative to the pinned vault',
      )
      expect(mockSpawn).not.toHaveBeenCalled()
    })

    it('blocks symlink traversal when denySymlinks is enabled', async () => {
      const fixture = createGovernedFixture({
        readAllowlist: ['notes'],
        writeAllowlist: ['inbox'],
        denylist: [],
      })
      fs.symlinkSync(path.join(fixture.vaultRoot, '..', 'outside'), path.join(fixture.vaultRoot, 'notes', 'linked'))

      const governedService = new ObsidianCliService(BIN, 'GovernedVault', {
        allowPerCallVaultOverride: false,
        profile: 'governed-readonly',
        vaultPolicy: loadVaultPolicy(fixture.policyFile, fixture.vaultRoot),
      })

      await expect(governedService.run('read', { path: 'notes/linked/secret.md' })).rejects.toThrow(
        'symlinked path',
      )
      expect(mockSpawn).not.toHaveBeenCalled()
    })
  })
})

function createGovernedService(
  options: { profile?: 'governed-readonly' | 'governed-mutation' } = {},
  policyOverrides: Partial<{
    readAllowlist: string[]
    writeAllowlist: string[]
    denylist: string[]
  }> = {},
) {
  const fixture = createGovernedFixture(policyOverrides)

  return new ObsidianCliService(BIN, 'GovernedVault', {
    allowPerCallVaultOverride: false,
    profile: options.profile ?? 'governed-readonly',
    vaultPolicy: loadVaultPolicy(fixture.policyFile, fixture.vaultRoot),
  })
}

function createGovernedFixture(
  overrides: Partial<{
    readAllowlist: string[]
    writeAllowlist: string[]
    denylist: string[]
  }> = {},
): { vaultRoot: string; policyFile: string } {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'obsidian-cli-mcp-service-'))
  tempPaths.push(tempRoot)

  const vaultRoot = path.join(tempRoot, 'vault')
  fs.mkdirSync(path.join(vaultRoot, 'notes'), { recursive: true })
  fs.mkdirSync(path.join(vaultRoot, 'inbox'), { recursive: true })
  fs.mkdirSync(path.join(tempRoot, 'outside'), { recursive: true })
  fs.writeFileSync(path.join(vaultRoot, 'notes', 'inbox.md'), '# Inbox\n')
  fs.writeFileSync(path.join(vaultRoot, 'inbox', 'daily.md'), '# Daily\n')

  const policyFile = path.join(tempRoot, 'vault-policy.json')
  fs.writeFileSync(
    policyFile,
    JSON.stringify(
      {
        version: 1,
        readAllowlist: overrides.readAllowlist ?? ['notes', 'inbox'],
        writeAllowlist: overrides.writeAllowlist ?? ['inbox'],
        denylist: overrides.denylist ?? ['notes/private'],
      },
      null,
      2,
    ),
  )

  return { vaultRoot, policyFile }
}
