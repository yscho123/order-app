/* Context 모듈에서 훅을 함께 export — Fast Refresh 예외 */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react'
import { MENU_ITEMS } from '../data/menu'
import {
  getInitialAppState,
  orderInventoryReducer,
} from '../state/orderInventoryReducer.js'
import {
  loadPersistedState,
  savePersistedState,
} from '../state/persistOrderInventory.js'

const MENU_IDS = MENU_ITEMS.map((m) => m.id)

function readInitialState() {
  const loaded = loadPersistedState(MENU_IDS)
  if (loaded) return loaded
  return getInitialAppState(MENU_IDS)
}

const AppStateContext = createContext(null)

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(
    orderInventoryReducer,
    undefined,
    readInitialState,
  )

  useEffect(() => {
    savePersistedState(state)
  }, [state])

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
