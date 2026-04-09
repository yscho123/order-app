import { useMemo, useState } from 'react'
import { useAppState } from '../context/AppStateContext.jsx'
import { orderStatusLabel } from '../constants/orderStatus.js'
import { formatOrderPlacedAt } from '../utils/datetime'
import { formatWon } from '../utils/format'

const ORDERS_PAGE_SIZE = 10

function summarizeLines(lines) {
  return lines
    .map((l) => {
      const opt =
        l.optionLabels?.length > 0
          ? ` (${l.optionLabels.join(', ')})`
          : ''
      return `${l.name}${opt} x ${l.quantity}`
    })
    .join(', ')
}

function stockBadgeClass(qty) {
  if (qty <= 0) return 'stock-badge stock-badge--out'
  if (qty < 5) return 'stock-badge stock-badge--warn'
  return 'stock-badge stock-badge--ok'
}

function stockBadgeText(qty) {
  if (qty <= 0) return '품절'
  if (qty < 5) return '주의'
  return '정상'
}

export default function AdminPage() {
  const {
    orders,
    menus,
    inventory,
    adjustStock,
    setOrderStatus,
    ready,
    loadError,
    bootstrap,
  } = useAppState()
  const [page, setPage] = useState(0)

  const totalCount = orders.length
  const receivedCount = orders.filter((o) => o.status === 'received').length
  const preparingCount = orders.filter((o) => o.status === 'preparing').length
  const completedCount = orders.filter((o) => o.status === 'completed').length

  const totalPages = Math.max(1, Math.ceil(orders.length / ORDERS_PAGE_SIZE))
  const lastPageIdx = totalPages - 1
  const pageIdx = Math.min(page, lastPageIdx)

  const pagedOrders = useMemo(
    () =>
      orders.slice(
        pageIdx * ORDERS_PAGE_SIZE,
        (pageIdx + 1) * ORDERS_PAGE_SIZE,
      ),
    [orders, pageIdx],
  )

  return (
    <div className="admin-page">
      <section className="admin-section" aria-labelledby="admin-dash-heading">
        <h2 id="admin-dash-heading" className="admin-section__title">
          관리자 대시보드
        </h2>
        <p className="admin-dashboard__stats">
          <span>
            총 주문 <strong>{totalCount}</strong>
          </span>
          <span className="admin-dashboard__sep" aria-hidden="true">
            /
          </span>
          <span>
            주문 접수 <strong>{receivedCount}</strong>
          </span>
          <span className="admin-dashboard__sep" aria-hidden="true">
            /
          </span>
          <span>
            제조 중 <strong>{preparingCount}</strong>
          </span>
          <span className="admin-dashboard__sep" aria-hidden="true">
            /
          </span>
          <span>
            제조 완료 <strong>{completedCount}</strong>
          </span>
        </p>
      </section>

      <section className="admin-section" aria-labelledby="inventory-heading">
        <h2 id="inventory-heading" className="admin-section__title">
          재고 현황
        </h2>
        {!ready ? (
          <p role="status">메뉴를 불러오는 중…</p>
        ) : loadError ? (
          <div role="alert">
            <p>{loadError}</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => void bootstrap()}
            >
              다시 시도
            </button>
          </div>
        ) : menus.length === 0 ? (
          <p role="status">등록된 메뉴가 없습니다.</p>
        ) : (
          <div className="admin-inventory">
            {menus.map((item) => {
              const qty = inventory[item.id] ?? 0
              return (
                <article key={item.id} className="admin-inventory__card">
                  <h3 className="admin-inventory__name">{item.name}</h3>
                  <p className="admin-inventory__qty">{qty}개</p>
                  <p className={stockBadgeClass(qty)}>{stockBadgeText(qty)}</p>
                  <div className="admin-inventory__controls">
                    <button
                      type="button"
                      className="btn btn--square btn--primary"
                      aria-label={`${item.name} 재고 1 증가`}
                      onClick={() => void adjustStock(item.id, 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="btn btn--square btn--primary"
                      aria-label={`${item.name} 재고 1 감소`}
                      disabled={qty <= 0}
                      onClick={() => void adjustStock(item.id, -1)}
                    >
                      −
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>

      <section className="admin-section" aria-labelledby="orders-heading">
        <h2 id="orders-heading" className="admin-section__title">
          주문 현황
        </h2>
        {orders.length === 0 ? (
          <p className="admin-orders__empty">접수된 주문이 없습니다.</p>
        ) : (
          <>
            <ul className="admin-orders">
              {pagedOrders.map((order) => (
                <li key={order.id} className="admin-order-row">
                  <div className="admin-order-row__main">
                    <time
                      className="admin-order-row__time"
                      dateTime={new Date(order.placedAt).toISOString()}
                    >
                      {formatOrderPlacedAt(order.placedAt)}
                    </time>
                    <p className="admin-order-row__menu">
                      {summarizeLines(order.lines)}
                    </p>
                    <p className="admin-order-row__price">
                      {formatWon(order.total)}
                    </p>
                    <p className="admin-order-row__status">
                      {orderStatusLabel[order.status]}
                    </p>
                  </div>
                  <div className="admin-order-row__action">
                    {order.status === 'received' ? (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => setOrderStatus(order.id, 'preparing')}
                      >
                        제조 시작
                      </button>
                    ) : null}
                    {order.status === 'preparing' ? (
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() => setOrderStatus(order.id, 'completed')}
                      >
                        제조 완료
                      </button>
                    ) : null}
                    {order.status === 'completed' ? (
                      <span className="admin-order-row__done">처리 완료</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
            {totalPages > 1 ? (
              <nav
                className="admin-pagination"
                aria-label="주문 목록 페이지"
              >
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={pageIdx <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  이전
                </button>
                <span className="admin-pagination__info">
                  {pageIdx + 1} / {totalPages} 페이지 (총 {orders.length}건)
                </span>
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={pageIdx >= lastPageIdx}
                  onClick={() =>
                    setPage((p) => Math.min(lastPageIdx, p + 1))
                  }
                >
                  다음
                </button>
              </nav>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}
