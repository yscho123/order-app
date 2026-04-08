import { useMemo, useState } from 'react'
import { formatWon } from '../utils/format'

/**
 * @param {{ item: import('../data/menu').MenuItem, onAdd: (menuId: string, optionIds: string[]) => void }} props
 */
export default function MenuCard({ item, onAdd }) {
  const initialOpts = useMemo(
    () =>
      Object.fromEntries(item.options.map((o) => [o.id, false])),
    [item.options],
  )
  const [opts, setOpts] = useState(initialOpts)

  function toggleOption(optionId) {
    setOpts((prev) => ({ ...prev, [optionId]: !prev[optionId] }))
  }

  function handleAdd() {
    const selectedIds = item.options
      .filter((o) => opts[o.id])
      .map((o) => o.id)
    onAdd(item.id, selectedIds)
  }

  return (
    <article className="menu-card">
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
            alt={`${item.name} 사진`}
            className="menu-card__photo"
            loading="lazy"
          />
        ) : (
          <span className="menu-card__placeholder-x" aria-hidden="true">
            ×
          </span>
        )}
      </div>
      <h2 className="menu-card__title">{item.name}</h2>
      <p className="menu-card__price">{formatWon(item.price)}</p>
      <p className="menu-card__desc">{item.description}</p>
      <ul className="menu-card__options">
        {item.options.map((o) => (
          <li key={o.id}>
            <label className="menu-card__option-label">
              <input
                type="checkbox"
                checked={opts[o.id]}
                onChange={() => toggleOption(o.id)}
              />
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
        ))}
      </ul>
      <button type="button" className="btn btn--primary menu-card__add" onClick={handleAdd}>
        담기
      </button>
    </article>
  )
}
