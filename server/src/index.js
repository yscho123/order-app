import 'dotenv/config'
import app from './app.js'
import { pool } from './db/pool.js'

const PORT = Number(process.env.PORT) || 3000

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})

async function shutdown(signal) {
  console.log(`${signal} received, closing...`)
  server.close(() => {})
  await pool.end().catch(() => {})
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
