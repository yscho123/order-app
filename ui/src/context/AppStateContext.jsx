/* Context 모듈에서 훅을 함께 export — Fast Refresh 예외 */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react'
import { MENU_ITEMS } from '../data/menu'

/** @typedef {'received' | 'preparing' | 'completed'} OrderStatus */

/**
 * @typedef {{
 *   id: string,
 *   placedAt: number,
 *   lines: { menuId: string, name: string, optionLabels: string[], quantity: number, unitPrice: number }[],
 *   total: number,
 *   status: OrderStatus,
 * }} StoredOrder
 */

const initialInventory = Object.fromEntries(
  MENU_ITEMS.map((m) => [m.id, 10]),
)

/** @type {{ orders: StoredOrder[], inventory: Record<string, number> }} */
const initialState = {
  orders: [],
  inventory: initialInventory,
}

function appReducer(state, action) {
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

const AppStateContext = createContext(null)

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const addOrder = useCallback((order) => {
    dispatch({ type: 'ADD_ORDER', payload: order })
  }, [])

  const setOrderStatus = useCallback((id, status) => {
    dispatch({ type: 'SET_ORDER_STATUS', id, status })
  }, [])

  const adjustStock = useCallback((menuId, delta) => {
    dispatch({ type: 'ADJUST_STOCK', menuId, delta })
  }, [])

  const value = useMemo(
    () => ({
      orders: state.orders,
      inventory: state.inventory,
      addOrder,
      setOrderStatus,
      adjustStock,
    }),
    [state.orders, state.inventory, addOrder, setOrderStatus, adjustStock],
  )

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) {
    throw new Error('useAppState는 AppStateProvider 안에서만 사용할 수 있습니다.')
  }
  return ctx
}
