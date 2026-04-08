import { NavLink } from 'react-router-dom'

export default function AppHeader() {
  return (
    <header className="app-header">
      <span className="app-logo">COZY</span>
      <nav className="app-nav" aria-label="주요 메뉴">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `nav-tab${isActive ? ' nav-tab--active' : ''}`
          }
        >
          주문하기
        </NavLink>
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `nav-tab${isActive ? ' nav-tab--active' : ''}`
          }
        >
          관리자
        </NavLink>
      </nav>
    </header>
  )
}
