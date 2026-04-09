import { Router } from 'express'
import { pool } from '../db/pool.js'
import { createOrderInDb } from '../services/createOrder.js'

export const ordersRouter = Router()

function isoTime(placedAt) {
  if (placedAt instanceof Date) return placedAt.toISOString()
  return new Date(placedAt).toISOString()
}

function mapOrderRow(order, items) {
  return {
    id: order.id,
    placedAt: isoTime(order.placed_at),
    status: order.status,
    total: order.total,
    lines: items.map((row) => ({
      menuId: row.menu_id,
      name: row.menu_name,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      lineTotal: row.line_total,
      optionIds: row.option_ids,
      optionLabels: row.option_labels,
    })),
  }
}

ordersRouter.get('/', async (_req, res) => {
  try {
    const { rows: orders } = await pool.query(
      `SELECT id, placed_at, status, total FROM orders ORDER BY placed_at DESC`,
    )
    const result = []
    for (const o of orders) {
      const { rows: items } = await pool.query(
        `SELECT oi.menu_id, oi.quantity, oi.unit_price, oi.line_total, oi.option_ids,
                m.name AS menu_name
         FROM order_items oi
         JOIN menus m ON m.id = oi.menu_id
         WHERE oi.order_id = $1
         ORDER BY oi.id`,
        [o.id],
      )
      const mapped = []
      for (const row of items) {
        const labels = await fetchOptionLabels(row.menu_id, row.option_ids)
        mapped.push({
          menu_id: row.menu_id,
          menu_name: row.menu_name,
          quantity: row.quantity,
          unit_price: row.unit_price,
          line_total: row.line_total,
          option_ids: row.option_ids,
          option_labels: labels,
        })
      }
      result.push(mapOrderRow(o, mapped))
    }
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message })
  }
})

async function fetchOptionLabels(menuId, optionIds) {
  if (!optionIds?.length) return []
  const { rows } = await pool.query(
    `SELECT option_key, name FROM menu_options
     WHERE menu_id = $1 AND option_key = ANY($2::text[])`,
    [menuId, optionIds],
  )
  const map = Object.fromEntries(rows.map((r) => [r.option_key, r.name]))
  return optionIds.map((k) => map[k] || k)
}

ordersRouter.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, placed_at, status, total FROM orders WHERE id = $1`,
      [req.params.id],
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: 'order_not_found' })
    }
    const o = rows[0]
    const { rows: items } = await pool.query(
      `SELECT oi.menu_id, oi.quantity, oi.unit_price, oi.line_total, oi.option_ids,
              m.name AS menu_name
       FROM order_items oi
       JOIN menus m ON m.id = oi.menu_id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [o.id],
    )
    const mapped = []
    for (const row of items) {
      const labels = await fetchOptionLabels(row.menu_id, row.option_ids)
      mapped.push({
        menu_id: row.menu_id,
        menu_name: row.menu_name,
        quantity: row.quantity,
        unit_price: row.unit_price,
        line_total: row.line_total,
        option_ids: row.option_ids,
        option_labels: labels,
      })
    }
    res.json(mapOrderRow(o, mapped))
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message })
  }
})

ordersRouter.post('/', async (req, res) => {
  const lines = req.body?.lines
  if (!Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: 'invalid_body', message: 'lines required' })
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const created = await createOrderInDb(client, lines)
    await client.query('COMMIT')
    res.status(201).json(created)
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    if (e.code === 'STOCK') {
      return res.status(409).json({
        error: 'insufficient_stock',
        menuId: e.menuId,
        need: e.need,
        have: e.have,
      })
    }
    if (e.code === 'VALIDATION') {
      return res.status(400).json({ error: 'validation', message: e.message })
    }
    res.status(500).json({ error: 'server_error', message: e.message })
  } finally {
    client.release()
  }
})

const NEXT_STATUS = {
  received: 'preparing',
  preparing: 'completed',
}

ordersRouter.patch('/:id/status', async (req, res) => {
  const { status: next } = req.body || {}
  if (next !== 'preparing' && next !== 'completed') {
    return res.status(400).json({ error: 'invalid_status' })
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      'SELECT status FROM orders WHERE id = $1 FOR UPDATE',
      [req.params.id],
    )
    if (rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'order_not_found' })
    }
    const cur = rows[0].status
    if (NEXT_STATUS[cur] !== next) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'invalid_transition', current: cur })
    }
    await client.query(
      'UPDATE orders SET status = $2 WHERE id = $1',
      [req.params.id, next],
    )
    await client.query('COMMIT')
    const full = await pool.query(
      `SELECT id, placed_at, status, total FROM orders WHERE id = $1`,
      [req.params.id],
    )
    const o = full.rows[0]
    const { rows: items } = await pool.query(
      `SELECT oi.menu_id, oi.quantity, oi.unit_price, oi.line_total, oi.option_ids,
              m.name AS menu_name
       FROM order_items oi
       JOIN menus m ON m.id = oi.menu_id
       WHERE oi.order_id = $1 ORDER BY oi.id`,
      [o.id],
    )
    const mapped = []
    for (const row of items) {
      const labels = await fetchOptionLabels(row.menu_id, row.option_ids)
      mapped.push({
        menu_id: row.menu_id,
        menu_name: row.menu_name,
        quantity: row.quantity,
        unit_price: row.unit_price,
        line_total: row.line_total,
        option_ids: row.option_ids,
        option_labels: labels,
      })
    }
    res.json(mapOrderRow(o, mapped))
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    res.status(500).json({ error: 'server_error', message: e.message })
  } finally {
    client.release()
  }
})
