import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import 'dotenv/config'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function clientConfig() {
  const url = process.env.DATABASE_URL?.trim()
  if (url) return { connectionString: url }
  return {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD ?? '',
    database: process.env.PGDATABASE || 'order_app',
  }
}

const client = new pg.Client(clientConfig())

try {
  await client.connect()
  const schema = readFileSync(join(root, 'sql', 'schema.sql'), 'utf8')
  const seed = readFileSync(join(root, 'sql', 'seed.sql'), 'utf8')
  await client.query(schema)
  await client.query(seed)
  console.log('Migration + seed OK')
} catch (e) {
  console.error(e)
  process.exitCode = 1
} finally {
  await client.end()
}
