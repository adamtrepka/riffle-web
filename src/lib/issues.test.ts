import { describe, expect, it } from 'vitest'
import validateIssueExport from '../generated/issue-export-validator.cjs'
import type { IssueExportResponse } from '../generated/issue-export'
import {
  getIssueSections,
  getPrimaryUrl,
  getRenderableIssue,
  normalizeRedditUrl,
  type RenderableIssue,
  validateIssue,
} from './issues'

const completeIssue: IssueExportResponse = {
  id: '2026-08-14',
  title: 'Narzędzia, które zostają',
  teaser: 'Krótki wybór rzeczy wartych uwagi.',
  generatedAt: '2026-08-27T10:00:00Z',
  items: [
    {
      position: 1,
      redditPostId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Original title',
      description: 'Polski opis.',
      subreddit: 'programming',
      resourceUrl: 'https://example.com/project',
      redditUrl: 'https://reddit.com/r/programming/comments/abc/post',
    },
  ],
}

function renderableIssue(overrides: Partial<IssueExportResponse> = {}): RenderableIssue {
  const issue = getRenderableIssue({ ...completeIssue, ...overrides })
  if (!issue) throw new Error('Test issue should be renderable')
  return issue
}

describe('generated Draft-04 issue validator', () => {
  it('matches the schema with every property optional', () => {
    expect(validateIssueExport({})).toBe(true)
    expect(validateIssueExport({ teaser: null, items: [{ redditUrl: null, resourceUrl: null, subreddit: null }] })).toBe(true)
    expect(validateIssue({})).toEqual({})
  })

  it('accepts the complete real-export shape and preserves the input', () => {
    expect(validateIssue(completeIssue)).toBe(completeIssue)
  })

  it.each([
    { extra: true },
    { items: [{ unknown: true }] },
  ])('rejects additional properties: %j', (value) => {
    expect(validateIssueExport(value)).toBe(false)
  })

  it('enforces the schema formats without adding required-field rules', () => {
    expect(validateIssueExport({ generatedAt: '2026-02-31T10:00:00Z' })).toBe(false)
    expect(validateIssueExport({ items: [{ position: -2147483648 }] })).toBe(true)
    expect(validateIssueExport({ items: [{ position: 2147483647 }] })).toBe(true)
    expect(validateIssueExport({ items: [{ position: 2147483648 }] })).toBe(false)
    expect(validateIssueExport({ items: [{ redditPostId: '123e4567-e89b-12d3-a456-426614174000' }] })).toBe(true)
    expect(validateIssueExport({ items: [{ redditPostId: 'not-a-guid' }] })).toBe(false)
  })
})

describe('presentation eligibility and Reddit policy', () => {
  it('keeps schema validation non-transforming and normalizes only presentation output', () => {
    const relativeItem = {
      ...completeIssue.items![0],
      resourceUrl: null,
      redditUrl: '/r/programming/comments/abc/post',
    }
    const input = { ...completeIssue, items: [relativeItem] }
    expect(validateIssue(input)).toBe(input)
    expect(getRenderableIssue(input)?.items[0].redditUrl).toBe(
      'https://www.reddit.com/r/programming/comments/abc/post',
    )
  })

  it('prefers a resource URL and falls back to normalized Reddit', () => {
    const issue = renderableIssue({
      items: [{ ...completeIssue.items![0], resourceUrl: null, redditUrl: '/r/programming/post' }],
    })
    expect(normalizeRedditUrl('/r/programming/post')).toBe('https://www.reddit.com/r/programming/post')
    expect(getPrimaryUrl(issue.items[0])).toBe('https://www.reddit.com/r/programming/post')
    expect(getPrimaryUrl(renderableIssue().items[0])).toBe('https://example.com/project')
  })

  it.each(['/not-reddit/path', '//evil.example/r/programming', 'javascript:alert(1)', '/r/../../evil'])(
    'marks unsafe Reddit URL %s as non-publishable',
    (redditUrl) => {
      expect(
        getRenderableIssue({
          ...completeIssue,
          items: [{ ...completeIssue.items![0], resourceUrl: null, redditUrl }],
        }),
      ).toBeNull()
    },
  )

  it('orders renderable issues and limits recent issues to four', () => {
    const issues = Array.from({ length: 6 }, (_, index) =>
      renderableIssue({
        id: `2026-08-${String(27 - index).padStart(2, '0')}`,
        generatedAt: `2026-08-${String(27 - index).padStart(2, '0')}T10:00:00Z`,
      }),
    )
    const { latest, recent } = getIssueSections(issues)
    expect(latest?.generatedAt).toBe('2026-08-27T10:00:00Z')
    expect(recent).toHaveLength(4)
    expect(recent[0].generatedAt).toBe('2026-08-26T10:00:00Z')
  })

  it('keeps schema-valid incomplete objects out of publication', () => {
    expect(validateIssueExport({})).toBe(true)
    expect(getRenderableIssue({})).toBeNull()
  })
})
