/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiUrl } from '../config/api.js'
import { attachMenuImages } from '../data/menuImages.js'

/**
 * @typedef {{ id: string, name: string, extraPrice: number }} MenuOption
 * @typedef {{
 *   id: string,
 *   name: string,
 *   price: number,
 *   description: string,
 *   stockQty: number,
 *   imageUrl: string | null,
 *   image: string | null,
 *   options: MenuOption[],
 * }} MenuItem
 */

/**
 * @typedef {{
 *   id: string,
 *   placedAt: number,
 *   lines: {
 *     menuId: string,
 *     name: string,
 *     optionLabels: string[],
 *     optionIds: string[],
 *     quantity: number,
 *     unitPrice: number,
 *   }[],
 *   total: number,
 *   status: 'received' | 'preparing' | 'completed',
 * }} StoredOrder
 */

function normalizeOrder(raw) {
  return {
    id: raw.id,
    placedAt: Date.parse(raw.placedAt),
    status: raw.status,
    total: raw.total,
    lines: (raw.lines || []).map((l) => ({
      menuId: l.menuId,
      name: l.name,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      optionLabels: l.optionLabels ?? [],
      optionIds: l.optionIds ?? [],
    })),
  }
}

/** Vite `/api` 프록시 대상(기본 3000)이 꺼져 있으면 502 Bad Gateway가 옵니다. */
const UPSTREAM_HINT =
  '백엔드 API가 꺼져 있거나 응답하지 않습니다. `server` 폴더에서 `npm run dev`(또는 `npm start`)로 포트 3000 서버를 실행한 뒤 새로고침하세요.'

async function fetchJson(url, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (options.body != null && headers['Content-Type'] == null) {
    headers['Content-Type'] = 'application/json'
  }
  const r = await fetch(apiUrl(url), { ...options, headers })
  const text = await r.text()
  let data
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  if (!r.ok) {
    const upstream =
      r.status === 502 ||
      r.status === 503 ||
      r.status === 504 ||
      /bad gateway|gateway timeout|service unavailable/i.test(
        String(r.statusText),
      )
    const message = upstream
      ? UPSTREAM_HINT
      : data?.message || r.statusText || 'request_failed'
    const err = new Error(message)
    err.status = r.status
    err.body = data
    throw err
  }
  return data
}

const AppStateContext = createContext(null)

export function AppStateProvider({ children }) {
  const [menus, setMenus] = useState(/** @type {MenuItem[]} */ ([]))
  const [orders, setOrders] = useState(/** @type {StoredOrder[]} */ ([]))
  const [loadError, setLoadError] = useState(/** @type {string | null} */ (null))
  const [ready, setReady] = useState(false)

  const refreshMenus = useCallback(async () => {
    const list = await fetchJson('/api/menus')
    setMenus(attachMenuImages(list))
  }, [])

  const refreshOrders = useCallback(async () => {
    const list = await fetchJson('/api/orders')
    setOrders(list.map(normalizeOrder))
  }, [])

  const bootstrap = useCallback(async () => {
    setLoadError(null)
    try {
      await Promise.all([refreshMenus(), refreshOrders()])
    } catch (e) {
      const net =
        e?.name === 'TypeError' &&
        /failed to fetch|networkerror|load failed/i.test(String(e.message))
      setLoadError(
        net
          ? UPSTREAM_HINT
          : e.message ||
              '서버에 연결할 수 없습니다. API 서버가 켜져 있는지 확인하세요.',
      )
    } finally {
      setReady(true)
    }
  }, [refreshMenus, refreshOrders])

  useEffect(() => {
    void bootstrap()
  }, [bootstrap])

  const inventory = useMemo(
    () =>
      Object.fromEntries(
        menus.map((m) => {
          const n = Number(m.stockQty)
          return [m.id, Number.isFinite(n) ? n : 0]
        }),
      ),
    [menus],
  )

  const createOrder = useCallback(
    async (linesPayload) => {
      const created = await fetchJson('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ lines: linesPayload }),
      })
      await Promise.all([refreshMenus(), refreshOrders()])
      return normalizeOrder(created)
    },
    [refreshMenus, refreshOrders],
  )

  const setOrderStatus = useCallback(
    async (id, status) => {
      await fetchJson(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await refreshOrders()
    },
    [refreshOrders],
  )

  const adjustStock = useCallback(
    async (menuId, delta) => {
      await fetchJson(`/api/menus/${encodeURIComponent(menuId)}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ delta }),
      })
      await refreshMenus()
    },
    [refreshMenus],
  )

  const value = useMemo(
    () => ({
      menus,
      orders,
      inventory,
      ready,
      loadError,
      refreshMenus,
      refreshOrders,
      bootstrap,
      createOrder,
      setOrderStatus,
      adjustStock,
    }),
    [
      menus,
      orders,
      inventory,
      ready,
      loadError,
      refreshMenus,
      refreshOrders,
      bootstrap,
      createOrder,
      setOrderStatus,
      adjustStock,
    ],
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

/** @param {MenuItem[]} menus @param {string} id */
export function findMenuById(menus, id) {
  return menus.find((m) => m.id === id)
}
