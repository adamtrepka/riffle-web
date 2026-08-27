import { describe, expect, it } from 'vitest'
import { parseSchemaUrl, validateFetchedSchema } from '../../scripts/schema.mjs'

const validIdentity = {
  $schema: 'http://json-schema.org/draft-04/schema#',
  title: 'IssueExportResponse',
  type: 'object',
  additionalProperties: false,
  properties: {
    id: {},
    title: {},
    teaser: {},
    generatedAt: {},
    items: {},
  },
  definitions: {
    IssueExportItem: {},
  },
  $id: '/api/issues/export-schema',
  version: 1,
}

describe('schema fetch safety', () => {
  it('accepts only credential-free HTTP(S) URLs', () => {
    expect(parseSchemaUrl('http://example.test/schema').protocol).toBe('http:')
    expect(parseSchemaUrl('https://example.test/schema').protocol).toBe('https:')
    expect(() => parseSchemaUrl('')).toThrow('Usage:')
    expect(() => parseSchemaUrl('ftp://example.test/schema')).toThrow('http:// or https://')
    expect(() => parseSchemaUrl('https://user:pass@example.test/schema')).toThrow('without credentials')
    expect(() => parseSchemaUrl('not a URL')).toThrow('valid')
  })

  it('checks schema identity before it can be vendored', () => {
    expect(validateFetchedSchema(validIdentity)).toBe(validIdentity)
    for (const [field, value] of [
      ['$schema', 'http://json-schema.org/draft-07/schema#'],
      ['$id', '/api/issues/other-schema'],
      ['title', 'OtherSchema'],
      ['version', 2],
      ['type', 'array'],
    ]) {
      expect(() => validateFetchedSchema({ ...validIdentity, [field]: value })).toThrow()
    }
    expect(() => validateFetchedSchema([])).toThrow('plain object')
    expect(() => validateFetchedSchema({ ...validIdentity, properties: { id: {} } })).toThrow(
      'root properties',
    )
  })
})
