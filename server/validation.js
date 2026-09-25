import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'

const SCHEMA_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'schema', 'sppi_v1_schema.json')
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8'))

const ajv = new Ajv({ allErrors: true, strictTypes: false })
const validateSchema = ajv.compile(schema)

const SPPI_BLOCKS = ['metadata', 'context', 'execution', 'events', 'outcome']

// Returns { errors } or { sppi } — sppi contains only the five schema blocks.
export function validateSppi(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { errors: ['body: must be a JSON object'] }
  }
  const sppi = Object.fromEntries(SPPI_BLOCKS.map(block => [block, body[block]]))

  if (!validateSchema(sppi)) {
    return { errors: validateSchema.errors.map(e => `${e.instancePath || '/'} ${e.message}`) }
  }

  // Beyond the schema: fields the app depends on for identity and grouping.
  const errors = []
  if (!sppi.metadata.sppi_id.trim())        errors.push('/metadata/sppi_id must not be blank')
  if (!sppi.metadata.attacking_team.trim()) errors.push('/metadata/attacking_team must not be blank')
  return errors.length ? { errors } : { sppi }
}
