import { describe, it, expect } from 'vitest'
import { formatWon } from './format.js'

describe('formatWon', () => {
  it('formats amount and won suffix', () => {
    const s = formatWon(12500)
    expect(s).toContain('원')
    expect(s.replace(/\D/g, '')).toContain('12500')
  })
})
