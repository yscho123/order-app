import { describe, it, expect, beforeEach } from 'vitest'
import {
  PERSIST_STORAGE_KEY,
  loadPersistedState,
  savePersistedState,
} from './persistOrderInventory.js'

const MENU_IDS = ['americano-ice', 'americano-hot', 'cafe-latte']

const validOrder = {
  id: 'x1',
  placedAt: 1000,
  lines: [
    {
      menuId: 'americano-ice',
      name: '아메리카노(ICE)',
      optionLabels: [],
      quantity: 1,
      unitPrice: 4000,
    },
  ],
  total: 4000,
  status: 'received',
}

describe('persistOrderInventory', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('save and load roundtrip', () => {
    savePersistedState({
      orders: [validOrder],
      inventory: { 'americano-ice': 7, 'americano-hot': 10, 'cafe-latte': 3 },
    })
    const loaded = loadPersistedState(MENU_IDS)
    expect(loaded.orders).toHaveLength(1)
    expect(loaded.inventory['americano-ice']).toBe(7)
    expect(loaded.inventory['cafe-latte']).toBe(3)
  })

  it('returns null for empty storage', () => {
    expect(loadPersistedState(MENU_IDS)).toBeNull()
  })

  it('merges unknown menu keys with defaults', () => {
    localStorage.setItem(
      PERSIST_STORAGE_KEY,
      JSON.stringify({ orders: [], inventory: {} }),
    )
    const loaded = loadPersistedState(MENU_IDS)
    expect(loaded.inventory['americano-ice']).toBe(10)
  })
})
