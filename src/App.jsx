import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import AppIcon from './components/AppIcon'
import Wordmark from './components/Wordmark'
import AddItem from './pages/AddItem'
import Inventory from './pages/Inventory'
import Dashboard from './pages/Dashboard'
import EditItem from './pages/EditItem'
import { PALETTE } from './lib/theme'
import { formatShortDate } from './lib/format'

function BrandStrip() {
  return (
    <div style={{
      padding: '14px 18px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AppIcon size={26} radius={7}/>
        <Wordmark size={16}/>
      </div>
      <span style={{ fontSize: 11, color: PALETTE.ink3, fontVariantNumeric: 'tabular-nums' }}>
        {formatShortDate(new Date())}
      </span>
    </div>
  )
}

function Shell() {
  const location = useLocation()
  const isDetail = /^\/item\//.test(location.pathname)

  return (
    <div style={{
      maxWidth: 440,
      margin: '0 auto',
      minHeight: '100vh',
      paddingBottom: isDetail ? 40 : 110,
      position: 'relative',
      background: PALETTE.bg,
      overflowX: 'hidden',
    }}>
      {!isDetail && <BrandStrip />}
      <Routes>
        <Route path="/" element={<Navigate to="/inventory" replace />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/add" element={<AddItem />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/item/:id" element={<EditItem />} />
      </Routes>
      {!isDetail && <Navbar />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  )
}
