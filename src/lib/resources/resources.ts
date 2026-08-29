import { createHash } from 'node:crypto'
import { getPrimaryUrl, loadIssues, type PublishedIssue } from '../issues'
import type { IssueExportItem } from '../../generated/issue-export'

const trackingParameters = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',
  'gclid',
]

export interface Resource {
  canonicalUrl: string
  targetUrl: string
  source: string
  slug: string
  hash: string
  path: string
  title: string
}

function transliterate(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[łŁ]/g, (character) => character === 'Ł' ? 'L' : 'l')
    .replace(/[đĐ]/g, (character) => character === 'Đ' ? 'D' : 'd')
    .replace(/ß/g, 'ss')
    .replace(/[æÆ]/g, (character) => character === 'Æ' ? 'AE' : 'ae')
    .replace(/[œŒ]/g, (character) => character === 'Œ' ? 'OE' : 'oe')
    .replace(/[øØ]/g, (character) => character === 'Ø' ? 'O' : 'o')
    .replace(/[þÞ]/g, (character) => character === 'Þ' ? 'TH' : 'th')
}

export function slugifyResourceTitle(title: string): string {
  const transliterated = transliterate(title.trim().toLowerCase())
    .replace(/^\.(?=[a-z])/u, 'dot')
    .replace(/[’']/g, '')

  const slug = transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')

  return slug || 'resource'
}

function isRedditHostname(hostname: string): boolean {
  return hostname === 'reddit.com' || hostname.endsWith('.reddit.com') || hostname === 'redd.it' || hostname.endsWith('.redd.it')
}

export function getResourceSource(value: string): string {
  const hostname = new URL(value).hostname.toLowerCase()
  if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be') return 'youtube'
  if (hostname === 'github.com' || hostname.endsWith('.github.com')) return 'github'
  if (isRedditHostname(hostname)) return 'reddit'
  if (hostname === 'mrugalski.pl' || hostname.endsWith('.mrugalski.pl')) return 'mrugalski'
  if (hostname === 'devblogs.microsoft.com' || hostname.endsWith('.devblogs.microsoft.com')) return 'microsoft'

  const fallback = hostname.replace(/^www\./, '').split('.')[0]
  return slugifyResourceTitle(fallback)
}

export function canonicalizeResourceUrl(value: string): string {
  const url = new URL(value)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Unsupported resource URL protocol: ${url.protocol}`)
  }

  url.hostname = url.hostname.toLowerCase()
  url.hash = ''
  for (const parameter of trackingParameters) url.searchParams.delete(parameter)

  const href = url.href
  return url.pathname === '/' ? href.replace(`${url.origin}/`, url.origin) : href
}

export function resourceHash(canonicalUrl: string): string {
  return createHash('sha256').update(canonicalUrl).digest('hex').slice(0, 8)
}

export function resourceTarget(canonicalUrl: string): string {
  const url = new URL(canonicalUrl)
  url.searchParams.set('utm_source', 'riffle')
  url.searchParams.set('utm_medium', 'referral')
  const href = url.href
  return url.pathname === '/' ? href.replace(`${url.origin}/`, url.origin) : href
}

type HashFunction = (canonicalUrl: string) => string

function createResource(title: string, primaryUrl: string, hashFunction: HashFunction = resourceHash): Resource {
  const canonicalUrl = canonicalizeResourceUrl(primaryUrl)
  const hash = hashFunction(canonicalUrl)
  const source = getResourceSource(canonicalUrl)
  const slug = slugifyResourceTitle(title)
  return {
    canonicalUrl,
    targetUrl: resourceTarget(canonicalUrl),
    source,
    slug,
    hash,
    path: `/r/${source}/${slug}-${hash}/`,
    title,
  }
}

export function collectResources(issues: readonly PublishedIssue[], hashFunction: HashFunction = resourceHash): Resource[] {
  const resources = new Map<string, Resource>()
  const hashes = new Map<string, string>()

  for (const issue of issues) {
    for (const item of issue.items) {
      const resource = createResource(item.title, getPrimaryUrl(item), hashFunction)
      const existingUrl = hashes.get(resource.hash)
      if (existingUrl && existingUrl !== resource.canonicalUrl) {
        throw new Error(
          `Resource hash collision for ${resource.hash}: ${existingUrl} and ${resource.canonicalUrl}`,
        )
      }
      hashes.set(resource.hash, resource.canonicalUrl)
      if (!resources.has(resource.canonicalUrl)) resources.set(resource.canonicalUrl, resource)
    }
  }

  return [...resources.values()]
}

export function getResources(): Resource[] {
  return collectResources(loadIssues())
}

export function getResourcePath(item: IssueExportItem, title: string): string {
  return createResource(title, getPrimaryUrl(item)).path
}
