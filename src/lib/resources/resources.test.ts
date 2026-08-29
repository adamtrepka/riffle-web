import { describe, expect, it } from 'vitest'
import { getPrimaryUrl, loadIssues } from '../issues'
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

  it('covers every primary resource in the latest issue with one route', () => {
    const latestIssue = loadIssues().find((issue) => issue.slug === '2026-08-14')
    if (!latestIssue) throw new Error('Latest issue fixture is missing')
    const resources = getResources()
    const latestResources = latestIssue.items.map((item) => {
      const primaryUrl = getPrimaryUrl(item)
      const canonicalUrl = canonicalizeResourceUrl(primaryUrl)
      return resources.find((resource) => resource.canonicalUrl === canonicalUrl)
    })

    expect(latestResources).toHaveLength(10)
    expect(latestResources.every(Boolean)).toBe(true)
    expect(new Set(latestResources.map((resource) => resource?.path)).size).toBe(10)
    expect(latestResources).toEqual([
      expect.objectContaining({
        canonicalUrl: 'https://www.yahoo.com/tech/ai/articles/worlds-leading-ai-companies-struggling-152436499.html',
        targetUrl: 'https://www.yahoo.com/tech/ai/articles/worlds-leading-ai-companies-struggling-152436499.html?utm_source=riffle&utm_medium=referral',
        path: '/r/yahoo/ai-wymyka-sie-z-testow-problemem-moga-byc-same-testy-74270724/',
      }),
      expect.objectContaining({
        canonicalUrl: 'https://www.tomshardware.com/tech-industry/artificial-intelligence/ai-creates-16-new-viruses-that-never-existed-in-nature-after-learning-dnas-pattern-from-9-trillion-nucleotides-experts-warn-such-applications-are-way-ahead-of-necessary-guardrails',
        targetUrl: 'https://www.tomshardware.com/tech-industry/artificial-intelligence/ai-creates-16-new-viruses-that-never-existed-in-nature-after-learning-dnas-pattern-from-9-trillion-nucleotides-experts-warn-such-applications-are-way-ahead-of-necessary-guardrails?utm_source=riffle&utm_medium=referral',
        path: '/r/tomshardware/ai-zaprojektowala-wirusy-zdolne-do-infekowania-e-coli-acc1ade9/',
      }),
      expect.objectContaining({
        canonicalUrl: 'https://v.redd.it/bfg8k2l4qdih1',
        targetUrl: 'https://v.redd.it/bfg8k2l4qdih1?utm_source=riffle&utm_medium=referral',
        path: '/r/reddit/szesc-zdjec-dziennie-na-trening-wykrywania-ai-093ef229/',
      }),
      expect.objectContaining({
        canonicalUrl: 'https://v.redd.it/08eiywdj92jh1',
        targetUrl: 'https://v.redd.it/08eiywdj92jh1?utm_source=riffle&utm_medium=referral',
        path: '/r/reddit/gdy-agent-ai-wysyla-prawdziwy-list-jeden-przycisk-to-za-duzo-7cad392b/',
      }),
      expect.objectContaining({
        canonicalUrl: 'https://github.com/edendalexis/search-api-cost-benchmark',
        targetUrl: 'https://github.com/edendalexis/search-api-cost-benchmark?utm_source=riffle&utm_medium=referral',
        path: '/r/github/api-za-5-dolarow-rachunek-na-149-ukryty-koszt-wyszukiwania-d-794fa66a/',
      }),
      expect.objectContaining({
        canonicalUrl: 'https://www.reddit.com/r/AI_Agents/comments/1veeix3/i_ran_8_ai_agent_memory_systems_through_2176/',
        targetUrl: 'https://www.reddit.com/r/AI_Agents/comments/1veeix3/i_ran_8_ai_agent_memory_systems_through_2176/?utm_source=riffle&utm_medium=referral',
        path: '/r/reddit/zwykly-markdown-pokonal-wyspecjalizowane-pamieci-dla-agentow-41b07892/',
      }),
      expect.objectContaining({
        canonicalUrl: 'https://www.businessinsider.com/anthropic-ceo-dario-amodei-ai-public-opinion-cure-cancer-2026-8',
        targetUrl: 'https://www.businessinsider.com/anthropic-ceo-dario-amodei-ai-public-opinion-cure-cancer-2026-8?utm_source=riffle&utm_medium=referral',
        path: '/r/businessinsider/wyleczenie-raka-nie-wystarczy-by-ai-odzyskalo-zaufanie-29a3256c/',
      }),
      expect.objectContaining({
        canonicalUrl: 'https://github.com/Bittu-the-coder/wifi-audio-streamer',
        targetUrl: 'https://github.com/Bittu-the-coder/wifi-audio-streamer?utm_source=riffle&utm_medium=referral',
        path: '/r/github/telefon-jako-glosnik-pc-bez-instalowania-aplikacji-7b87297f/',
      }),
      expect.objectContaining({
        canonicalUrl: 'https://www.reddit.com/gallery/1vqzawd',
        targetUrl: 'https://www.reddit.com/gallery/1vqzawd?utm_source=riffle&utm_medium=referral',
        path: '/r/reddit/high-endurance-nie-dorownuje-industrial-grade-122-tys-cykli-81d2e439/',
      }),
      expect.objectContaining({
        canonicalUrl: 'https://www.tomshardware.com/software/cloud-storage/judge-clears-nine-pbs-to-retrieve-70-years-of-archival-tv-data-court-rules-station-owns-50tb-of-data-in-iron-mountain-servers-after-host-went-under',
        targetUrl: 'https://www.tomshardware.com/software/cloud-storage/judge-clears-nine-pbs-to-retrieve-70-years-of-archival-tv-data-court-rules-station-owns-50tb-of-data-in-iron-mountain-servers-after-host-went-under?utm_source=riffle&utm_medium=referral',
        path: '/r/tomshardware/50-tb-archiwum-nine-pbs-sad-ustala-procedure-odzyskania-dany-3816257b/',
      }),
    ])
  })
})
