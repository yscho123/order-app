import { Router } from 'express'
import { pool } from '../db/pool.js'

export const menusRouter = Router()

menusRouter.get('/', async (_req, res) => {
  try {
    const menus = await pool.query(
      `SELECT id, name, description, price, stock, image_url AS "imageUrl"
       FROM menus ORDER BY id`,
    )
    const options = await pool.query(
      `SELECT menu_id AS "menuId", option_key AS id, name, extra_price AS "extraPrice"
       FROM menu_options ORDER BY menu_id, option_key`,
    )
    const byMenu = {}
    for (const row of options.rows) {
      if (!byMenu[row.menuId]) byMenu[row.menuId] = []
      byMenu[row.menuId].push({
        id: row.id,
        name: row.name,
        extraPrice: row.extraprice ?? row.extraPrice,
      })
    }
    const list = menus.rows.map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      price: m.price,
      stockQty: m.stock,
      imageUrl: m.imageurl ?? m.imageUrl,
      options: byMenu[m.id] ?? [],
    }))
    res.json(list)
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: e.message })
  }
})

menusRouter.patch('/:menuId/stock', async (req, res) => {
  const { menuId } = req.params
  const delta = Number(req.body?.delta)
  if (!Number.isFinite(delta) || delta === 0) {
    return res.status(400).json({ error: 'invalid_delta' })
  }
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      'SELECT stock FROM menus WHERE id = $1 FOR UPDATE',
      [menuId],
    )
    if (rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'menu_not_found' })
    }
    const next = Math.max(0, rows[0].stock + Math.trunc(delta))
    await client.query('UPDATE menus SET stock = $2 WHERE id = $1', [
      menuId,
      next,
    ])
    await client.query('COMMIT')
    res.json({ id: menuId, stockQty: next })
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    res.status(500).json({ error: 'server_error', message: e.message })
  } finally {
    client.release()
  }
})
