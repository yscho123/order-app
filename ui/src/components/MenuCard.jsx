import { useId, useMemo, useState } from 'react'
import { formatWon } from '../utils/format'

/**
 * @param {{
 *   item: import('../data/menu').MenuItem,
 *   stockQty: number,
 *   onAdd: (menuId: string, optionIds: string[]) => void,
 * }} props
 */
export default function MenuCard({ item, stockQty, onAdd }) {
  const formId = useId()
  const initialOpts = useMemo(
    () =>
      Object.fromEntries(item.options.map((o) => [o.id, false])),
    [item.options],
  )
  const [opts, setOpts] = useState(initialOpts)

  const outOfStock = stockQty <= 0

  function toggleOption(optionId) {
    setOpts((prev) => ({ ...prev, [optionId]: !prev[optionId] }))
  }

  function handleAdd() {
    if (outOfStock) return
    const selectedIds = item.options
      .filter((o) => opts[o.id])
      .map((o) => o.id)
    onAdd(item.id, selectedIds)
  }

  return (
    <article className="menu-card" aria-labelledby={`${formId}-title`}>
      <div
        className={
          item.image
            ? 'menu-card__image menu-card__image--photo'
            : 'menu-card__image'
        }
      >
        {item.image ? (
          <img
            src={item.image}
            alt=""
            className="menu-card__photo"
            loading="lazy"
          />
        ) : (
          <span className="menu-card__placeholder-x" aria-hidden="true">
            ×
          </span>
        )}
      </div>
      <h2 className="menu-card__title" id={`${formId}-title`}>
        {item.name}
      </h2>
      <p className="menu-card__price">{formatWon(item.price)}</p>
      <p className="menu-card__desc">{item.description}</p>
      <p className="menu-card__stock" aria-live="polite">
        재고 {stockQty}개
        {outOfStock ? (
          <span className="menu-card__stock--out"> (품절)</span>
        ) : null}
      </p>
      <ul className="menu-card__options">
        {item.options.map((o) => {
          const optId = `${formId}-opt-${o.id}`
          return (
            <li key={o.id}>
              <input
                id={optId}
                className="menu-card__checkbox"
                type="checkbox"
                checked={opts[o.id]}
                onChange={() => toggleOption(o.id)}
                disabled={outOfStock}
              />
              <label className="menu-card__option-label" htmlFor={optId}>
                <span>
                  {o.name}{' '}
                  (
                  {o.extraPrice === 0
                    ? '+0원'
                    : `+${o.extraPrice.toLocaleString('ko-KR')}원`}
                  )
                </span>
              </label>
            </li>
          )
        })}
      </ul>
      <button
        type="button"
        className="btn btn--primary menu-card__add"
        onClick={handleAdd}
        disabled={outOfStock}
        aria-label={
          outOfStock
            ? `${item.name}, 품절로 담을 수 없음`
            : `${item.name} 장바구니에 담기`
        }
      >
        담기
      </button>
    </article>
  )
}
