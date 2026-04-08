import pg from 'pg'

const { Pool } = pg

function buildPoolConfig() {
  const url = process.env.DATABASE_URL?.trim()
  if (url) {
    return { connectionString: url }
  }
  return {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD ?? '',
    database: process.env.PGDATABASE || 'postgres',
  }
}

/** @type {pg.Pool} */
export const pool = new Pool(buildPoolConfig())
