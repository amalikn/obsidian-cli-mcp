import { spawn, execFileSync } from 'node:child_process'
import os from 'node:os'

type CliArgs = Record<string, string | boolean | undefined>

export class ObsidianCliService {
  constructor(
    private readonly obsidianBin: string,
    private readonly defaultVault?: string,
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
    const vault = args['vault'] ?? this.defaultVault
    const argv: string[] = [command]

    if (vault) argv.push(`vault=${vault}`)

    for (const [key, value] of Object.entries(args)) {
      if (key === 'vault' || value === undefined) continue
      if (value === true) argv.push(key)
      else argv.push(`${key}=${String(value)}`)
    }

    return argv
  }
}
