import { NavLink } from 'react-router-dom'
import { PALETTE } from '../lib/theme'

const Icons = {
  inventory: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 8h14l-1 11H6L5 8z" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinejoin="round"/>
      <path d="M9 8V6a3 3 0 016 0v2" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round"/>
    </svg>
  ),
  add: (active) => (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="13" r="11" stroke="currentColor" strokeWidth={active ? 2 : 1.6}/>
      <path d="M13 8v10M8 13h10" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round"/>
    </svg>
  ),
  dashboard: (active) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M5 19V13M11 19V8M17 19V15M23 19H3" stroke="currentColor" strokeWidth={active ? 2 : 1.6} strokeLinecap="round"/>
    </svg>
  ),
}

const TABS = [
  { to: '/inventory', label: 'Inventory', icon: Icons.inventory },
  { to: '/add', label: 'Log find', icon: Icons.add },
  { to: '/dashboard', label: 'Ledger', icon: Icons.dashboard },
]

export default function Navbar() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
      paddingTop: 8,
      paddingLeft: 18,
      paddingRight: 18,
      background: 'linear-gradient(180deg, rgba(253,245,244,0) 0%, rgba(253,245,244,0.96) 30%)',
      pointerEvents: 'none',
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: 440,
        margin: '0 auto',
        pointerEvents: 'auto',
        background: PALETTE.ink,
        borderRadius: 999,
        padding: 8,
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 12px 32px rgba(58,29,41,0.25)',
      }}>
        {TABS.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            style={({ isActive }) => ({
              flex: 1,
              padding: '8px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              borderRadius: 999,
              textDecoration: 'none',
              background: isActive ? PALETTE.blush700 : 'transparent',
              color: isActive ? PALETTE.blush50 : 'rgba(253,238,240,0.6)',
              transition: 'all 0.2s ease',
            })}
          >
            {({ isActive }) => (
              <>
                {tab.icon(isActive)}
                <span style={{
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                }}>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
