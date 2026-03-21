import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { GovernedVaultService } from '../../src/services/governed-vault.service.js'
import { loadVaultPolicy } from '../../src/vault-policy.js'

const tempPaths: string[] = []

afterEach(() => {
  for (const tempPath of tempPaths.splice(0)) {
    fs.rmSync(tempPath, { recursive: true, force: true })
  }
})

describe('GovernedVaultService', () => {
  it('returns search results only from allowed discovery paths and does not leak blocked paths', () => {
    const fixture = createFixture()
    const service = createService(fixture)

    const matches = service.search('governed-needle', { limit: 10 })

    expect(matches.map((match) => match.path)).toEqual(['90_imported/vendor/raw-source.md'])
    expect(matches[0].excerpt).toContain('governed-needle')
    expect(JSON.stringify(matches)).not.toContain('blocked-backlink.md')
    expect(JSON.stringify(matches)).not.toContain('.obsidian')
  })

  it('filters outgoing links so denied targets are not returned', () => {
    const fixture = createFixture()
    const service = createService(fixture)

    const links = service.listLinks('90_imported/vendor/raw-source.md')

    expect(links).toEqual(['05_resources/allowed-target.md'])
    expect(links).not.toContain('90_imported/private/blocked-target.md')
  })

  it('filters backlinks so denied source notes are not returned', () => {
    const fixture = createFixture()
    const service = createService(fixture)

    const backlinks = service.listBacklinks('05_resources/allowed-target.md')

    expect(backlinks).toEqual(['90_imported/vendor/raw-source.md'])
    expect(backlinks).not.toContain('90_imported/private/blocked-backlink.md')
  })

  it('creates notes from approved templates only in approved destinations', () => {
    const fixture = createFixture()
    const service = createService(fixture)

    const result = service.createNoteFromTemplate({
      templateType: 'inbox_capture',
      destinationPath: '01_inbox/capture.md',
      variables: { title: 'Captured Item' },
    })

    expect(result.destinationPath).toBe('01_inbox/capture.md')
    const createdNote = readVaultFile(fixture.vaultRoot, '01_inbox/capture.md')
    expect(createdNote).toContain('template_type: "inbox_capture"')
    expect(createdNote).toContain('# Captured Item')
  })

  it('blocks disallowed template types and destinations', () => {
    const fixture = createFixture()
    const service = createService(fixture)

    expect(() =>
      service.createNoteFromTemplate({
        templateType: 'unknown_template',
        destinationPath: '01_inbox/capture.md',
      }),
    ).toThrow('unknown template type')

    expect(() =>
      service.createNoteFromTemplate({
        templateType: 'inbox_capture',
        destinationPath: '05_resources/capture.md',
      }),
    ).toThrow('outside approved roots')
  })

  it('requires provenance for template types that declare it and blocks overwrite', () => {
    const fixture = createFixture()
    const service = createService(fixture)

    expect(() =>
      service.createNoteFromTemplate({
        templateType: 'resource_note',
        destinationPath: '05_resources/new-resource.md',
      }),
    ).toThrow('requires provenance')

    service.createNoteFromTemplate({
      templateType: 'inbox_capture',
      destinationPath: '01_inbox/capture.md',
      variables: { title: 'Captured Item' },
    })

    expect(() =>
      service.createNoteFromTemplate({
        templateType: 'inbox_capture',
        destinationPath: '01_inbox/capture.md',
        variables: { title: 'Captured Item' },
      }),
    ).toThrow('do not overwrite existing notes')
  })

  it('creates review and promotion candidate notes with deterministic provenance and without mutating the source note', () => {
    const fixture = createFixture()
    const service = createService(fixture)
    const sourceBefore = readVaultFile(fixture.vaultRoot, '90_imported/vendor/raw-source.md')

    const review = service.createReviewNote('90_imported/vendor/raw-source.md')
    const candidate = service.createPromotionCandidate('90_imported/vendor/raw-source.md')

    expect(review.destinationPath).toBe('90_imported/review/vendor/raw-source--review.md')
    expect(candidate.destinationPath).toBe(
      '90_imported/promotion-candidates/vendor/raw-source--promotion-candidate.md',
    )

    const reviewContent = readVaultFile(fixture.vaultRoot, review.destinationPath)
    const candidateContent = readVaultFile(fixture.vaultRoot, candidate.destinationPath)

    expect(reviewContent).toContain('workflow: "review"')
    expect(reviewContent).toContain('source_note: "90_imported/vendor/raw-source.md"')
    expect(reviewContent).toContain('[90_imported/vendor/raw-source.md](90_imported/vendor/raw-source.md)')
    expect(candidateContent).toContain('workflow: "promotion-candidate"')
    expect(candidateContent).toContain('source_note: "90_imported/vendor/raw-source.md"')
    expect(readVaultFile(fixture.vaultRoot, '90_imported/vendor/raw-source.md')).toBe(sourceBefore)
  })

  it('creates curated notes only with approved template types and destinations', () => {
    const fixture = createFixture()
    const service = createService(fixture)

    const curated = service.createCuratedNote(
      '90_imported/vendor/raw-source.md',
      'resource_note',
      '05_resources/vendor/raw-source-resource.md',
      { title: 'Curated Resource' },
    )

    expect(curated.destinationPath).toBe('05_resources/vendor/raw-source-resource.md')
    const curatedContent = readVaultFile(fixture.vaultRoot, curated.destinationPath)
    expect(curatedContent).toContain('workflow: "curated-note"')
    expect(curatedContent).toContain('source_note: "90_imported/vendor/raw-source.md"')

    expect(() =>
      service.createCuratedNote(
        '90_imported/vendor/raw-source.md',
        'inbox_capture',
        '05_resources/vendor/unsafe.md',
      ),
    ).toThrow('blocked curated note template type')

    expect(() =>
      service.createCuratedNote(
        '90_imported/vendor/raw-source.md',
        'resource_note',
        '03_areas/vendor/unsafe.md',
      ),
    ).toThrow('outside approved roots')
  })

  it('writes promotion logs only to approved paths and preserves source and curated links', () => {
    const fixture = createFixture()
    const service = createService(fixture)

    service.createCuratedNote(
      '90_imported/vendor/raw-source.md',
      'resource_note',
      '05_resources/vendor/raw-source-resource.md',
      { title: 'Curated Resource' },
    )

    const log = service.logPromotion({
      sourcePath: '90_imported/vendor/raw-source.md',
      curatedPath: '05_resources/vendor/raw-source-resource.md',
      notes: 'Approved after review.',
    })

    expect(log.destinationPath).toBe('90_imported/promoted-index/raw-source--promotion-log.md')
    const logContent = readVaultFile(fixture.vaultRoot, log.destinationPath)
    expect(logContent).toContain('workflow: "promotion-log"')
    expect(logContent).toContain('source_note: "90_imported/vendor/raw-source.md"')
    expect(logContent).toContain('curated_note: "05_resources/vendor/raw-source-resource.md"')
    expect(logContent).toContain('[90_imported/vendor/raw-source.md](90_imported/vendor/raw-source.md)')
    expect(logContent).toContain('[05_resources/vendor/raw-source-resource.md](05_resources/vendor/raw-source-resource.md)')

    expect(() =>
      service.logPromotion({
        sourcePath: '90_imported/vendor/raw-source.md',
        curatedPath: '05_resources/vendor/raw-source-resource.md',
        destinationPath: '05_resources/vendor/not-allowed.md',
      }),
    ).toThrow('outside approved roots')
  })
})

function createService(fixture: { vaultRoot: string; policyFile: string }) {
  return new GovernedVaultService(loadVaultPolicy(fixture.policyFile, fixture.vaultRoot))
}

function createFixture(): { vaultRoot: string; policyFile: string } {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'obsidian-cli-mcp-governed-'))
  tempPaths.push(tempRoot)

  const vaultRoot = path.join(tempRoot, 'vault')
  fs.mkdirSync(path.join(vaultRoot, '00_system', 'templates'), { recursive: true })
  fs.mkdirSync(path.join(vaultRoot, '01_inbox'), { recursive: true })
  fs.mkdirSync(path.join(vaultRoot, '05_resources'), { recursive: true })
  fs.mkdirSync(path.join(vaultRoot, '90_imported', 'vendor'), { recursive: true })
  fs.mkdirSync(path.join(vaultRoot, '90_imported', 'review'), { recursive: true })
  fs.mkdirSync(path.join(vaultRoot, '90_imported', 'promotion-candidates'), { recursive: true })
  fs.mkdirSync(path.join(vaultRoot, '90_imported', 'promoted-index'), { recursive: true })
  fs.mkdirSync(path.join(vaultRoot, '90_imported', 'private'), { recursive: true })
  fs.mkdirSync(path.join(vaultRoot, '.obsidian'), { recursive: true })

  writeVaultFile(vaultRoot, '00_system/templates/inbox-capture.md', '# {{title}}\n')
  writeVaultFile(vaultRoot, '00_system/templates/imported-review.md', '# Review {{source_name}}\n')
  writeVaultFile(vaultRoot, '00_system/templates/promotion-candidate.md', '# Candidate {{source_name}}\n')
  writeVaultFile(vaultRoot, '00_system/templates/resource-note.md', '# {{title}}\n')
  writeVaultFile(vaultRoot, '00_system/templates/promotion-log.md', '# Promotion Log {{source_name}}\n')

  writeVaultFile(
    vaultRoot,
    '90_imported/vendor/raw-source.md',
    [
      '# Raw Source',
      'governed-needle allowed result',
      '[[allowed-target]]',
      '[[blocked-target]]',
    ].join('\n'),
  )
  writeVaultFile(vaultRoot, '05_resources/allowed-target.md', '# Allowed Target\n')
  writeVaultFile(
    vaultRoot,
    '90_imported/private/blocked-target.md',
    '# Blocked Target\ngoverned-needle blocked result\n',
  )
  writeVaultFile(
    vaultRoot,
    '90_imported/private/blocked-backlink.md',
    '# Blocked Backlink\n[[allowed-target]]\n',
  )
  writeVaultFile(vaultRoot, '.obsidian/workspace.json', '{"query":"governed-needle hidden result"}')

  const policyFile = path.join(tempRoot, 'vault-policy.json')
  fs.writeFileSync(
    policyFile,
    JSON.stringify(
      {
        version: 1,
        readAllowlist: ['90_imported', '05_resources', '00_system/templates'],
        writeAllowlist: [
          '01_inbox',
          '05_resources',
          '90_imported/review',
          '90_imported/promotion-candidates',
          '90_imported/promoted-index',
        ],
        discoveryAllowlist: ['90_imported', '05_resources'],
        templateAllowlist: ['00_system/templates'],
        denylist: ['90_imported/private'],
        templateTypes: {
          inbox_capture: {
            templatePath: '00_system/templates/inbox-capture.md',
            destinationRoots: ['01_inbox'],
            requiredProvenance: false,
          },
          imported_review: {
            templatePath: '00_system/templates/imported-review.md',
            destinationRoots: ['90_imported/review'],
            requiredProvenance: true,
          },
          promotion_candidate: {
            templatePath: '00_system/templates/promotion-candidate.md',
            destinationRoots: ['90_imported/promotion-candidates'],
            requiredProvenance: true,
          },
          resource_note: {
            templatePath: '00_system/templates/resource-note.md',
            destinationRoots: ['05_resources'],
            requiredProvenance: true,
          },
          promotion_log: {
            templatePath: '00_system/templates/promotion-log.md',
            destinationRoots: ['90_imported/promoted-index'],
            requiredProvenance: true,
          },
        },
        workflows: {
          review: {
            sourceRoots: ['90_imported'],
            destinationRoot: '90_imported/review',
            templateType: 'imported_review',
          },
          promotionCandidate: {
            sourceRoots: ['90_imported'],
            destinationRoot: '90_imported/promotion-candidates',
            templateType: 'promotion_candidate',
          },
          curatedNote: {
            sourceRoots: ['90_imported'],
            destinationRoots: ['05_resources'],
            allowedTemplateTypes: ['resource_note'],
          },
          promotionLog: {
            destinationRoot: '90_imported/promoted-index',
            templateType: 'promotion_log',
          },
        },
      },
      null,
      2,
    ),
  )

  return { vaultRoot, policyFile }
}

function writeVaultFile(vaultRoot: string, relativePath: string, content: string): void {
  const absolutePath = path.join(vaultRoot, relativePath)
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true })
  fs.writeFileSync(absolutePath, content)
}

function readVaultFile(vaultRoot: string, relativePath: string): string {
  return fs.readFileSync(path.join(vaultRoot, relativePath), 'utf8')
}
