import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import knex from 'knex'

const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations')

export function createDb(databaseConfig) {
  const { client, connection } = databaseConfig
  if (client === 'better-sqlite3' && connection.filename !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(connection.filename)), { recursive: true })
  }
  return knex({
    ...databaseConfig,
    // an in-memory SQLite database exists per connection, so pin the pool to one
    pool: connection.filename === ':memory:' ? { min: 1, max: 1 } : undefined,
    migrations: { directory: MIGRATIONS_DIR },
  })
}

export function migrateToLatest(db) {
  return db.migrate.latest()
}
