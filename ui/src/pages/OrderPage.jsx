import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  findMenuById,
  useAppState,
} from '../context/AppStateContext.jsx'
import MenuCard from '../components/MenuCard'
import CartPanel from '../components/CartPanel'
import {
  canAddOneToCart,
  validateOrderAgainstStock,
} from '../utils/stockCheck.js'

/** 동일 메뉴 + 동일 옵션 조합은 한 줄로 합치고 수량만 증가 */
function lineKey(menuId, optionIds) {
  const sorted = [...new Set(optionIds)].sort().join(',')
  return `${menuId}::${sorted}`
}

const STOCK_MSG_MS = 4000

export default function OrderPage() {
  const {
    menus,
    inventory,
    ready,
    loadError,
    bootstrap,
    createOrder,
  } = useAppState()
  const [lines, setLines] = useState([])
  const [orderMessage, setOrderMessage] = useState(null)
  const [stockMessage, setStockMessage] = useState(null)
  const [placing, setPlacing] = useState(false)
  const stockTimerRef = useRef(null)

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [lines],
  )

  function flashStockMessage(text) {
    setStockMessage(text)
    if (stockTimerRef.current) clearTimeout(stockTimerRef.current)
    stockTimerRef.current = setTimeout(() => {
      setStockMessage(null)
      stockTimerRef.current = null
    }, STOCK_MSG_MS)
  }

  useEffect(() => {
    return () => {
      if (stockTimerRef.current) clearTimeout(stockTimerRef.current)
    }
  }, [])

  const addToCart = useCallback(
    (menuId, optionIds) => {
      const item = findMenuById(menus, menuId)
      if (!item) return

      if (!canAddOneToCart(lines, inventory, menuId)) {
        flashStockMessage('재고가 부족하여 더 담을 수 없습니다.')
        return
      }

      setOrderMessage(null)
      const key = lineKey(menuId, optionIds)
      const selectedDefs = item.options.filter((o) => optionIds.includes(o.id))
      const unitPrice =
        item.price +
        selectedDefs.reduce((sum, o) => sum + o.extraPrice, 0)
      const optionLabels = selectedDefs.map((o) => o.name)

      setLines((prev) => {
        if (!canAddOneToCart(prev, inventory, menuId)) {
          return prev
        }
        const i = prev.findIndex((l) => l.key === key)
        if (i >= 0) {
          const next = [...prev]
          next[i] = { ...next[i], quantity: next[i].quantity + 1 }
          return next
        }
        return [
          ...prev,
          {
            key,
            menuId,
            name: item.name,
            optionLabels,
            optionIds: [...optionIds],
            quantity: 1,
            unitPrice,
          },
        ]
      })
    },
    [lines, inventory, menus],
  )

  async function placeOrder() {
    if (lines.length === 0 || placing) return
    const check = validateOrderAgainstStock(lines, inventory)
    if (!check.ok) {
      const name =
        findMenuById(menus, check.menuId)?.name ?? check.menuId
      flashStockMessage(
        `재고가 부족합니다. (${name}: 필요 ${check.need}개, 보유 ${check.have}개)`,
      )
      return
    }

    setPlacing(true)
    setOrderMessage(null)
    try {
      await createOrder(
        lines.map((l) => ({
          menuId: l.menuId,
          optionIds: l.optionIds ?? [],
          quantity: l.quantity,
        })),
      )
      setOrderMessage(
        '주문이 접수되었습니다. 관리자 화면에서 확인할 수 있습니다.',
      )
      setLines([])
    } catch (e) {
      if (e.status === 409 && e.body?.error === 'insufficient_stock') {
        const mid = e.body.menuId
        const name = findMenuById(menus, mid)?.name ?? mid
        flashStockMessage(
          `재고가 부족합니다. (${name}: 필요 ${e.body.need}개, 보유 ${e.body.have}개)`,
        )
      } else {
        flashStockMessage(
          e.message || '주문 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        )
      }
    } finally {
      setPlacing(false)
    }
  }

  if (!ready) {
    return (
      <div className="order-page">
        <p className="order-page__loading" role="status">
          메뉴를 불러오는 중…
        </p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="order-page">
        <div className="order-page__error" role="alert">
          <p>{loadError}</p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void bootstrap()}
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  if (menus.length === 0) {
    return (
      <div className="order-page">
        <p className="order-page__empty" role="status">
          등록된 메뉴가 없습니다. 서버 DB 시드(migrate/seed)를 확인해 주세요.
        </p>
      </div>
    )
  }

  return (
    <div className="order-page">
      <div
        className="order-page__a11y"
        aria-live="polite"
        aria-atomic="true"
      >
        {stockMessage ? (
          <p className="order-page__stock-alert">{stockMessage}</p>
        ) : null}
      </div>
      <div className="order-page__menu">
        <div className="menu-grid">
          {menus.map((item) => (
            <MenuCard
              key={item.id}
              item={item}
              stockQty={inventory[item.id] ?? 0}
              onAdd={addToCart}
            />
          ))}
        </div>
      </div>
      <CartPanel
        lines={lines}
        total={total}
        onPlaceOrder={() => void placeOrder()}
        message={orderMessage}
        orderDisabled={placing}
      />
    </div>
  )
}
