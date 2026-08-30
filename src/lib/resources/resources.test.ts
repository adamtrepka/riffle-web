import { describe, expect, it } from 'vitest'
import { getIssueSections, getPrimaryUrl, loadIssues } from '../issues'
import {
  canonicalizeResourceUrl,
  collectResources,
  getResourceSource,
  getResources,
  resourceHash,
  resourceTarget,
  slugifyResourceTitle,
} from './resources'

describe('resource URL helpers', () => {
  it('canonicalizes tracking parameters and insignificant root slashes', () => {
    expect(canonicalizeResourceUrl(
      'HTTPS://WWW.Example.COM/?utm_source=old&article=42#comments',
    )).toBe('https://www.example.com?article=42')
    expect(canonicalizeResourceUrl('https://example.com/article/?gclid=abc&x=1')).toBe(
      'https://example.com/article/?x=1',
    )
  })

  it('keeps content parameters and replaces redirect parameters', () => {
    const canonicalUrl = 'https://example.com/article?tag=ai&tag=web'
    expect(resourceTarget(canonicalUrl)).toBe(
      'https://example.com/article?tag=ai&tag=web&utm_source=riffle&utm_medium=referral',
    )
    expect(resourceTarget('https://example.com')).toBe(
      'https://example.com?utm_source=riffle&utm_medium=referral',
    )
  })

  it('creates deterministic hashes and readable transliterated slugs', () => {
    expect(resourceHash('https://example.com/article')).toBe('63253829')
    expect(slugifyResourceTitle(".NET 10 – What's New?")).toBe('dotnet-10-whats-new')
    expect(slugifyResourceTitle('Zażółć gęślą jaźń')).toBe('zazolc-gesla-jazn')
  })

  it.each([
    ['https://youtube.com/watch?v=x', 'youtube'],
    ['https://youtu.be/x', 'youtube'],
    ['https://github.com/org/repo', 'github'],
    ['https://www.reddit.com/r/programming/x', 'reddit'],
    ['https://mrugalski.pl/post', 'mrugalski'],
    ['https://devblogs.microsoft.com/dotnet/post', 'microsoft'],
    ['https://www.example.org/post', 'example'],
  ])('maps %s to source %s', (url, source) => {
    expect(getResourceSource(url)).toBe(source)
  })
})

describe('published resource routes', () => {
  it('deduplicates canonical URLs and rejects distinct hash-prefix collisions', () => {
    const issue = loadIssues()[0]
    const firstItem = issue.items[0]
    const duplicateIssue = { ...issue, items: [{ ...firstItem, title: 'A different title' }] }
    expect(collectResources([issue, duplicateIssue])).toHaveLength(issue.items.length)

    const singleItemIssue = { ...issue, items: [firstItem] }
    expect(() => collectResources([
      singleItemIssue,
      { ...singleItemIssue, items: [{ ...firstItem, resourceUrl: 'https://different.example/item' }] },
    ], () => 'deadbeef')).toThrow(/Resource hash collision/)
  })

  it('keeps latest issue resources aligned with the route contract', () => {
    const { latest } = getIssueSections(loadIssues())
    if (!latest) throw new Error('Latest issue fixture is missing')

    const expectedCanonicalUrls = new Set(
      latest.items.map((item) => canonicalizeResourceUrl(getPrimaryUrl(item))),
    )
    const resources = getResources()
    const latestResources = resources.filter((resource) => expectedCanonicalUrls.has(resource.canonicalUrl))

    expect(latestResources).toHaveLength(expectedCanonicalUrls.size)
    expect(new Set(latestResources.map((resource) => resource.canonicalUrl))).toEqual(expectedCanonicalUrls)
    expect(new Set(latestResources.map((resource) => resource.path)).size).toBe(latestResources.length)
    for (const resource of latestResources) {
      expect(resource.path).toBe(`/r/${resource.source}/${resource.slug}-${resource.hash}/`)
    }
  })
})
