import { spawn } from 'node:child_process'

type CliArgs = Record<string, string | boolean | undefined>

export class ObsidianCliService {
  constructor(
    private readonly obsidianBin: string,
    private readonly defaultVault?: string,
  ) {}

  async run(command: string, args: CliArgs = {}): Promise<string> {
    const argv = this.buildArgv(command, args)
    return new Promise((resolve, reject) => {
      const child = spawn(this.obsidianBin, argv)
      let stdout = ''

      // Capture stdout in real-time — Obsidian CLI may crash (Electron noise)
      // after writing its output, so we must not wait for a clean exit.
      child.stdout.on('data', (data: Buffer) => { stdout += data.toString() })
      child.on('close', () => resolve(stdout.trim()))
      child.on('error', reject)
    })
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
