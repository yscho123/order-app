import { describe, it, expect, vi, afterEach } from 'vitest'
import { newOrderId } from './newId.js'

describe('newOrderId', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('uses crypto.randomUUID when available', () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue('uuid-mock')
    expect(newOrderId()).toBe('uuid-mock')
  })

  it('falls back when randomUUID is missing', () => {
    vi.stubGlobal('crypto', {})
    const id = newOrderId()
    expect(id.startsWith('ord_')).toBe(true)
    expect(id.length).toBeGreaterThan(8)
  })
})
