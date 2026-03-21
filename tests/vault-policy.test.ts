import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  assertTemplateTypeDestinationPath,
  assertVaultPolicyDiscoveryPath,
  assertVaultPolicyPath,
  assertVaultPolicyTemplatePath,
  assertWorkflowDestinationPath,
  assertWorkflowSourcePath,
  getTemplateTypePolicy,
  listTemplateTypes,
  loadVaultPolicy,
} from '../src/vault-policy.js'

const tempPaths: string[] = []

afterEach(() => {
  for (const tempPath of tempPaths.splice(0)) {
    fs.rmSync(tempPath, { recursive: true, force: true })
  }
})

describe('vault policy', () => {
  it('loads and normalizes discovery, template, and workflow policy fields', () => {
    const fixture = createFixture()
    const policy = loadVaultPolicy(fixture.policyFile, fixture.vaultRoot)

    expect(policy.readAllowlist).toEqual(['00_system/templates', '90_imported', 'areas', 'inbox'])
    expect(policy.discoveryAllowlist).toEqual(['90_imported', 'areas'])
    expect(policy.templateAllowlist).toEqual(['00_system/templates'])
    expect(policy.writeAllowlist).toEqual(['areas', 'inbox', 'reviews'])
    expect(listTemplateTypes(policy)).toEqual(['review_note'])
    expect(getTemplateTypePolicy(policy, 'review_note').templatePath).toBe(
      '00_system/templates/review-note.md',
    )
    expect(policy.workflows.review?.destinationRoot).toBe('reviews')
  })

  it('blocks denied paths deterministically', () => {
    const fixture = createFixture()
    const policy = loadVaultPolicy(fixture.policyFile, fixture.vaultRoot)

    expect(() => assertVaultPolicyPath(policy, 'read', '90_imported/private/secret.md')).toThrow(
      'denied path: 90_imported/private/secret.md',
    )
  })

  it('blocks discovery outside the discovery allowlist', () => {
    const fixture = createFixture()
    const policy = loadVaultPolicy(fixture.policyFile, fixture.vaultRoot)

    expect(() => assertVaultPolicyDiscoveryPath(policy, 'inbox/capture.md')).toThrow(
      'outside the allowlist: inbox/capture.md',
    )
  })

  it('blocks template reads outside the template allowlist', () => {
    const fixture = createFixture()
    const policy = loadVaultPolicy(fixture.policyFile, fixture.vaultRoot)

    expect(() => assertVaultPolicyTemplatePath(policy, '90_imported/template.md')).toThrow(
      'outside the allowlist: 90_imported/template.md',
    )
  })

  it('blocks workflow source and destination paths outside configured workflow roots', () => {
    const fixture = createFixture()
    const policy = loadVaultPolicy(fixture.policyFile, fixture.vaultRoot)

    expect(() => assertWorkflowSourcePath(policy, 'review', 'areas/project.md')).toThrow(
      'outside approved roots for review',
    )
    expect(() => assertWorkflowDestinationPath(policy, 'review', 'areas/review.md')).toThrow(
      'outside approved roots for review',
    )
  })

  it('blocks template destinations outside the template mapping roots', () => {
    const fixture = createFixture()
    const policy = loadVaultPolicy(fixture.policyFile, fixture.vaultRoot)

    expect(() => assertTemplateTypeDestinationPath(policy, 'review_note', 'inbox/review.md')).toThrow(
      'outside approved roots for review_note',
    )
  })

  it('rejects invalid policy wiring where workflow routes fall outside governing allowlists', () => {
    const fixture = createFixture({
      workflows: {
        review: {
          sourceRoots: ['90_imported'],
          destinationRoot: 'outside-reviews',
          templateType: 'review_note',
        },
      },
    })

    expect(() => loadVaultPolicy(fixture.policyFile, fixture.vaultRoot)).toThrow(
      'workflows.review.destinationRoot entry is outside the governing allowlist',
    )
  })
})

function createFixture(
  overrides: Partial<{
    readAllowlist: string[]
    writeAllowlist: string[]
    discoveryAllowlist: string[]
    templateAllowlist: string[]
    denylist: string[]
    templateTypes: Record<string, { templatePath: string; destinationRoots: string[]; requiredProvenance?: boolean }>
    workflows: object
  }> = {},
): { vaultRoot: string; policyFile: string } {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'obsidian-cli-mcp-policy-'))
  tempPaths.push(tempRoot)

  const vaultRoot = path.join(tempRoot, 'vault')
  fs.mkdirSync(path.join(vaultRoot, '00_system', 'templates'), { recursive: true })
  fs.mkdirSync(path.join(vaultRoot, '90_imported', 'private'), { recursive: true })
  fs.mkdirSync(path.join(vaultRoot, 'inbox'), { recursive: true })
  fs.mkdirSync(path.join(vaultRoot, 'areas'), { recursive: true })
  fs.mkdirSync(path.join(vaultRoot, 'reviews'), { recursive: true })

  const policyFile = path.join(tempRoot, 'vault-policy.json')
  fs.writeFileSync(
    policyFile,
    JSON.stringify(
      {
        version: 1,
        readAllowlist: overrides.readAllowlist ?? ['areas', 'inbox', '90_imported', '00_system/templates'],
        writeAllowlist: overrides.writeAllowlist ?? ['areas', 'inbox', 'reviews'],
        discoveryAllowlist: overrides.discoveryAllowlist ?? ['areas', '90_imported'],
        templateAllowlist: overrides.templateAllowlist ?? ['00_system/templates'],
        denylist: overrides.denylist ?? ['90_imported/private'],
        templateTypes: overrides.templateTypes ?? {
          review_note: {
            templatePath: '00_system/templates/review-note.md',
            destinationRoots: ['reviews'],
            requiredProvenance: true,
          },
        },
        workflows: overrides.workflows ?? {
          review: {
            sourceRoots: ['90_imported'],
            destinationRoot: 'reviews',
            templateType: 'review_note',
          },
        },
      },
      null,
      2,
    ),
  )

  return { vaultRoot, policyFile }
}
