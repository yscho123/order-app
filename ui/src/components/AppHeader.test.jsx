import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AppHeader from './AppHeader.jsx'

describe('AppHeader', () => {
  it('renders brand and nav', () => {
    render(
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>,
    )
    expect(screen.getByText('COZY')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '주문하기' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '관리자' })).toBeInTheDocument()
  })
})
