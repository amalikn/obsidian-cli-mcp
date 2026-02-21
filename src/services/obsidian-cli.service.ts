import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

type CliArgs = Record<string, string | boolean | undefined>

export class ObsidianCliService {
  constructor(
    private readonly obsidianBin: string,
    private readonly defaultVault?: string,
  ) {}

  async run(command: string, args: CliArgs = {}): Promise<string> {
    const argv = this.buildArgv(command, args)
    try {
      const { stdout } = await execFileAsync(this.obsidianBin, argv, { maxBuffer: 10 * 1024 * 1024 })
      return stdout.trim()
    } catch (error) {
      // Obsidian CLI often exits non-zero due to Electron stderr noise while
      // still writing valid output to stdout. If stdout has content, use it.
      const execError = error as NodeJS.ErrnoException & { stdout?: string }
      if (execError.stdout?.trim()) {
        return execError.stdout.trim()
      }
      throw error
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
