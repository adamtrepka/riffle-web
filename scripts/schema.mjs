import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv-draft-04'
import addFormats from 'ajv-formats'
import { compile } from 'json-schema-to-typescript'
import standaloneCode from 'ajv/dist/standalone/index.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const schemaPath = join(root, 'schemas/issue-export.v1.schema.json')
const generatedDir = join(root, 'src/generated')
const schemaUrlEnvironment = 'RIFFLE_SCHEMA_URL'
const draft04SchemaUrl = 'http://json-schema.org/draft-04/schema#'
const expectedSchemaId = '/api/issues/export-schema'
const expectedRootProperties = ['id', 'title', 'teaser', 'generatedAt', 'items']
const artifactNames = [
  'issue-export.d.ts',
  'issue-export-validator.cjs',
  'issue-export-validator.d.cts',
]

function canonicalJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

export function parseSchemaUrl(value) {
  if (!value) throw new Error('Usage: pnpm schema:fetch -- <http(s) schema URL>')

  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error('Schema URL must be a valid http:// or https:// URL')
  }
  if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username || url.password) {
    throw new Error('Schema URL must use http:// or https:// without credentials')
  }
  return url
}

function isPlainObject(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

export function validateFetchedSchema(value) {
  if (!isPlainObject(value)) throw new Error('Fetched schema root must be a plain object')
  if (value.$schema !== draft04SchemaUrl) {
    throw new Error(`Fetched schema must use Draft-04 (${draft04SchemaUrl})`)
  }
  if (value.title !== 'IssueExportResponse') {
    throw new Error('Fetched schema title must be IssueExportResponse')
  }
  if (value.$id !== expectedSchemaId) {
    throw new Error(`Fetched schema $id must be ${expectedSchemaId}`)
  }
  if (!Number.isInteger(value.version) || value.version !== 1) {
    throw new Error('Fetched schema version must be integer 1')
  }
  if (value.type !== 'object' || value.additionalProperties !== false) {
    throw new Error('Fetched schema must be a closed root object schema')
  }
  if (!isPlainObject(value.properties)) {
    throw new Error('Fetched schema must define root properties')
  }
  const propertyNames = Object.keys(value.properties)
  if (
    propertyNames.length !== expectedRootProperties.length ||
    expectedRootProperties.some((name) => !Object.hasOwn(value.properties, name))
  ) {
    throw new Error('Fetched schema root properties do not match IssueExportResponse')
  }
  if (!isPlainObject(value.definitions?.IssueExportItem)) {
    throw new Error('Fetched schema must define IssueExportItem')
  }
  return value
}

async function readSchema() {
  return JSON.parse(await readFile(schemaPath, 'utf8'))
}

function createAjv() {
  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    code: { source: true },
  })

  // These metadata fields are not Draft-04 validation keywords.
  ajv.addKeyword({ keyword: '$id', schemaType: 'string' })
  ajv.addKeyword({ keyword: 'version', schemaType: 'number' })
  addFormats(ajv)
  // Canonical .NET Guid format (D), supplied as a RegExp so standalone code
  // embeds it instead of requiring a runtime-only custom function.
  ajv.addFormat(
    'guid',
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  )
  return ajv
}

function validatorDeclaration() {
  return `// Generated file — do not edit. Regenerate with pnpm schema:generate.\nimport type { IssueExportResponse } from './issue-export'\n\nexport interface IssueExportValidationError {\n  instancePath: string\n  schemaPath: string\n  keyword: string\n  params: Record<string, unknown>\n  message?: string\n}\n\nexport interface IssueExportValidator {\n  (data: unknown): data is IssueExportResponse\n  errors?: IssueExportValidationError[] | null\n}\n\ndeclare const validateIssueExport: IssueExportValidator\nexport = validateIssueExport\n`
}

async function generateArtifacts(outputDir) {
  const schema = await readSchema()
  await mkdir(outputDir, { recursive: true })
  const typeSource = await compile(schema, 'IssueExportResponse', {
    bannerComment:
      '// Generated file — do not edit. Regenerate with pnpm schema:generate.',
    style: { singleQuote: true },
  })
  const ajv = createAjv()
  const validate = ajv.compile(schema)
  const validatorSource = `${standaloneCode(ajv, validate)}\nmodule.exports.default = module.exports\n`

  await writeFile(join(outputDir, artifactNames[0]), typeSource)
  await writeFile(join(outputDir, artifactNames[1]), validatorSource)
  await writeFile(join(outputDir, artifactNames[2]), validatorDeclaration())
}

export async function fetchSchema(source) {
  const url = parseSchemaUrl(source)
  let response
  try {
    response = await fetch(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    })
  } catch (error) {
    throw new Error(`Schema fetch failed without following redirects: ${error.message}`)
  }
  if (response.redirected) throw new Error('Schema fetch rejected a redirect')
  if (!response.ok) throw new Error(`Schema fetch failed: ${response.status} ${response.statusText}`)

  let schema
  try {
    schema = await response.json()
  } catch {
    throw new Error('Schema fetch returned invalid JSON')
  }
  validateFetchedSchema(schema)

  const content = canonicalJson(schema)
  const hash = createHash('sha256').update(content).digest('hex')
  let changed = true
  try {
    changed = !(await readFile(schemaPath)).equals(Buffer.from(content))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  if (changed) {
    const temporaryPath = `${schemaPath}.${randomUUID()}.tmp`
    try {
      await writeFile(temporaryPath, content, { flag: 'wx' })
      await rename(temporaryPath, schemaPath)
    } finally {
      await rm(temporaryPath, { force: true })
    }
  }
  console.log(`Schema source: ${url.href}; sha256: ${hash}; status: ${changed ? 'updated' : 'unchanged'}`)
}

async function compareArtifacts(candidateDir) {
  const temporaryDir = await mkdtemp(join(tmpdir(), 'riffle-schema-'))
  try {
    await generateArtifacts(temporaryDir)
    for (const artifactName of artifactNames) {
      const expected = await readFile(join(temporaryDir, artifactName))
      const actual = await readFile(join(candidateDir, artifactName))
      if (!expected.equals(actual)) {
        const expectedHash = createHash('sha256').update(expected).digest('hex')
        const actualHash = createHash('sha256').update(actual).digest('hex')
        throw new Error(
          `Generated artifact differs: ${artifactName} (expected ${expectedHash}, got ${actualHash})`,
        )
      }
    }
  } finally {
    await rm(temporaryDir, { recursive: true, force: true })
  }
}

export async function main(args = process.argv.slice(2)) {
  const [command, ...commandArgs] = args

  if (command === 'fetch') {
    if (commandArgs.length > 1) throw new Error('Usage: pnpm schema:fetch -- <http(s) schema URL>')
    const source = commandArgs[0] ?? process.env[schemaUrlEnvironment]
    await fetchSchema(source)
  } else if (command === 'generate') {
    await generateArtifacts(generatedDir)
  } else if (command === 'check') {
    const candidateIndex = commandArgs.indexOf('--candidate-dir')
    const candidateDir = resolve(
      root,
      candidateIndex === -1 ? 'src/generated' : commandArgs[candidateIndex + 1],
    )
    if (candidateIndex !== -1 && !commandArgs[candidateIndex + 1]) {
      throw new Error('--candidate-dir requires a directory')
    }
    await compareArtifacts(candidateDir)
  } else {
    throw new Error('Usage: schema.mjs <fetch [url]|generate|check [--candidate-dir dir]>')
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main()
}
