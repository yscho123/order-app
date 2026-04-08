import { formatWon } from '../utils/format'

export default function CartPanel({ lines, total, onPlaceOrder, message }) {
  return (
    <section className="cart-panel" aria-labelledby="cart-heading">
      <h2 id="cart-heading" className="cart-panel__title">
        장바구니
      </h2>

      <div className="cart-panel__columns">
        <div className="cart-panel__orders">
          <h3 className="cart-panel__subheading">주문 내역</h3>
          {lines.length === 0 ? (
            <p className="cart-panel__empty">담은 메뉴가 없습니다.</p>
          ) : (
            <ul className="cart-panel__list">
              {lines.map((line) => {
                const lineTotal = line.unitPrice * line.quantity
                return (
                  <li key={line.key} className="cart-panel__row">
                    <div className="cart-panel__line-desc">
                      <span className="cart-panel__line-name">{line.name}</span>
                      {line.optionLabels.length > 0 ? (
                        <span className="cart-panel__line-options">
                          {' '}
                          ({line.optionLabels.join(', ')})
                        </span>
                      ) : null}
                      <span className="cart-panel__qty"> X {line.quantity}</span>
                    </div>
                    <div className="cart-panel__line-money">
                      {line.quantity > 1 ? (
                        <span className="cart-panel__line-calc">
                          {formatWon(line.unitPrice)} × {line.quantity}
                        </span>
                      ) : null}
                      <span className="cart-panel__line-total">
                        {formatWon(lineTotal)}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <aside className="cart-panel__checkout" aria-label="결제 요약">
          <p className="cart-panel__total">
            총 금액
            <strong className="cart-panel__total-amount">{formatWon(total)}</strong>
          </p>
          <button
            type="button"
            className="btn btn--primary cart-panel__order"
            onClick={onPlaceOrder}
            disabled={lines.length === 0}
          >
            주문하기
          </button>
        </aside>
      </div>

      {message ? (
        <p className="cart-panel__message" role="status">
          {message}
        </p>
      ) : null}
    </section>
  )
}
