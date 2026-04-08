import express from 'express'
import { pool } from './db/pool.js'

const app = express()

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'order-app-server' })
})

app.get('/health/db', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT current_database() AS database, NOW() AS server_time')
    res.json({
      ok: true,
      database: rows[0].database,
      serverTime: rows[0].server_time,
    })
  } catch (err) {
    const code = err.code
    const hint =
      code === '3D000'
        ? `DB "${process.env.PGDATABASE || 'order_app'}"가 없을 수 있습니다. psql에서 CREATE DATABASE 를 실행해 주세요.`
        : undefined
    res.status(503).json({
      ok: false,
      error: 'database_unavailable',
      code,
      message: err.message,
      hint,
    })
  }
})

export default app
