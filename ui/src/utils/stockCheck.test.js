import { describe, it, expect } from 'vitest'
import {
  totalQtyInCartForMenu,
  canAddOneToCart,
  validateOrderAgainstStock,
} from './stockCheck.js'

const lines = [
  {
    key: '1',
    menuId: 'ice',
    name: 'ICE',
    optionLabels: [],
    quantity: 2,
    unitPrice: 4000,
  },
  {
    key: '2',
    menuId: 'ice',
    name: 'ICE',
    optionLabels: ['샷 추가'],
    quantity: 1,
    unitPrice: 4500,
  },
]

describe('stockCheck', () => {
  it('totalQtyInCartForMenu sums same menuId', () => {
    expect(totalQtyInCartForMenu(lines, 'ice')).toBe(3)
    expect(totalQtyInCartForMenu(lines, 'hot')).toBe(0)
  })

  it('canAddOneToCart respects inventory', () => {
    expect(canAddOneToCart(lines, { ice: 3 }, 'ice')).toBe(false)
    expect(canAddOneToCart(lines, { ice: 4 }, 'ice')).toBe(true)
    expect(canAddOneToCart([], { ice: 0 }, 'ice')).toBe(false)
  })

  it('validateOrderAgainstStock', () => {
    expect(validateOrderAgainstStock(lines, { ice: 10 })).toEqual({ ok: true })
    const bad = validateOrderAgainstStock(lines, { ice: 2 })
    expect(bad.ok).toBe(false)
    if (!bad.ok) {
      expect(bad.menuId).toBe('ice')
      expect(bad.need).toBe(3)
      expect(bad.have).toBe(2)
    }
  })
})
