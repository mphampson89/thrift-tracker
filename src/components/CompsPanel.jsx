import { useState } from 'react'
import { Label, PALETTE } from '../lib/ui'

const COMP_PLATFORMS = [
  { key: 'ebay-active', label: 'eBay Active',    url: q => `https://www.ebay.com/sch/i.html?_nkw=${q}` },
  { key: 'ebay-sold',   label: 'eBay Sold',       url: q => `https://www.ebay.com/sch/i.html?_nkw=${q}&LH_Sold=1&LH_Complete=1` },
  { key: 'poshmark',    label: 'Poshmark',        url: q => `https://poshmark.com/search?query=${q}` },
  { key: 'depop',       label: 'Depop',           url: q => `https://www.depop.com/search/?q=${q}` },
  { key: 'mercari',     label: 'Mercari',         url: q => `https://www.mercari.com/search/?keyword=${q}` },
  { key: 'google',      label: 'Google Shopping', url: q => `https://www.google.com/search?q=${q}&tbm=shop` },
]

export default function CompsPanel({ searchQuery, style = {} }) {
  const [active, setActive] = useState(() => new Set(COMP_PLATFORMS.map(p => p.key)))

  function toggle(key) {
    setActive(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const q = encodeURIComponent(searchQuery || '')

  return (
    <div style={{ margin: '14px 18px 0', ...style }}>
      <Label style={{ marginBottom: 8 }}>Shop comps</Label>
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x',
          paddingBottom: 2,
        }}
      >
        {COMP_PLATFORMS.map(({ key, label, url }) => {
          const isActive = active.has(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (isActive) window.open(url(q), '_blank', 'noopener,noreferrer')
                else toggle(key)
              }}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '7px 12px',
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 600,
                letterSpacing: -0.1,
                whiteSpace: 'nowrap',
                flexShrink: 0,
                background: isActive ? PALETTE.blush50 : 'transparent',
                color: isActive ? PALETTE.blush700 : PALETTE.ink2,
                border: isActive
                  ? `1px solid ${PALETTE.blush100}`
                  : `1px solid ${PALETTE.hairline}`,
                opacity: isActive ? 1 : 0.45,
                textDecoration: isActive ? 'none' : 'line-through',
              }}
            >
              {label}
              {isActive && (
                <span
                  onClick={e => { e.stopPropagation(); toggle(key) }}
                  style={{ fontSize: 11, opacity: 0.45, lineHeight: 1 }}
                >×</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
