/**
 * @typedef {'received' | 'preparing' | 'completed'} OrderStatus
 * @typedef {{
 *   id: string,
 *   placedAt: number,
 *   lines: { menuId: string, name: string, optionLabels: string[], quantity: number, unitPrice: number }[],
 *   total: number,
 *   status: OrderStatus,
 * }} StoredOrder
 */

/** @param {string[]} menuIds */
export function buildDefaultInventory(menuIds) {
  return Object.fromEntries(menuIds.map((id) => [id, 10]))
}

/**
 * @param {string[]} menuIds
 * @returns {{ orders: StoredOrder[], inventory: Record<string, number> }}
 */
export function getInitialAppState(menuIds) {
  return {
    orders: [],
    inventory: buildDefaultInventory(menuIds),
  }
}

/**
 * @param {{ orders: StoredOrder[], inventory: Record<string, number> }} state
 * @param {{ type: string, payload?: *, id?: string, status?: OrderStatus, menuId?: string, delta?: number }} action
 */
export function orderInventoryReducer(state, action) {
  switch (action.type) {
    case 'ADD_ORDER':
      return { ...state, orders: [action.payload, ...state.orders] }
    case 'SET_ORDER_STATUS': {
      const order = state.orders.find((o) => o.id === action.id)
      if (!order) return state

      const wasCompleted = order.status === 'completed'
      const becomesCompleted =
        action.status === 'completed' && !wasCompleted

      let nextInventory = state.inventory
      if (becomesCompleted) {
        nextInventory = { ...state.inventory }
        for (const line of order.lines) {
          const mid = line.menuId
          if (!mid) continue
          const cur = nextInventory[mid] ?? 0
          nextInventory[mid] = Math.max(0, cur - line.quantity)
        }
      }

      return {
        ...state,
        inventory: nextInventory,
        orders: state.orders.map((o) =>
          o.id === action.id ? { ...o, status: action.status } : o,
        ),
      }
    }
    case 'ADJUST_STOCK': {
      const cur = state.inventory[action.menuId] ?? 0
      const next = Math.max(0, cur + action.delta)
      return {
        ...state,
        inventory: { ...state.inventory, [action.menuId]: next },
      }
    }
    default:
      return state
  }
}
