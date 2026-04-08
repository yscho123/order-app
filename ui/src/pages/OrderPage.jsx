import { useCallback, useMemo, useState } from 'react'
import { useAppState } from '../context/AppStateContext.jsx'
import { MENU_ITEMS, getMenuItemById } from '../data/menu'
import MenuCard from '../components/MenuCard'
import CartPanel from '../components/CartPanel'

/** 동일 메뉴 + 동일 옵션 조합은 한 줄로 합치고 수량만 증가 */
function lineKey(menuId, optionIds) {
  const sorted = [...new Set(optionIds)].sort().join(',')
  return `${menuId}::${sorted}`
}

export default function OrderPage() {
  const { addOrder } = useAppState()
  const [lines, setLines] = useState([])
  const [orderMessage, setOrderMessage] = useState(null)

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    [lines],
  )

  const addToCart = useCallback((menuId, optionIds) => {
    const item = getMenuItemById(menuId)
    if (!item) return

    setOrderMessage(null)
    const key = lineKey(menuId, optionIds)
    const selectedDefs = item.options.filter((o) => optionIds.includes(o.id))
    const unitPrice =
      item.price +
      selectedDefs.reduce((sum, o) => sum + o.extraPrice, 0)
    const optionLabels = selectedDefs.map((o) => o.name)

    setLines((prev) => {
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
          quantity: 1,
          unitPrice,
        },
      ]
    })
  }, [])

  function placeOrder() {
    if (lines.length === 0) return
    const orderLines = lines.map((l) => ({
      menuId: l.menuId,
      name: l.name,
      optionLabels: l.optionLabels,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
    }))
    addOrder({
      id: crypto.randomUUID(),
      placedAt: Date.now(),
      lines: orderLines,
      total,
      status: 'received',
    })
    setOrderMessage('주문이 접수되었습니다. 관리자 화면에서 확인할 수 있습니다.')
    setLines([])
  }

  return (
    <div className="order-page">
      <main className="order-page__menu">
        <div className="menu-grid">
          {MENU_ITEMS.map((item) => (
            <MenuCard key={item.id} item={item} onAdd={addToCart} />
          ))}
        </div>
      </main>
      <CartPanel
        lines={lines}
        total={total}
        onPlaceOrder={placeOrder}
        message={orderMessage}
      />
    </div>
  )
}
