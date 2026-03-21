import { spawn, execFileSync } from 'node:child_process'
import os from 'node:os'
import {
  isGovernedMutationProfile,
  isGovernedProfile,
  type McpProfile,
} from '../runtime-config.js'
import { assertVaultPolicyPath, type VaultPolicy } from '../vault-policy.js'

type CliArgs = Record<string, string | boolean | undefined>

interface ObsidianCliServiceOptions {
  profile?: McpProfile
  allowPerCallVaultOverride?: boolean
  vaultPolicy?: VaultPolicy
}

export class ObsidianCliService {
  constructor(
    private readonly obsidianBin: string,
    private readonly defaultVault?: string,
    private readonly options: ObsidianCliServiceOptions = {},
  ) {}

  async run(command: string, args: CliArgs = {}): Promise<string> {
    const argv = this.buildArgv(command, args)
    return new Promise((resolve, reject) => {
      const child = spawn(this.obsidianBin, argv, { env: this.spawnEnv() })
      let stdout = ''

      // Capture stdout in real-time — Obsidian CLI may crash (Electron noise)
      // after writing its output, so we must not wait for a clean exit.
      child.stdout.on('data', (data: Buffer) => { stdout += data.toString() })
      child.on('close', () => resolve(stdout.trim()))
      child.on('error', reject)
    })
  }

  // Claude Desktop passes only the env vars defined in claude_desktop_config.json
  // to the MCP server process. Without HOME, TMPDIR and USER the Obsidian CLI
  // cannot locate its IPC socket to communicate with the running Obsidian app.
  // On macOS, os.tmpdir() returns /tmp when TMPDIR is unset, but Obsidian needs
  // the real per-user temp dir (/var/folders/…/T/) — obtained via getconf.
  private spawnEnv(): NodeJS.ProcessEnv {
    const userInfo = os.userInfo()
    return {
      ...process.env,
      HOME: process.env['HOME'] ?? userInfo.homedir,
      TMPDIR: process.env['TMPDIR'] ?? this.resolveTmpdir(),
      USER: process.env['USER'] ?? userInfo.username,
    }
  }

  private resolveTmpdir(): string {
    try {
      return execFileSync('getconf', ['DARWIN_USER_TEMP_DIR'], { encoding: 'utf8' }).trim()
    } catch {
      return os.tmpdir()
    }
  }

  private buildArgv(command: string, args: CliArgs): string[] {
    if (args['vault'] !== undefined && this.options.allowPerCallVaultOverride === false) {
      throw new Error('Per-call vault overrides are disabled for the active MCP profile')
    }

    this.enforceGovernedOperation(command, args)

    const vault =
      this.options.allowPerCallVaultOverride === false ? this.defaultVault : args['vault'] ?? this.defaultVault
    const argv: string[] = [command]

    if (vault) argv.push(`vault=${vault}`)

    for (const [key, value] of Object.entries(args)) {
      if (key === 'vault' || value === undefined) continue
      if (value === true) argv.push(key)
      else argv.push(`${key}=${String(value)}`)
    }

    return argv
  }

  private enforceGovernedOperation(command: string, args: CliArgs): void {
    const profile = this.options.profile
    const policy = this.options.vaultPolicy

    if (!profile || !isGovernedProfile(profile)) return
    if (!policy) {
      throw new Error(`MCP_PROFILE=${profile} requires a loaded vault policy before executing Obsidian CLI commands`)
    }

    const path = this.requireExactPath(command, args)

    switch (command) {
      case 'vault':
      case 'version':
        return
      case 'read':
      case 'properties':
      case 'property:read':
      case 'links':
      case 'backlinks':
      case 'outline':
      case 'wordcount':
      case 'file':
      case 'diff':
        assertVaultPolicyPath(policy, 'read', path)
        return
      case 'create':
        if (!isGovernedMutationProfile(profile)) {
          throw new Error(`MCP_PROFILE=${profile} does not permit note mutation commands`)
        }
        this.rejectArgs(command, args, ['name', 'template'])
        if (args['overwrite'] === true) {
          throw new Error('Governed mutation policy blocks overwrite=true; create_note must target a new exact path')
        }
        assertVaultPolicyPath(policy, 'write', path)
        return
      case 'append':
      case 'prepend':
      case 'property:set':
      case 'property:remove':
        if (!isGovernedMutationProfile(profile)) {
          throw new Error(`MCP_PROFILE=${profile} does not permit note mutation commands`)
        }
        assertVaultPolicyPath(policy, 'write', path)
        return
      default:
        throw new Error(`Governed profile ${profile} blocks the Obsidian CLI command: ${command}`)
    }
  }

  private requireExactPath(command: string, args: CliArgs): string {
    const profile = this.options.profile
    if (!profile || !isGovernedProfile(profile)) {
      return this.extractPathArg(args) ?? '.'
    }

    const allowNoPathCommand = command === 'vault' || command === 'version'
    const fuzzySelectors = ['file', 'name']

    for (const selector of fuzzySelectors) {
      if (args[selector] !== undefined) {
        throw new Error(
          `Governed profile ${profile} requires exact path-based targeting; ${selector} selectors are disabled for ${command}`,
        )
      }
    }

    const path = this.extractPathArg(args)
    if (!path && allowNoPathCommand) {
      return '.'
    }

    if (!path) {
      throw new Error(`Governed profile ${profile} requires an exact path for the Obsidian CLI command: ${command}`)
    }

    return path
  }

  private extractPathArg(args: CliArgs): string | undefined {
    const pathValue = args['path']
    if (typeof pathValue !== 'string') return undefined

    const normalizedPath = pathValue.trim()
    return normalizedPath ? normalizedPath : undefined
  }

  private rejectArgs(command: string, args: CliArgs, argNames: readonly string[]): void {
    for (const argName of argNames) {
      if (args[argName] !== undefined) {
        throw new Error(`Governed policy blocks ${argName} on the Obsidian CLI command: ${command}`)
      }
    }
  }
}
