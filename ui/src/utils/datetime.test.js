import { describe, it, expect } from 'vitest'
import { formatOrderPlacedAt } from './datetime.js'

describe('formatOrderPlacedAt', () => {
  it('pads hour and minute', () => {
    const ts = new Date(2025, 6, 31, 9, 5).getTime()
    expect(formatOrderPlacedAt(ts)).toBe('7월 31일 09:05')
  })
})
