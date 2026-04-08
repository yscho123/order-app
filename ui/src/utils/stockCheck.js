/**
 * @param {{ menuId: string, quantity: number }[]} lines
 * @param {string} menuId
 */
export function totalQtyInCartForMenu(lines, menuId) {
  return lines.reduce(
    (sum, l) => sum + (l.menuId === menuId ? l.quantity : 0),
    0,
  )
}

/**
 * @param {{ menuId: string, quantity: number }[]} lines
 * @param {Record<string, number>} inventory
 * @param {string} menuId
 */
export function canAddOneToCart(lines, inventory, menuId) {
  const inv = inventory[menuId] ?? 0
  if (inv <= 0) return false
  return totalQtyInCartForMenu(lines, menuId) + 1 <= inv
}

/**
 * @param {{ menuId: string, quantity: number }[]} lines
 * @param {Record<string, number>} inventory
 * @returns {{ ok: true } | { ok: false, menuId: string, need: number, have: number }}
 */
export function validateOrderAgainstStock(lines, inventory) {
  /** @type {Record<string, number>} */
  const need = {}
  for (const l of lines) {
    if (!l.menuId) continue
    need[l.menuId] = (need[l.menuId] ?? 0) + l.quantity
  }
  for (const menuId of Object.keys(need)) {
    const have = inventory[menuId] ?? 0
    const n = need[menuId]
    if (n > have) {
      return { ok: false, menuId, need: n, have }
    }
  }
  return { ok: true }
}
