import { describe, it, expect } from 'vitest'
import {
  getInitialAppState,
  orderInventoryReducer,
  buildDefaultInventory,
} from './orderInventoryReducer.js'

const MENU = ['americano-ice', 'cafe-latte']

const sampleOrder = {
  id: 'o1',
  placedAt: 1,
  lines: [
    {
      menuId: 'americano-ice',
      name: '아메리카노(ICE)',
      optionLabels: [],
      quantity: 2,
      unitPrice: 4000,
    },
  ],
  total: 8000,
  status: 'received',
}

describe('orderInventoryReducer', () => {
  it('ADD_ORDER prepends order', () => {
    const s0 = getInitialAppState(MENU)
    const s1 = orderInventoryReducer(s0, {
      type: 'ADD_ORDER',
      payload: sampleOrder,
    })
    expect(s1.orders).toHaveLength(1)
    expect(s1.orders[0].id).toBe('o1')
  })

  it('SET_ORDER_STATUS to completed deducts stock once', () => {
    let state = getInitialAppState(MENU)
    state = orderInventoryReducer(state, {
      type: 'ADD_ORDER',
      payload: sampleOrder,
    })
    expect(state.inventory['americano-ice']).toBe(10)

    state = orderInventoryReducer(state, {
      type: 'SET_ORDER_STATUS',
      id: 'o1',
      status: 'completed',
    })
    expect(state.inventory['americano-ice']).toBe(8)
    expect(state.orders[0].status).toBe('completed')

    state = orderInventoryReducer(state, {
      type: 'SET_ORDER_STATUS',
      id: 'o1',
      status: 'completed',
    })
    expect(state.inventory['americano-ice']).toBe(8)
  })

  it('ADJUST_STOCK clamps at zero', () => {
    let state = getInitialAppState(MENU)
    state = orderInventoryReducer(state, {
      type: 'ADJUST_STOCK',
      menuId: 'americano-ice',
      delta: -15,
    })
    expect(state.inventory['americano-ice']).toBe(0)
  })
})

describe('buildDefaultInventory', () => {
  it('sets 10 per id', () => {
    const inv = buildDefaultInventory(['a', 'b'])
    expect(inv.a).toBe(10)
    expect(inv.b).toBe(10)
  })
})
