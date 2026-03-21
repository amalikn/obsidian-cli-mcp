import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_HTTP_HOST,
  DEFAULT_HTTP_PORT,
  DEFAULT_MCP_PROFILE,
  DEFAULT_MCP_TRANSPORT,
  resolveRuntimeConfig,
} from '../src/runtime-config.js'

const tempPaths: string[] = []

afterEach(() => {
  for (const tempPath of tempPaths.splice(0)) {
    fs.rmSync(tempPath, { recursive: true, force: true })
  }
})

describe('resolveRuntimeConfig()', () => {
  it('defaults to governed-readonly and stdio with a pinned vault root and policy file', () => {
    const fixture = createGovernedFixture()

    const config = resolveRuntimeConfig({
      OBSIDIAN_VAULT: 'GovernedVault',
      OBSIDIAN_VAULT_ROOT: fixture.vaultRoot,
      OBSIDIAN_POLICY_FILE: fixture.policyFile,
    })

    expect(config.profile).toBe(DEFAULT_MCP_PROFILE)
    expect(config.transport).toBe(DEFAULT_MCP_TRANSPORT)
    expect(config.port).toBe(DEFAULT_HTTP_PORT)
    expect(config.httpHost).toBe(DEFAULT_HTTP_HOST)
    expect(config.defaultVault).toBe('GovernedVault')
    expect(config.defaultVaultRoot).toBe(fixture.vaultRoot)
    expect(config.vaultPolicy?.policyFilePath).toBe(fixture.policyFile)
  })

  it('requires OBSIDIAN_POLICY_FILE in governed-readonly mode', () => {
    const fixture = createGovernedFixture()

    expect(() =>
      resolveRuntimeConfig({
        OBSIDIAN_VAULT: 'GovernedVault',
        OBSIDIAN_VAULT_ROOT: fixture.vaultRoot,
      }),
    ).toThrow('MCP_PROFILE=governed-readonly requires OBSIDIAN_POLICY_FILE')
  })

  it('supports the governed-mutation profile', () => {
    const fixture = createGovernedFixture()

    const config = resolveRuntimeConfig({
      MCP_PROFILE: 'governed-mutation',
      OBSIDIAN_VAULT: 'GovernedVault',
      OBSIDIAN_VAULT_ROOT: fixture.vaultRoot,
      OBSIDIAN_POLICY_FILE: fixture.policyFile,
    })

    expect(config.profile).toBe('governed-mutation')
    expect(config.vaultPolicy?.writeAllowlist).toContain('inbox')
  })

  it('allows personal-unrestricted without governed vault inputs', () => {
    const config = resolveRuntimeConfig({ MCP_PROFILE: 'personal-unrestricted' })

    expect(config.profile).toBe('personal-unrestricted')
    expect(config.defaultVault).toBeUndefined()
    expect(config.vaultPolicy).toBeUndefined()
  })

  it('rejects governed HTTP without an auth token', () => {
    const fixture = createGovernedFixture()

    expect(() =>
      resolveRuntimeConfig({
        MCP_TRANSPORT: 'http',
        OBSIDIAN_VAULT: 'GovernedVault',
        OBSIDIAN_VAULT_ROOT: fixture.vaultRoot,
        OBSIDIAN_POLICY_FILE: fixture.policyFile,
      }),
    ).toThrow('requires MCP_HTTP_AUTH_TOKEN')
  })

  it('defaults HTTP to loopback when enabled', () => {
    const fixture = createGovernedFixture()

    const config = resolveRuntimeConfig({
      MCP_TRANSPORT: 'http',
      MCP_HTTP_AUTH_TOKEN: 'super-secret-token',
      OBSIDIAN_VAULT: 'GovernedVault',
      OBSIDIAN_VAULT_ROOT: fixture.vaultRoot,
      OBSIDIAN_POLICY_FILE: fixture.policyFile,
    })

    expect(config.transport).toBe('http')
    expect(config.httpHost).toBe(DEFAULT_HTTP_HOST)
    expect(config.httpAuthToken).toBe('super-secret-token')
  })

  it('rejects remote HTTP binding without explicit opt-in', () => {
    const fixture = createGovernedFixture()

    expect(() =>
      resolveRuntimeConfig({
        MCP_TRANSPORT: 'http',
        MCP_HTTP_HOST: '0.0.0.0',
        MCP_HTTP_AUTH_TOKEN: 'super-secret-token',
        OBSIDIAN_VAULT: 'GovernedVault',
        OBSIDIAN_VAULT_ROOT: fixture.vaultRoot,
        OBSIDIAN_POLICY_FILE: fixture.policyFile,
      }),
    ).toThrow('Remote HTTP binding requires MCP_HTTP_ALLOW_REMOTE_BIND=true')
  })

  it('accepts remote HTTP binding only when explicitly opted in and authenticated', () => {
    const fixture = createGovernedFixture()

    const config = resolveRuntimeConfig({
      MCP_TRANSPORT: 'http',
      MCP_HTTP_HOST: '0.0.0.0',
      MCP_HTTP_ALLOW_REMOTE_BIND: 'true',
      MCP_HTTP_AUTH_TOKEN: 'super-secret-token',
      OBSIDIAN_VAULT: 'GovernedVault',
      OBSIDIAN_VAULT_ROOT: fixture.vaultRoot,
      OBSIDIAN_POLICY_FILE: fixture.policyFile,
    })

    expect(config.httpHost).toBe('0.0.0.0')
  })

  it('rejects unsupported profiles', () => {
    const fixture = createGovernedFixture()

    expect(() =>
      resolveRuntimeConfig({
        MCP_PROFILE: 'wide-open',
        OBSIDIAN_VAULT: 'GovernedVault',
        OBSIDIAN_VAULT_ROOT: fixture.vaultRoot,
        OBSIDIAN_POLICY_FILE: fixture.policyFile,
      }),
    ).toThrow('Unsupported MCP_PROFILE: wide-open')
  })
})

function createGovernedFixture(): { vaultRoot: string; policyFile: string } {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'obsidian-cli-mcp-runtime-'))
  tempPaths.push(tempRoot)

  const vaultRoot = path.join(tempRoot, 'GovernedVaultRoot')
  fs.mkdirSync(path.join(vaultRoot, 'inbox'), { recursive: true })
  fs.mkdirSync(path.join(vaultRoot, 'notes'), { recursive: true })

  const policyFile = path.join(tempRoot, 'vault-policy.json')
  fs.writeFileSync(
    policyFile,
    JSON.stringify(
      {
        version: 1,
        readAllowlist: ['notes', 'inbox'],
        writeAllowlist: ['inbox'],
        denylist: ['notes/private'],
      },
      null,
      2,
    ),
  )

  return { vaultRoot, policyFile }
}
