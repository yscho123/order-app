/**
 * @param {import('pg').PoolClient} client
 * @param {{ menuId: string, optionIds: string[], quantity: number }[]} lines
 */
export async function createOrderInDb(client, lines) {
  if (!Array.isArray(lines) || lines.length === 0) {
    const e = new Error('empty_lines')
    e.code = 'VALIDATION'
    throw e
  }

  const needByMenu = {}
  for (const line of lines) {
    const q = Math.trunc(Number(line.quantity))
    if (!line.menuId || q < 1) {
      const e = new Error('invalid_line')
      e.code = 'VALIDATION'
      throw e
    }
    needByMenu[line.menuId] = (needByMenu[line.menuId] || 0) + q
  }

  const menuIds = Object.keys(needByMenu)
  const { rows: menuRows } = await client.query(
    `SELECT id, name, price, stock FROM menus WHERE id = ANY($1::text[]) FOR UPDATE`,
    [menuIds],
  )
  if (menuRows.length !== menuIds.length) {
    const e = new Error('unknown_menu')
    e.code = 'VALIDATION'
    throw e
  }

  const nameMap = Object.fromEntries(menuRows.map((m) => [m.id, m.name]))
  const priceMap = Object.fromEntries(menuRows.map((m) => [m.id, m.price]))
  const stockMap = Object.fromEntries(menuRows.map((m) => [m.id, m.stock]))

  const { rows: optRows } = await client.query(
    `SELECT menu_id, option_key, name, extra_price
     FROM menu_options WHERE menu_id = ANY($1::text[])`,
    [menuIds],
  )
  const optByMenu = {}
  for (const o of optRows) {
    if (!optByMenu[o.menu_id]) optByMenu[o.menu_id] = {}
    optByMenu[o.menu_id][o.option_key] = o
  }

  const items = []
  let total = 0

  for (const line of lines) {
    const menuId = line.menuId
    const qty = Math.trunc(Number(line.quantity))
    const optionIds = Array.isArray(line.optionIds)
      ? [...new Set(line.optionIds)].sort()
      : []
    const menuOpts = optByMenu[menuId] || {}
    let extra = 0
    const labels = []
    for (const key of optionIds) {
      const o = menuOpts[key]
      if (!o) {
        const e = new Error(`invalid_option:${key}`)
        e.code = 'VALIDATION'
        throw e
      }
      extra += Number(o.extra_price)
      labels.push(o.name)
    }
    const unitPrice = priceMap[menuId] + extra
    const lineTotal = unitPrice * qty
    total += lineTotal
    items.push({
      menuId,
      menuName: nameMap[menuId],
      quantity: qty,
      unitPrice,
      lineTotal,
      optionIds,
      optionLabels: labels,
    })
  }

  for (const mid of menuIds) {
    if (stockMap[mid] < needByMenu[mid]) {
      const e = new Error('insufficient_stock')
      e.code = 'STOCK'
      e.menuId = mid
      e.need = needByMenu[mid]
      e.have = stockMap[mid]
      throw e
    }
  }

  for (const mid of menuIds) {
    await client.query(
      'UPDATE menus SET stock = stock - $2 WHERE id = $1',
      [mid, needByMenu[mid]],
    )
  }

  const { rows: orderRows } = await client.query(
    `INSERT INTO orders (status, total) VALUES ('received', $1)
     RETURNING id, placed_at, status, total`,
    [total],
  )
  const order = orderRows[0]

  for (const it of items) {
    await client.query(
      `INSERT INTO order_items (order_id, menu_id, quantity, unit_price, line_total, option_ids)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
      [
        order.id,
        it.menuId,
        it.quantity,
        it.unitPrice,
        it.lineTotal,
        JSON.stringify(it.optionIds),
      ],
    )
  }

  return {
    id: order.id,
    placedAt: order.placed_at.toISOString(),
    status: order.status,
    total: order.total,
    lines: items.map((it) => ({
      menuId: it.menuId,
      name: it.menuName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineTotal: it.lineTotal,
      optionIds: it.optionIds,
      optionLabels: it.optionLabels,
    })),
  }
}
