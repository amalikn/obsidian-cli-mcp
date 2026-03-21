import fs from 'node:fs'
import path from 'node:path'
import {
  assertTemplateTypeDestinationPath,
  assertVaultPolicyDiscoveryPath,
  assertVaultPolicyPath,
  assertVaultPolicyTemplatePath,
  assertWorkflowDestinationPath,
  assertWorkflowSourcePath,
  getCuratedWorkflowRoute,
  getPromotionLogWorkflowRoute,
  getTemplateTypePolicy,
  getVaultPolicyDiscoveryRoots,
  getWorkflowRoute,
  isVaultPolicyPathAllowed,
  listTemplateTypes,
  normalizeVaultRelativePath,
  type VaultPolicy,
} from '../vault-policy.js'

interface SearchOptions {
  path?: string
  limit?: number
  contextLines?: number
}

export interface GovernedSearchMatch {
  readonly path: string
  readonly line: number
  readonly excerpt: string
  readonly context?: string
}

export interface GovernedTemplateSummary {
  readonly templateType: string
  readonly templatePath: string
  readonly destinationRoots: readonly string[]
  readonly requiredProvenance: boolean
}

interface CreateFromTemplateOptions {
  templateType: string
  destinationPath: string
  variables?: Record<string, string>
  provenance?: Record<string, string>
  bodyAppendix?: string
}

interface CreateWorkflowNoteResult {
  readonly destinationPath: string
  readonly templateType: string
}

export interface PromotionLogOptions {
  readonly sourcePath: string
  readonly curatedPath: string
  readonly destinationPath?: string
  readonly notes?: string
}

interface NoteIndex {
  readonly notePaths: readonly string[]
  readonly stemMap: ReadonlyMap<string, readonly string[]>
}

export class GovernedVaultService {
  private noteIndex?: NoteIndex

  constructor(private readonly vaultPolicy: VaultPolicy) {}

  search(query: string, options: SearchOptions = {}): GovernedSearchMatch[] {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      throw new Error('Governed search requires a non-empty query')
    }

    const contextLines = clampInteger(options.contextLines ?? 0, 0, 5)
    const limit = clampInteger(options.limit ?? 20, 1, 100)
    const candidatePaths = options.path
      ? [assertVaultPolicyDiscoveryPath(this.vaultPolicy, options.path)]
      : getVaultPolicyDiscoveryRoots(this.vaultPolicy)
    const files = this.listMarkdownFiles(candidatePaths)
    const matches: GovernedSearchMatch[] = []
    const queryNeedle = normalizedQuery.toLocaleLowerCase()

    for (const relativePath of files) {
      const lines = this.readVaultFile(relativePath).split(/\r?\n/)

      for (let index = 0; index < lines.length; index += 1) {
        if (!lines[index].toLocaleLowerCase().includes(queryNeedle)) continue

        const context = contextLines
          ? lines
              .slice(Math.max(0, index - contextLines), Math.min(lines.length, index + contextLines + 1))
              .join('\n')
          : undefined

        matches.push({
          path: relativePath,
          line: index + 1,
          excerpt: lines[index],
          context,
        })

        if (matches.length >= limit) {
          return matches
        }
      }
    }

    return matches
  }

  listLinks(notePath: string): string[] {
    const sourcePath = this.assertDiscoverableReadPath(notePath)
    const sourceDirectory = path.posix.dirname(sourcePath)
    const noteIndex = this.getNoteIndex()
    const allowedTargets = new Set<string>()

    for (const reference of extractNoteReferences(this.readVaultFile(sourcePath))) {
      const targetPath = this.resolveNoteReference(reference, sourceDirectory, noteIndex)
      if (!targetPath) continue
      if (!isVaultPolicyPathAllowed(this.vaultPolicy, 'discover', targetPath)) continue
      allowedTargets.add(targetPath)
    }

    return [...allowedTargets].sort()
  }

  listBacklinks(notePath: string): string[] {
    const targetPath = this.assertDiscoverableReadPath(notePath)
    const noteIndex = this.getNoteIndex()
    const backlinks = new Set<string>()

    for (const sourcePath of noteIndex.notePaths) {
      for (const reference of extractNoteReferences(this.readVaultFile(sourcePath))) {
        const resolvedTarget = this.resolveNoteReference(reference, path.posix.dirname(sourcePath), noteIndex)
        if (resolvedTarget === targetPath) {
          backlinks.add(sourcePath)
          break
        }
      }
    }

    return [...backlinks].sort()
  }

  listTemplates(): GovernedTemplateSummary[] {
    return listTemplateTypes(this.vaultPolicy).map((templateType) => {
      const definition = getTemplateTypePolicy(this.vaultPolicy, templateType)
      return {
        templateType,
        templatePath: definition.templatePath,
        destinationRoots: definition.destinationRoots,
        requiredProvenance: definition.requiredProvenance,
      }
    })
  }

  createNoteFromTemplate(options: CreateFromTemplateOptions): CreateWorkflowNoteResult {
    const templatePolicy = getTemplateTypePolicy(this.vaultPolicy, options.templateType)
    const templatePath = assertVaultPolicyTemplatePath(this.vaultPolicy, templatePolicy.templatePath)
    const destinationPath = assertTemplateTypeDestinationPath(
      this.vaultPolicy,
      options.templateType,
      options.destinationPath,
    )

    if (templatePolicy.requiredProvenance && !options.provenance) {
      throw new Error(`Template type ${options.templateType} requires provenance fields`)
    }

    const renderedContent = this.renderTemplate(this.readVaultFile(templatePath), {
      ...options.variables,
      destination_path: destinationPath,
      template_type: options.templateType,
    })
    const contentWithMetadata = applyGovernedMetadata(renderedContent, {
      templateType: options.templateType,
      provenance: options.provenance,
      bodyAppendix: options.bodyAppendix,
    })

    this.writeVaultFile(destinationPath, contentWithMetadata)

    return {
      destinationPath,
      templateType: options.templateType,
    }
  }

  createReviewNote(sourcePath: string, destinationPath?: string, variables: Record<string, string> = {}) {
    const route = getWorkflowRoute(this.vaultPolicy, 'review')
    const governedSourcePath = assertWorkflowSourcePath(this.vaultPolicy, 'review', sourcePath)
    const governedDestinationPath =
      destinationPath ?? this.deriveWorkflowPath(governedSourcePath, route.sourceRoots, route.destinationRoot, '--review')

    return this.createNoteFromTemplate({
      templateType: route.templateType,
      destinationPath: assertWorkflowDestinationPath(this.vaultPolicy, 'review', governedDestinationPath),
      variables: {
        ...variables,
        source_path: governedSourcePath,
        source_name: path.posix.basename(governedSourcePath, '.md'),
      },
      provenance: {
        workflow: 'review',
        source_note: governedSourcePath,
      },
      bodyAppendix: buildProvenanceSection({
        Source: governedSourcePath,
      }),
    })
  }

  createPromotionCandidate(
    sourcePath: string,
    destinationPath?: string,
    variables: Record<string, string> = {},
  ) {
    const route = getWorkflowRoute(this.vaultPolicy, 'promotionCandidate')
    const governedSourcePath = assertWorkflowSourcePath(this.vaultPolicy, 'promotionCandidate', sourcePath)
    const governedDestinationPath =
      destinationPath ??
      this.deriveWorkflowPath(
        governedSourcePath,
        route.sourceRoots,
        route.destinationRoot,
        '--promotion-candidate',
      )

    return this.createNoteFromTemplate({
      templateType: route.templateType,
      destinationPath: assertWorkflowDestinationPath(
        this.vaultPolicy,
        'promotionCandidate',
        governedDestinationPath,
      ),
      variables: {
        ...variables,
        source_path: governedSourcePath,
        source_name: path.posix.basename(governedSourcePath, '.md'),
      },
      provenance: {
        workflow: 'promotion-candidate',
        source_note: governedSourcePath,
      },
      bodyAppendix: buildProvenanceSection({
        Source: governedSourcePath,
      }),
    })
  }

  createCuratedNote(
    sourcePath: string,
    templateType: string,
    destinationPath: string,
    variables: Record<string, string> = {},
  ) {
    const route = getCuratedWorkflowRoute(this.vaultPolicy)
    const governedSourcePath = assertWorkflowSourcePath(this.vaultPolicy, 'curatedNote', sourcePath)

    if (!route.allowedTemplateTypes.includes(templateType)) {
      throw new Error(`Vault policy blocked curated note template type: ${templateType}`)
    }

    const governedDestinationPath = assertWorkflowDestinationPath(
      this.vaultPolicy,
      'curatedNote',
      destinationPath,
      templateType,
    )

    return this.createNoteFromTemplate({
      templateType,
      destinationPath: governedDestinationPath,
      variables: {
        ...variables,
        source_path: governedSourcePath,
        source_name: path.posix.basename(governedSourcePath, '.md'),
      },
      provenance: {
        workflow: 'curated-note',
        source_note: governedSourcePath,
      },
      bodyAppendix: buildProvenanceSection({
        Source: governedSourcePath,
      }),
    })
  }

  logPromotion(options: PromotionLogOptions) {
    const route = getPromotionLogWorkflowRoute(this.vaultPolicy)
    const sourcePath = assertVaultPolicyPath(this.vaultPolicy, 'read', options.sourcePath)
    const curatedPath = assertVaultPolicyPath(this.vaultPolicy, 'read', options.curatedPath)
    const destinationPath =
      options.destinationPath ??
      this.deriveWorkflowPath(sourcePath, [path.posix.dirname(sourcePath), '.'], route.destinationRoot, '--promotion-log')
    const governedDestinationPath = assertWorkflowDestinationPath(
      this.vaultPolicy,
      'promotionLog',
      destinationPath,
    )
    const bodyAppendix = buildPromotionLogAppendix(sourcePath, curatedPath, options.notes)

    if (route.templateType) {
      return this.createNoteFromTemplate({
        templateType: route.templateType,
        destinationPath: governedDestinationPath,
        variables: {
          source_path: sourcePath,
          source_name: path.posix.basename(sourcePath, '.md'),
          curated_path: curatedPath,
          curated_name: path.posix.basename(curatedPath, '.md'),
        },
        provenance: {
          workflow: 'promotion-log',
          source_note: sourcePath,
          curated_note: curatedPath,
        },
        bodyAppendix,
      })
    }

    const content = applyGovernedMetadata('# Promotion Log\n', {
      templateType: 'promotion-log',
      provenance: {
        workflow: 'promotion-log',
        source_note: sourcePath,
        curated_note: curatedPath,
      },
      bodyAppendix,
    })
    this.writeVaultFile(governedDestinationPath, content)

    return {
      destinationPath: governedDestinationPath,
      templateType: 'promotion-log',
    }
  }

  private assertDiscoverableReadPath(rawPath: string): string {
    const readPath = assertVaultPolicyPath(this.vaultPolicy, 'read', rawPath)
    assertVaultPolicyDiscoveryPath(this.vaultPolicy, readPath)
    return readPath
  }

  private renderTemplate(templateContent: string, variables: Record<string, string | undefined>): string {
    return templateContent.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, variableName: string) => {
      return variables[variableName] ?? ''
    })
  }

  private writeVaultFile(relativePath: string, content: string): void {
    const governedPath = assertVaultPolicyPath(this.vaultPolicy, 'write', relativePath)
    if (!governedPath.endsWith('.md')) {
      throw new Error(`Governed note destinations must end with .md: ${governedPath}`)
    }

    const absolutePath = path.join(this.vaultPolicy.vaultRoot, governedPath)
    if (fs.existsSync(absolutePath)) {
      throw new Error(`Governed workflows do not overwrite existing notes: ${governedPath}`)
    }

    fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
    fs.writeFileSync(absolutePath, ensureTrailingNewline(content), { flag: 'wx' })
  }

  private readVaultFile(relativePath: string): string {
    const absolutePath = path.join(this.vaultPolicy.vaultRoot, relativePath)
    return fs.readFileSync(absolutePath, 'utf8')
  }

  private deriveWorkflowPath(
    sourcePath: string,
    sourceRoots: readonly string[],
    destinationRoot: string,
    suffix: string,
  ): string {
    const matchedSourceRoot = findBestMatchingRoot(sourcePath, sourceRoots)
    const relativeWithinRoot = matchedSourceRoot
      ? normalizeRelativeWithinRoot(matchedSourceRoot, sourcePath)
      : path.posix.basename(sourcePath)
    const relativeDirectory = path.posix.dirname(relativeWithinRoot)
    const fileName = `${path.posix.basename(sourcePath, '.md')}${suffix}.md`
    return relativeDirectory === '.'
      ? path.posix.join(destinationRoot, fileName)
      : path.posix.join(destinationRoot, relativeDirectory, fileName)
  }

  private getNoteIndex(): NoteIndex {
    if (this.noteIndex) {
      return this.noteIndex
    }

    const notePaths = this.listMarkdownFiles(getVaultPolicyDiscoveryRoots(this.vaultPolicy))
    const stemMap = new Map<string, readonly string[]>()

    for (const notePath of notePaths) {
      const stem = path.posix.basename(notePath, '.md').toLocaleLowerCase()
      const entries = stemMap.get(stem) ?? []
      stemMap.set(stem, [...entries, notePath].sort())
    }

    this.noteIndex = {
      notePaths,
      stemMap,
    }

    return this.noteIndex
  }

  private listMarkdownFiles(roots: readonly string[]): string[] {
    const files = new Set<string>()

    for (const root of roots) {
      const normalizedRoot = normalizeVaultRelativePath(root)
      this.walkVaultPath(normalizedRoot, files)
    }

    return [...files].sort()
  }

  private walkVaultPath(relativePath: string, files: Set<string>): void {
    if (
      relativePath !== '.' &&
      (!isVaultPolicyPathAllowed(this.vaultPolicy, 'discover', relativePath) ||
        !isVaultPolicyPathAllowed(this.vaultPolicy, 'read', relativePath))
    ) {
      return
    }

    const absolutePath = path.join(this.vaultPolicy.vaultRoot, relativePath === '.' ? '' : relativePath)
    if (!fs.existsSync(absolutePath)) {
      return
    }

    const entry = fs.lstatSync(absolutePath)
    if (entry.isSymbolicLink() && this.vaultPolicy.denySymlinks) {
      return
    }

    if (entry.isDirectory()) {
      for (const child of fs.readdirSync(absolutePath, { withFileTypes: true })) {
        const childRelativePath =
          relativePath === '.' ? child.name : path.posix.join(relativePath, child.name)
        this.walkVaultPath(childRelativePath, files)
      }
      return
    }

    if (relativePath.endsWith('.md')) {
      files.add(relativePath)
    }
  }

  private resolveNoteReference(
    reference: string,
    sourceDirectory: string,
    noteIndex: NoteIndex,
  ): string | undefined {
    const normalizedReference = reference.trim()
    if (!normalizedReference || normalizedReference.startsWith('http://') || normalizedReference.startsWith('https://')) {
      return undefined
    }

    if (normalizedReference.includes('/') || normalizedReference.startsWith('.')) {
      const candidatePath = normalizeReferencePath(sourceDirectory, normalizedReference)
      return this.resolveExplicitPathReference(candidatePath)
    }

    if (normalizedReference.endsWith('.md')) {
      return this.resolveExplicitPathReference(normalizeVaultRelativePath(normalizedReference))
    }

    const candidates = noteIndex.stemMap.get(normalizedReference.toLocaleLowerCase()) ?? []
    return candidates.length === 1 ? candidates[0] : undefined
  }

  private resolveExplicitPathReference(candidatePath: string): string | undefined {
    const normalizedCandidatePath = candidatePath.endsWith('.md') ? candidatePath : `${candidatePath}.md`
    if (!isVaultPolicyPathAllowed(this.vaultPolicy, 'discover', normalizedCandidatePath)) {
      return undefined
    }

    const absolutePath = path.join(this.vaultPolicy.vaultRoot, normalizedCandidatePath)
    return fs.existsSync(absolutePath) ? normalizedCandidatePath : undefined
  }
}

function extractNoteReferences(content: string): string[] {
  const references = new Set<string>()
  const wikilinkPattern = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g
  const markdownLinkPattern = /\[[^\]]+\]\(([^)#]+)(?:#[^)]+)?\)/g

  for (const match of content.matchAll(wikilinkPattern)) {
    references.add(match[1].trim())
  }

  for (const match of content.matchAll(markdownLinkPattern)) {
    references.add(match[1].trim())
  }

  return [...references]
}

function normalizeReferencePath(sourceDirectory: string, reference: string): string {
  const resolvedPath = path.posix.join(sourceDirectory === '.' ? '' : sourceDirectory, reference)
  return normalizeVaultRelativePath(resolvedPath)
}

function splitFrontmatter(content: string): { frontmatter: string | undefined; body: string } {
  if (!content.startsWith('---\n')) {
    return { frontmatter: undefined, body: content }
  }

  const endIndex = content.indexOf('\n---\n', 4)
  if (endIndex === -1) {
    return { frontmatter: undefined, body: content }
  }

  return {
    frontmatter: content.slice(4, endIndex),
    body: content.slice(endIndex + 5),
  }
}

function parseFrontmatter(frontmatter: string | undefined): Record<string, string> {
  if (!frontmatter) return {}

  return Object.fromEntries(
    frontmatter
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf(':')
        if (separatorIndex === -1) return [line, '']
        return [line.slice(0, separatorIndex).trim(), line.slice(separatorIndex + 1).trim()]
      }),
  )
}

function serializeFrontmatter(fields: Record<string, string>): string {
  const lines = Object.entries(fields).map(([key, value]) => `${key}: ${quoteFrontmatterValue(value)}`)
  return lines.length ? `---\n${lines.join('\n')}\n---\n` : ''
}

function applyGovernedMetadata(
  templateContent: string,
  options: {
    templateType: string
    provenance?: Record<string, string>
    bodyAppendix?: string
  },
): string {
  const { frontmatter, body } = splitFrontmatter(templateContent)
  const mergedFrontmatter = {
    ...parseFrontmatter(frontmatter),
    template_type: options.templateType,
    ...(options.provenance ?? {}),
  }
  const appendix = options.bodyAppendix ? `\n${options.bodyAppendix.trim()}\n` : ''
  return `${serializeFrontmatter(mergedFrontmatter)}${body.trimEnd()}${appendix}`
}

function buildProvenanceSection(references: Record<string, string>): string {
  const lines = Object.entries(references).map(
    ([label, targetPath]) => `- ${label}: [${targetPath}](${targetPath})`,
  )
  return ['## Provenance', ...lines].join('\n')
}

function buildPromotionLogAppendix(sourcePath: string, curatedPath: string, notes?: string): string {
  const lines = [
    '## Promotion Record',
    `- Source: [${sourcePath}](${sourcePath})`,
    `- Curated: [${curatedPath}](${curatedPath})`,
  ]

  if (notes?.trim()) {
    lines.push('', '## Notes', notes.trim())
  }

  return lines.join('\n')
}

function findBestMatchingRoot(notePath: string, sourceRoots: readonly string[]): string | undefined {
  return [...sourceRoots]
    .filter((sourceRoot) => notePath === sourceRoot || notePath.startsWith(`${sourceRoot}/`))
    .sort((left, right) => right.length - left.length)[0]
}

function normalizeRelativeWithinRoot(sourceRoot: string, sourcePath: string): string {
  if (sourceRoot === '.') return sourcePath
  return normalizeVaultRelativePath(path.posix.relative(sourceRoot, sourcePath))
}

function clampInteger(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, Math.trunc(value)))
}

function quoteFrontmatterValue(value: string): string {
  const escapedValue = value.replaceAll('"', '\\"')
  return `"${escapedValue}"`
}

function ensureTrailingNewline(content: string): string {
  return content.endsWith('\n') ? content : `${content}\n`
}
