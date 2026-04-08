/**
 * order_app 데이터베이스가 없으면 생성합니다.
 * postgres 슈퍼유저로 `postgres` DB에 접속해 실행합니다.
 * 사용: npm run db:ensure
 */
import 'dotenv/config'
import pg from 'pg'

const dbName = process.env.PGDATABASE || 'order_app'

const client = new pg.Client({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD ?? '',
  database: 'postgres',
})

try {
  await client.connect()
  const { rows } = await client.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [dbName],
  )
  if (rows.length === 0) {
    await client.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`)
    console.log(`Created database: ${dbName}`)
  } else {
    console.log(`Database already exists: ${dbName}`)
  }
} catch (e) {
  console.error(e.message)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
