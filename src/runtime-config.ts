import { loadVaultPolicy, type VaultPolicy } from './vault-policy.js'

export const SUPPORTED_MCP_PROFILES = [
  'governed-readonly',
  'governed-mutation',
  'personal-unrestricted',
] as const

export type McpProfile = (typeof SUPPORTED_MCP_PROFILES)[number]

export const DEFAULT_MCP_PROFILE: McpProfile = 'governed-readonly'

export const SUPPORTED_TRANSPORTS = ['stdio', 'http'] as const

export type McpTransport = (typeof SUPPORTED_TRANSPORTS)[number]

export const DEFAULT_MCP_TRANSPORT: McpTransport = 'stdio'
export const DEFAULT_HTTP_PORT = 3000
export const DEFAULT_HTTP_HOST = '127.0.0.1'

const PROFILE_ALIASES: Record<string, McpProfile> = {
  'governed-readonly': 'governed-readonly',
  governed_read_only: 'governed-readonly',
  'governed-mutation': 'governed-mutation',
  governed_mutation: 'governed-mutation',
  'personal-unrestricted': 'personal-unrestricted',
  personal_unrestricted: 'personal-unrestricted',
}

const TRANSPORT_ALIASES: Record<string, McpTransport> = {
  stdio: 'stdio',
  http: 'http',
}

export interface RuntimeConfig {
  profile: McpProfile
  transport: McpTransport
  port: number
  httpHost: string
  httpAuthToken?: string
  obsidianBin: string
  defaultVault?: string
  defaultVaultRoot?: string
  vaultPolicy?: VaultPolicy
}

export interface ProfileDefinition {
  readonly intendedUse: string
  readonly transportExpectation: string
  readonly vaultPolicyExpectation: string
}

export const PROFILE_DEFINITIONS: Record<McpProfile, ProfileDefinition> = {
  'governed-readonly': {
    intendedUse: 'Governed read access plus bounded search and filtered graph discovery inside one pinned vault.',
    transportExpectation: 'stdio by default; HTTP only with explicit auth and bind safeguards.',
    vaultPolicyExpectation: 'Requires OBSIDIAN_VAULT, OBSIDIAN_VAULT_ROOT, and OBSIDIAN_POLICY_FILE.',
  },
  'governed-mutation': {
    intendedUse:
      'Governed exact-path note/property mutation plus template-aware review and promotion workflows inside one pinned vault.',
    transportExpectation: 'stdio by default; HTTP only with explicit auth and bind safeguards.',
    vaultPolicyExpectation: 'Requires OBSIDIAN_VAULT, OBSIDIAN_VAULT_ROOT, and OBSIDIAN_POLICY_FILE.',
  },
  'personal-unrestricted': {
    intendedUse: 'Compatibility profile for the broad legacy surface.',
    transportExpectation: 'stdio preferred; HTTP remains opt-in.',
    vaultPolicyExpectation: 'No governed policy requirements are enforced.',
  },
}

export function resolveRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  const profile = resolveProfile(env['MCP_PROFILE'])
  const transport = resolveTransport(env['MCP_TRANSPORT'])
  const port = resolvePort(env['MCP_PORT'])
  const httpHost = env['MCP_HTTP_HOST'] || DEFAULT_HTTP_HOST
  const httpAuthToken = normalizeOptionalValue(env['MCP_HTTP_AUTH_TOKEN'])
  const allowRemoteBind = resolveBooleanFlag(env['MCP_HTTP_ALLOW_REMOTE_BIND'])
  const obsidianBin = env['OBSIDIAN_BIN'] ?? 'obsidian'
  const defaultVault = normalizeOptionalValue(env['OBSIDIAN_VAULT'])
  const defaultVaultRoot = normalizeOptionalValue(env['OBSIDIAN_VAULT_ROOT'])
  const vaultPolicyFile = normalizeOptionalValue(env['OBSIDIAN_POLICY_FILE'])
  let vaultPolicy: VaultPolicy | undefined

  if (isGovernedProfile(profile)) {
    if (!defaultVault) {
      throw new Error(`MCP_PROFILE=${profile} requires OBSIDIAN_VAULT to pin the governed vault`)
    }

    if (!defaultVaultRoot) {
      throw new Error(`MCP_PROFILE=${profile} requires OBSIDIAN_VAULT_ROOT for canonical vault policy checks`)
    }

    if (!vaultPolicyFile) {
      throw new Error(`MCP_PROFILE=${profile} requires OBSIDIAN_POLICY_FILE for governed vault policy enforcement`)
    }

    vaultPolicy = loadVaultPolicy(vaultPolicyFile, defaultVaultRoot)
  }

  if (transport === 'http') {
    if (!isLoopbackHost(httpHost) && !allowRemoteBind) {
      throw new Error(`Remote HTTP binding requires MCP_HTTP_ALLOW_REMOTE_BIND=true for host ${httpHost}`)
    }

    if ((isGovernedProfile(profile) || !isLoopbackHost(httpHost)) && !httpAuthToken) {
      throw new Error(
        `MCP_TRANSPORT=http with profile ${profile} and host ${httpHost} requires MCP_HTTP_AUTH_TOKEN`,
      )
    }
  }

  return {
    profile,
    transport,
    port,
    httpHost,
    httpAuthToken,
    obsidianBin,
    defaultVault,
    defaultVaultRoot,
    vaultPolicy,
  }
}

export function isGovernedReadonlyProfile(profile: McpProfile): boolean {
  return profile === 'governed-readonly'
}

export function isGovernedMutationProfile(profile: McpProfile): boolean {
  return profile === 'governed-mutation'
}

export function isGovernedProfile(profile: McpProfile): boolean {
  return isGovernedReadonlyProfile(profile) || isGovernedMutationProfile(profile)
}

export function isLoopbackHost(host: string): boolean {
  return host === '127.0.0.1' || host === 'localhost' || host === '::1'
}

function resolveProfile(rawProfile?: string): McpProfile {
  if (!rawProfile) return DEFAULT_MCP_PROFILE

  const normalizedProfile = PROFILE_ALIASES[rawProfile]
  if (!normalizedProfile) {
    throw new Error(
      `Unsupported MCP_PROFILE: ${rawProfile}. Expected one of: ${SUPPORTED_MCP_PROFILES.join(', ')}`,
    )
  }

  return normalizedProfile
}

function resolveTransport(rawTransport?: string): McpTransport {
  if (!rawTransport) return DEFAULT_MCP_TRANSPORT

  const normalizedTransport = TRANSPORT_ALIASES[rawTransport]
  if (!normalizedTransport) {
    throw new Error(
      `Unsupported MCP_TRANSPORT: ${rawTransport}. Expected one of: ${SUPPORTED_TRANSPORTS.join(', ')}`,
    )
  }

  return normalizedTransport
}

function resolvePort(rawPort?: string): number {
  if (!rawPort) return DEFAULT_HTTP_PORT

  const port = Number.parseInt(rawPort, 10)
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`Invalid MCP_PORT: ${rawPort}`)
  }

  return port
}

function normalizeOptionalValue(value?: string): string | undefined {
  if (!value) return undefined

  const normalizedValue = value.trim()
  return normalizedValue ? normalizedValue : undefined
}

function resolveBooleanFlag(value?: string): boolean {
  if (!value) return false

  const normalizedValue = value.trim().toLowerCase()
  return normalizedValue === '1' || normalizedValue === 'true' || normalizedValue === 'yes'
}
