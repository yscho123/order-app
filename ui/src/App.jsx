import { Routes, Route, Outlet } from 'react-router-dom'
import AppHeader from './components/AppHeader'
import OrderPage from './pages/OrderPage'
import AdminPage from './pages/AdminPage'
import './App.css'

function Layout() {
  return (
    <div className="app-shell">
      <AppHeader />
      <Outlet />
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
