import { buildDefaultInventory } from './orderInventoryReducer.js'

export const PERSIST_STORAGE_KEY = 'cozy-order-app-state-v1'

function isValidOrder(o) {
  if (
    !o ||
    typeof o !== 'object' ||
    typeof o.id !== 'string' ||
    typeof o.placedAt !== 'number' ||
    !Array.isArray(o.lines) ||
    typeof o.total !== 'number' ||
    !['received', 'preparing', 'completed'].includes(o.status)
  ) {
    return false
  }
  return o.lines.every((l) => {
    if (
      !l ||
      typeof l.menuId !== 'string' ||
      typeof l.quantity !== 'number' ||
      l.quantity < 1 ||
      typeof l.name !== 'string' ||
      typeof l.unitPrice !== 'number'
    ) {
      return false
    }
    if (l.optionLabels != null && !Array.isArray(l.optionLabels)) {
      return false
    }
    return true
  })
}

/**
 * @param {string[]} menuIds
 * @returns {{ orders: import('./orderInventoryReducer.js').StoredOrder[], inventory: Record<string, number> } | null}
 */
export function loadPersistedState(menuIds) {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(PERSIST_STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data || typeof data !== 'object') return null

    const orders = Array.isArray(data.orders)
      ? data.orders.filter(isValidOrder)
      : []

    const baseInv = buildDefaultInventory(menuIds)
    const merged = { ...baseInv }
    if (data.inventory && typeof data.inventory === 'object') {
      for (const id of menuIds) {
        const v = data.inventory[id]
        if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
          merged[id] = Math.floor(v)
        }
      }
    }

    return { orders, inventory: merged }
  } catch {
    return null
  }
}

/**
 * @param {{ orders: unknown[], inventory: Record<string, number> }} state
 */
export function savePersistedState(state) {
  if (typeof localStorage === 'undefined') return
  try {
    const payload = JSON.stringify({
      orders: state.orders,
      inventory: state.inventory,
    })
    localStorage.setItem(PERSIST_STORAGE_KEY, payload)
  } catch {
    /* quota / private mode */
  }
}
