import { useCallback, useMemo, useState } from 'react'
import { MENU_ITEMS, getMenuItemById } from '../data/menu'
import MenuCard from '../components/MenuCard'
import CartPanel from '../components/CartPanel'

/** 동일 메뉴 + 동일 옵션 조합은 한 줄로 합치고 수량만 증가 */
function lineKey(menuId, optionIds) {
  const sorted = [...new Set(optionIds)].sort().join(',')
  return `${menuId}::${sorted}`
}

export default function OrderPage() {
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
    // 백엔드 연동 전: 로컬 피드백만
    setOrderMessage('주문이 접수되었습니다. (데모 — 서버 연동 전)')
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
