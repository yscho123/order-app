import { Routes, Route, Outlet } from 'react-router-dom'
import AppHeader from './components/AppHeader'
import OrderPage from './pages/OrderPage'
import AdminPage from './pages/AdminPage'
import './App.css'

function Layout() {
  return (
    <div className="app-shell">
      <a href="#app-main" className="skip-link">
        본문으로 건너뛰기
      </a>
      <AppHeader />
      <main id="app-main" className="app-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<OrderPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  )
}
