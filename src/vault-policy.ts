import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'

const TEMPLATE_TYPE_POLICY_SCHEMA = z.object({
  templatePath: z.string(),
  destinationRoots: z.array(z.string()).min(1, 'template destinationRoots must contain at least one path'),
  requiredProvenance: z.boolean().default(false),
})

const WORKFLOW_ROUTE_SCHEMA = z.object({
  sourceRoots: z.array(z.string()).min(1, 'workflow sourceRoots must contain at least one path'),
  destinationRoot: z.string(),
  templateType: z.string(),
})

const CURATED_WORKFLOW_ROUTE_SCHEMA = z.object({
  sourceRoots: z.array(z.string()).min(1, 'curated workflow sourceRoots must contain at least one path'),
  destinationRoots: z
    .array(z.string())
    .min(1, 'curated workflow destinationRoots must contain at least one path'),
  allowedTemplateTypes: z
    .array(z.string())
    .min(1, 'curated workflow allowedTemplateTypes must contain at least one type'),
})

const PROMOTION_LOG_ROUTE_SCHEMA = z.object({
  destinationRoot: z.string(),
  templateType: z.string().optional(),
})

const WORKFLOW_POLICIES_SCHEMA = z.object({
  review: WORKFLOW_ROUTE_SCHEMA.optional(),
  promotionCandidate: WORKFLOW_ROUTE_SCHEMA.optional(),
  curatedNote: CURATED_WORKFLOW_ROUTE_SCHEMA.optional(),
  promotionLog: PROMOTION_LOG_ROUTE_SCHEMA.optional(),
})

const VAULT_POLICY_SCHEMA = z.object({
  version: z.literal(1).default(1),
  readAllowlist: z.array(z.string()).min(1, 'readAllowlist must contain at least one path'),
  writeAllowlist: z.array(z.string()).default([]),
  discoveryAllowlist: z.array(z.string()).optional(),
  templateAllowlist: z.array(z.string()).default([]),
  denylist: z.array(z.string()).default([]),
  denyHiddenPaths: z.boolean().default(true),
  denySymlinks: z.boolean().default(true),
  templateTypes: z.record(TEMPLATE_TYPE_POLICY_SCHEMA).default({}),
  workflows: WORKFLOW_POLICIES_SCHEMA.default({}),
})

const DEFAULT_DENYLIST = ['.obsidian'] as const

export type VaultPolicyFile = z.infer<typeof VAULT_POLICY_SCHEMA>
export type VaultAccessMode = 'read' | 'write'
export type VaultPolicyFilterMode = VaultAccessMode | 'discover' | 'template'
export type VaultWorkflowKind = 'review' | 'promotionCandidate' | 'curatedNote' | 'promotionLog'

export interface TemplateTypePolicy {
  readonly templatePath: string
  readonly destinationRoots: readonly string[]
  readonly requiredProvenance: boolean
}

export interface WorkflowRoutePolicy {
  readonly sourceRoots: readonly string[]
  readonly destinationRoot: string
  readonly templateType: string
}

export interface CuratedWorkflowRoutePolicy {
  readonly sourceRoots: readonly string[]
  readonly destinationRoots: readonly string[]
  readonly allowedTemplateTypes: readonly string[]
}

export interface PromotionLogWorkflowRoutePolicy {
  readonly destinationRoot: string
  readonly templateType?: string
}

export interface WorkflowPolicies {
  readonly review?: WorkflowRoutePolicy
  readonly promotionCandidate?: WorkflowRoutePolicy
  readonly curatedNote?: CuratedWorkflowRoutePolicy
  readonly promotionLog?: PromotionLogWorkflowRoutePolicy
}

export interface VaultPolicy {
  readonly version: 1
  readonly policyFilePath: string
  readonly vaultRoot: string
  readonly readAllowlist: readonly string[]
  readonly writeAllowlist: readonly string[]
  readonly discoveryAllowlist: readonly string[]
  readonly templateAllowlist: readonly string[]
  readonly denylist: readonly string[]
  readonly denyHiddenPaths: boolean
  readonly denySymlinks: boolean
  readonly templateTypes: Readonly<Record<string, TemplateTypePolicy>>
  readonly workflows: WorkflowPolicies
}

export function loadVaultPolicy(policyFilePath: string, vaultRoot: string): VaultPolicy {
  const absolutePolicyFilePath = path.resolve(policyFilePath)
  const absoluteVaultRoot = resolveExistingDirectory(vaultRoot, 'OBSIDIAN_VAULT_ROOT')
  const policyText = fs.readFileSync(absolutePolicyFilePath, 'utf8')
  const parsedPolicy = VAULT_POLICY_SCHEMA.parse(JSON.parse(policyText) as VaultPolicyFile)

  const readAllowlist = normalizePolicyEntries(parsedPolicy.readAllowlist)
  const writeAllowlist = normalizePolicyEntries(parsedPolicy.writeAllowlist)
  const discoveryAllowlist = normalizePolicyEntries(parsedPolicy.discoveryAllowlist ?? parsedPolicy.readAllowlist)
  const templateAllowlist = normalizePolicyEntries(parsedPolicy.templateAllowlist)
  const denylist = normalizePolicyEntries([...DEFAULT_DENYLIST, ...parsedPolicy.denylist])
  const templateTypes = normalizeTemplateTypePolicies(parsedPolicy.templateTypes)
  const workflows = normalizeWorkflowPolicies(parsedPolicy.workflows)

  const policy: VaultPolicy = {
    version: 1,
    policyFilePath: absolutePolicyFilePath,
    vaultRoot: absoluteVaultRoot,
    readAllowlist,
    writeAllowlist,
    discoveryAllowlist,
    templateAllowlist,
    denylist,
    denyHiddenPaths: parsedPolicy.denyHiddenPaths,
    denySymlinks: parsedPolicy.denySymlinks,
    templateTypes,
    workflows,
  }

  validateVaultPolicyConfiguration(policy)

  return policy
}

export function assertVaultPolicyPath(
  policy: VaultPolicy,
  accessMode: VaultAccessMode,
  rawPath: string,
): string {
  return assertVaultPolicyPathAgainstEntries(policy, accessMode, rawPath, resolveAllowlist(policy, accessMode))
}

export function assertVaultPolicyDiscoveryPath(policy: VaultPolicy, rawPath: string): string {
  return assertVaultPolicyPathAgainstEntries(policy, 'discover', rawPath, policy.discoveryAllowlist)
}

export function assertVaultPolicyTemplatePath(policy: VaultPolicy, rawPath: string): string {
  return assertVaultPolicyPathAgainstEntries(policy, 'template', rawPath, policy.templateAllowlist)
}

export function isVaultPolicyPathAllowed(
  policy: VaultPolicy,
  accessMode: VaultPolicyFilterMode,
  rawPath: string,
): boolean {
  try {
    assertVaultPolicyPathAgainstEntries(policy, accessMode, rawPath, resolveAllowlist(policy, accessMode))
    return true
  } catch {
    return false
  }
}

export function getVaultPolicyDiscoveryRoots(policy: VaultPolicy): readonly string[] {
  return policy.discoveryAllowlist
}

export function listTemplateTypes(policy: VaultPolicy): readonly string[] {
  return Object.keys(policy.templateTypes).sort()
}

export function getTemplateTypePolicy(policy: VaultPolicy, templateType: string): TemplateTypePolicy {
  const definition = policy.templateTypes[templateType]
  if (!definition) {
    throw new Error(`Vault policy blocked unknown template type: ${templateType}`)
  }

  return definition
}

export function assertTemplateTypeDestinationPath(
  policy: VaultPolicy,
  templateType: string,
  rawPath: string,
): string {
  const definition = getTemplateTypePolicy(policy, templateType)
  return assertVaultPolicyPathAgainstEntries(
    policy,
    'write',
    rawPath,
    definition.destinationRoots,
    `Vault policy blocked template destination outside approved roots for ${templateType}: `,
  )
}

export function getWorkflowRoute(policy: VaultPolicy, workflow: 'review' | 'promotionCandidate'): WorkflowRoutePolicy {
  const route = policy.workflows[workflow]
  if (!route) {
    throw new Error(`Vault policy blocked workflow because ${workflow} is not configured`)
  }

  return route
}

export function getCuratedWorkflowRoute(policy: VaultPolicy): CuratedWorkflowRoutePolicy {
  const route = policy.workflows.curatedNote
  if (!route) {
    throw new Error('Vault policy blocked workflow because curatedNote is not configured')
  }

  return route
}

export function getPromotionLogWorkflowRoute(policy: VaultPolicy): PromotionLogWorkflowRoutePolicy {
  const route = policy.workflows.promotionLog
  if (!route) {
    throw new Error('Vault policy blocked workflow because promotionLog is not configured')
  }

  return route
}

export function assertWorkflowSourcePath(
  policy: VaultPolicy,
  workflow: 'review' | 'promotionCandidate' | 'curatedNote',
  rawPath: string,
): string {
  if (workflow === 'curatedNote') {
    const route = getCuratedWorkflowRoute(policy)
    return assertVaultPolicyPathAgainstEntries(
      policy,
      'read',
      rawPath,
      route.sourceRoots,
      `Vault policy blocked workflow source outside approved roots for ${workflow}: `,
    )
  }

  const route = getWorkflowRoute(policy, workflow)
  return assertVaultPolicyPathAgainstEntries(
    policy,
    'read',
    rawPath,
    route.sourceRoots,
    `Vault policy blocked workflow source outside approved roots for ${workflow}: `,
  )
}

export function assertWorkflowDestinationPath(
  policy: VaultPolicy,
  workflow: VaultWorkflowKind,
  rawPath: string,
  templateType?: string,
): string {
  if (workflow === 'review' || workflow === 'promotionCandidate') {
    const route = getWorkflowRoute(policy, workflow)
    return assertVaultPolicyPathAgainstEntries(
      policy,
      'write',
      rawPath,
      [route.destinationRoot],
      `Vault policy blocked workflow destination outside approved roots for ${workflow}: `,
    )
  }

  if (workflow === 'promotionLog') {
    const route = getPromotionLogWorkflowRoute(policy)
    return assertVaultPolicyPathAgainstEntries(
      policy,
      'write',
      rawPath,
      [route.destinationRoot],
      'Vault policy blocked workflow destination outside approved roots for promotionLog: ',
    )
  }

  const route = getCuratedWorkflowRoute(policy)
  const relativePath = assertVaultPolicyPathAgainstEntries(
    policy,
    'write',
    rawPath,
    route.destinationRoots,
    'Vault policy blocked workflow destination outside approved roots for curatedNote: ',
  )

  if (templateType) {
    assertVaultPolicyPathAgainstEntries(
      policy,
      'write',
      relativePath,
      getTemplateTypePolicy(policy, templateType).destinationRoots,
      `Vault policy blocked curated destination outside template roots for ${templateType}: `,
    )
  }

  return relativePath
}

function validateVaultPolicyConfiguration(policy: VaultPolicy): void {
  for (const entry of policy.discoveryAllowlist) {
    assertEntryCoveredByAllowlist(entry, policy.readAllowlist, 'discoveryAllowlist')
  }

  for (const [templateType, definition] of Object.entries(policy.templateTypes)) {
    assertEntryCoveredByAllowlist(definition.templatePath, policy.templateAllowlist, `templateTypes.${templateType}.templatePath`)

    for (const destinationRoot of definition.destinationRoots) {
      assertEntryCoveredByAllowlist(
        destinationRoot,
        policy.writeAllowlist,
        `templateTypes.${templateType}.destinationRoots`,
      )
    }
  }

  validateWorkflowRoute(policy, 'review')
  validateWorkflowRoute(policy, 'promotionCandidate')

  if (policy.workflows.curatedNote) {
    for (const sourceRoot of policy.workflows.curatedNote.sourceRoots) {
      assertEntryCoveredByAllowlist(sourceRoot, policy.discoveryAllowlist, 'workflows.curatedNote.sourceRoots')
    }

    for (const destinationRoot of policy.workflows.curatedNote.destinationRoots) {
      assertEntryCoveredByAllowlist(
        destinationRoot,
        policy.writeAllowlist,
        'workflows.curatedNote.destinationRoots',
      )
    }

    for (const templateType of policy.workflows.curatedNote.allowedTemplateTypes) {
      if (!policy.templateTypes[templateType]) {
        throw new Error(`Vault policy references unknown curated template type: ${templateType}`)
      }
    }
  }

  if (policy.workflows.promotionLog) {
    assertEntryCoveredByAllowlist(
      policy.workflows.promotionLog.destinationRoot,
      policy.writeAllowlist,
      'workflows.promotionLog.destinationRoot',
    )

    if (
      policy.workflows.promotionLog.templateType &&
      !policy.templateTypes[policy.workflows.promotionLog.templateType]
    ) {
      throw new Error(
        `Vault policy references unknown promotion log template type: ${policy.workflows.promotionLog.templateType}`,
      )
    }
  }
}

function validateWorkflowRoute(policy: VaultPolicy, workflow: 'review' | 'promotionCandidate'): void {
  const route = policy.workflows[workflow]
  if (!route) return

  for (const sourceRoot of route.sourceRoots) {
    assertEntryCoveredByAllowlist(sourceRoot, policy.discoveryAllowlist, `workflows.${workflow}.sourceRoots`)
  }

  assertEntryCoveredByAllowlist(
    route.destinationRoot,
    policy.writeAllowlist,
    `workflows.${workflow}.destinationRoot`,
  )

  const templatePolicy = policy.templateTypes[route.templateType]
  if (!templatePolicy) {
    throw new Error(`Vault policy references unknown template type for ${workflow}: ${route.templateType}`)
  }

  assertEntryCoveredByAllowlist(
    route.destinationRoot,
    templatePolicy.destinationRoots,
    `workflows.${workflow}.destinationRoot`,
  )
}

function assertEntryCoveredByAllowlist(entry: string, allowlist: readonly string[], label: string): void {
  if (!matchesAnyPolicyEntry(entry, allowlist)) {
    throw new Error(`Vault policy ${label} entry is outside the governing allowlist: ${entry}`)
  }
}

function normalizeTemplateTypePolicies(
  templateTypes: Record<string, z.infer<typeof TEMPLATE_TYPE_POLICY_SCHEMA>>,
): Readonly<Record<string, TemplateTypePolicy>> {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(templateTypes).map(([templateType, definition]) => [
        templateType,
        {
          templatePath: normalizeVaultRelativePath(definition.templatePath),
          destinationRoots: normalizePolicyEntries(definition.destinationRoots),
          requiredProvenance: definition.requiredProvenance,
        },
      ]),
    ),
  )
}

function normalizeWorkflowPolicies(
  workflows: z.infer<typeof WORKFLOW_POLICIES_SCHEMA>,
): WorkflowPolicies {
  return {
    review: workflows.review
      ? {
          sourceRoots: normalizePolicyEntries(workflows.review.sourceRoots),
          destinationRoot: normalizeVaultRelativePath(workflows.review.destinationRoot),
          templateType: workflows.review.templateType,
        }
      : undefined,
    promotionCandidate: workflows.promotionCandidate
      ? {
          sourceRoots: normalizePolicyEntries(workflows.promotionCandidate.sourceRoots),
          destinationRoot: normalizeVaultRelativePath(workflows.promotionCandidate.destinationRoot),
          templateType: workflows.promotionCandidate.templateType,
        }
      : undefined,
    curatedNote: workflows.curatedNote
      ? {
          sourceRoots: normalizePolicyEntries(workflows.curatedNote.sourceRoots),
          destinationRoots: normalizePolicyEntries(workflows.curatedNote.destinationRoots),
          allowedTemplateTypes: [...new Set(workflows.curatedNote.allowedTemplateTypes)].sort(),
        }
      : undefined,
    promotionLog: workflows.promotionLog
      ? {
          destinationRoot: normalizeVaultRelativePath(workflows.promotionLog.destinationRoot),
          templateType: workflows.promotionLog.templateType,
        }
      : undefined,
  }
}

function resolveAllowlist(policy: VaultPolicy, accessMode: VaultPolicyFilterMode): readonly string[] {
  if (accessMode === 'read') return policy.readAllowlist
  if (accessMode === 'write') return policy.writeAllowlist
  if (accessMode === 'discover') return policy.discoveryAllowlist
  return policy.templateAllowlist
}

function assertVaultPolicyPathAgainstEntries(
  policy: VaultPolicy,
  accessMode: VaultPolicyFilterMode,
  rawPath: string,
  allowlist: readonly string[],
  allowlistMessagePrefix?: string,
): string {
  const relativePath = normalizeVaultRelativePath(rawPath)
  const absolutePath = resolveWithinVault(policy.vaultRoot, relativePath)

  if (policy.denyHiddenPaths && containsHiddenSegment(relativePath)) {
    throw new Error(`Vault policy blocked ${accessMode} access to hidden path: ${relativePath}`)
  }

  if (matchesAnyPolicyEntry(relativePath, policy.denylist)) {
    throw new Error(`Vault policy blocked ${accessMode} access to denied path: ${relativePath}`)
  }

  if (!matchesAnyPolicyEntry(relativePath, allowlist)) {
    const messagePrefix =
      allowlistMessagePrefix ?? `Vault policy blocked ${accessMode} access outside the allowlist: `
    throw new Error(`${messagePrefix}${relativePath}`)
  }

  if (policy.denySymlinks) {
    assertNoSymlinkTraversal(policy.vaultRoot, absolutePath, accessMode)
  }

  return relativePath
}

function resolveExistingDirectory(rawPath: string, label: string): string {
  const absolutePath = path.resolve(rawPath)

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`${label} does not exist: ${absolutePath}`)
  }

  if (!fs.statSync(absolutePath).isDirectory()) {
    throw new Error(`${label} must be a directory: ${absolutePath}`)
  }

  return fs.realpathSync(absolutePath)
}

function normalizePolicyEntries(entries: readonly string[]): readonly string[] {
  return [...new Set(entries.map((entry) => normalizeVaultRelativePath(entry)))].sort()
}

export function normalizeVaultRelativePath(rawPath: string): string {
  const trimmedPath = rawPath.trim()
  if (!trimmedPath || trimmedPath === '.' || trimmedPath === './') {
    return '.'
  }

  const normalizedPath = path.posix.normalize(trimmedPath.replaceAll('\\', '/'))
  if (normalizedPath === '.' || normalizedPath === '/') {
    return '.'
  }

  if (normalizedPath.startsWith('/') || normalizedPath === '..' || normalizedPath.startsWith('../')) {
    throw new Error(`Vault policy path must stay relative to the pinned vault: ${rawPath}`)
  }

  return normalizedPath.replace(/\/$/, '')
}

function resolveWithinVault(vaultRoot: string, relativePath: string): string {
  const absolutePath = path.resolve(vaultRoot, relativePath === '.' ? '' : relativePath)
  const vaultRootWithSeparator = vaultRoot.endsWith(path.sep) ? vaultRoot : `${vaultRoot}${path.sep}`

  if (absolutePath !== vaultRoot && !absolutePath.startsWith(vaultRootWithSeparator)) {
    throw new Error(`Vault policy blocked path outside the pinned vault: ${relativePath}`)
  }

  return absolutePath
}

function containsHiddenSegment(relativePath: string): boolean {
  if (relativePath === '.') return false

  return relativePath.split('/').some((segment) => segment.startsWith('.'))
}

function matchesAnyPolicyEntry(relativePath: string, entries: readonly string[]): boolean {
  return entries.some((entry) => matchesPolicyEntry(relativePath, entry))
}

function matchesPolicyEntry(relativePath: string, entry: string): boolean {
  if (entry === '.') return true
  return relativePath === entry || relativePath.startsWith(`${entry}/`)
}

function assertNoSymlinkTraversal(
  vaultRoot: string,
  absolutePath: string,
  accessMode: VaultPolicyFilterMode,
): void {
  const relativeSegments = path.relative(vaultRoot, absolutePath).split(path.sep).filter(Boolean)
  let currentPath = vaultRoot

  for (const segment of relativeSegments) {
    currentPath = path.join(currentPath, segment)

    if (!fs.existsSync(currentPath)) {
      return
    }

    if (fs.lstatSync(currentPath).isSymbolicLink()) {
      const relativePath = path.relative(vaultRoot, currentPath).split(path.sep).join('/')
      throw new Error(`Vault policy blocked ${accessMode} access through symlinked path: ${relativePath}`)
    }
  }
}
