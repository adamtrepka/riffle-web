import validateIssueExport from '../generated/issue-export-validator.cjs'
import type { IssueExportItem, IssueExportResponse } from '../generated/issue-export'

export type Issue = IssueExportResponse
export type RenderableItem = IssueExportItem & {
  position: number
  title: string
  description: string
  subreddit: string
  resourceUrl?: string | null
  redditUrl?: string | null
}
export type RenderableIssue = IssueExportResponse & {
  id: string
  title: string
  teaser: string
  generatedAt: string
  items: RenderableItem[]
}
export type PublishedIssue = RenderableIssue & { slug: string }

function validationMessage(): string {
  const details = validateIssueExport.errors
    ?.map((error) => `${error.instancePath || '$'} ${error.message ?? 'is invalid'}`)
    .join('; ')
  return `Issue export does not match the authoritative schema${details ? `: ${details}` : ''}`
}

/** Runs only the generated Draft-04 validator and returns the original value. */
export function validateIssue(value: unknown): IssueExportResponse {
  if (!validateIssueExport(value)) throw new Error(validationMessage())
  return value
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeRedditUrlForPresentation(value: string): string {
  if (/[\u0000-\u001f\u007f\\]/.test(value)) throw new Error('Unsafe Reddit URL')
  if (value.startsWith('/')) {
    if (!value.startsWith('/r/') || value.startsWith('//')) throw new Error('Unsafe Reddit URL')
    const url = new URL(value, 'https://www.reddit.com')
    const subredditPath = url.pathname.slice('/r/'.length)
    if (
      url.origin !== 'https://www.reddit.com' ||
      !url.pathname.startsWith('/r/') ||
      !subredditPath ||
      subredditPath.startsWith('/')
    ) {
      throw new Error('Unsafe Reddit URL')
    }
    return url.href
  }

  const url = new URL(value)
  const hostname = url.hostname.toLowerCase()
  if (
    (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    (hostname !== 'reddit.com' && !hostname.endsWith('.reddit.com')) ||
    url.username !== '' ||
    url.password !== ''
  ) {
    throw new Error('Unsafe Reddit URL')
  }
  return value
}

export function normalizeRedditUrl(value: string): string {
  return normalizeRedditUrlForPresentation(value)
}

/**
 * Presentation eligibility is site policy, not schema validation. The schema
 * intentionally permits incomplete objects, which are skipped from routes.
 */
export function getRenderableIssue(issue: IssueExportResponse): RenderableIssue | null {
  if (
    !isNonEmptyString(issue.id) ||
    !isNonEmptyString(issue.title) ||
    !isNonEmptyString(issue.teaser) ||
    typeof issue.generatedAt !== 'string' ||
    !Array.isArray(issue.items) ||
    issue.items.length === 0
  ) {
    return null
  }

  const id = issue.id
  const title = issue.title
  const teaser = issue.teaser
  const generatedAt = issue.generatedAt
  const items: RenderableItem[] = []
  for (const item of issue.items) {
    const position = item.position
    const itemTitle = item.title
    const description = item.description
    const subreddit = item.subreddit
    if (
      !isPositiveInteger(position) ||
      !isNonEmptyString(itemTitle) ||
      !isNonEmptyString(description) ||
      !isNonEmptyString(subreddit)
    ) {
      return null
    }
    if (item.resourceUrl !== undefined && item.resourceUrl !== null && !isAbsoluteHttpUrl(item.resourceUrl)) {
      return null
    }

    let redditUrl: string | null | undefined
    try {
      redditUrl = item.redditUrl === undefined || item.redditUrl === null
        ? item.redditUrl
        : normalizeRedditUrlForPresentation(item.redditUrl)
    } catch {
      return null
    }
    if (item.resourceUrl == null && redditUrl == null) return null
    items.push({ ...item, position, title: itemTitle, description, subreddit, redditUrl })
  }

  return { ...issue, id, title, teaser, generatedAt, items }
}

export function isRenderableIssue(issue: IssueExportResponse): issue is RenderableIssue {
  return getRenderableIssue(issue) !== null
}

export function sortIssues<T extends RenderableIssue>(issues: T[]): T[] {
  return [...issues].sort(
    (left, right) => Date.parse(right.generatedAt) - Date.parse(left.generatedAt),
  )
}

export function getIssueSections<T extends RenderableIssue>(issues: T[]) {
  const sorted = sortIssues(issues)
  return { latest: sorted[0], recent: sorted.slice(1, 5) }
}

export function getPrimaryUrl(item: IssueExportItem): string {
  const url = item.resourceUrl ?? (item.redditUrl ? normalizeRedditUrl(item.redditUrl) : null)
  if (!url) throw new Error('Issue item has no usable URL')
  return url
}

export function formatPublicationDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
    .format(new Date(value))
    .toUpperCase()
}

const issueModules = import.meta.glob('../content/issues/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

export function loadIssues(): PublishedIssue[] {
  return Object.entries(issueModules)
    .map(([path, data]) => {
      const filename = path.split('/').pop() ?? ''
      const slug = filename.replace(/\.json$/, '')
      if (!slug) throw new Error(`Issue file "${path}" has no filename stem`)
      const issue = validateIssue(data)
      const renderable = getRenderableIssue(issue)
      if (!renderable) {
        console.warn(`Skipping non-publishable issue export "${path}": presentation eligibility failed`)
        return null
      }
      return { ...renderable, slug }
    })
    .filter((issue): issue is PublishedIssue => issue !== null)
}
