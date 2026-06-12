import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Label, Money, Sparkline } from '../lib/ui'
import { PALETTE } from '../lib/theme'
import { computeStats, profitSparkline } from '../lib/stats'

function ItemCard({ item }) {
  const profit = item.status === 'sold' && item.sold_price && item.cost
    ? parseFloat(item.sold_price) - parseFloat(item.cost)
    : null

  return (
    <Link to={`/item/${item.id}`} style={{
      display: 'block',
      background: PALETTE.card,
      borderRadius: 18,
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 1px 2px rgba(58,29,41,0.04), 0 6px 18px rgba(58,29,41,0.06)',
      textDecoration: 'none',
      color: 'inherit',
    }}>
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#f1dfe1' }}>
        {item.photo_url ? (
          <img src={item.photo_url} alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #fdeef0 0%, #fad6db 100%)',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={PALETTE.blush700} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4 Q11 2 13 2 Q15 2 15 4"/>
              <path d="M3 10 L13 4 L23 10"/>
              <line x1="2" y1="10" x2="24" y2="10"/>
            </svg>
          </div>
        )}
        {item.status === 'listed' && (
          <span style={{
            position: 'absolute',
            top: 8,
            left: 8,
            background: 'rgba(253,238,240,0.95)',
            color: PALETTE.blush700,
            padding: '3px 8px',
            borderRadius: 999,
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}>Listed</span>
        )}
        {item.status === 'sold' && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '6px 10px',
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(58,29,41,0.85) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: PALETTE.blush50,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase' }}>Sold</span>
            {profit != null && (
              <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 12, fontWeight: 600 }}>
                +${Math.round(profit).toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{
          fontSize: 13.5,
          fontWeight: 600,
          color: PALETTE.ink,
          letterSpacing: -0.2,
          lineHeight: 1.25,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>{item.name}</div>
        <div style={{
          marginTop: 4,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontSize: 10.5,
            color: PALETTE.ink3,
            fontWeight: 500,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}>
            Paid <Money value={parseFloat(item.cost)} size={10.5} weight={600} color={PALETTE.ink2}/>
          </span>
          <span>
            {item.status === 'sold' && <Money value={parseFloat(item.sold_price)} size={12.5}/>}
            {item.status === 'listed' && (
              <Money value={parseFloat(item.listing_price)} size={12.5} color={PALETTE.blush700}/>
            )}
            {item.status === 'unsold' && (
              <span style={{ color: PALETTE.ink3, fontStyle: 'italic', fontWeight: 500, fontSize: 12 }}>
                Unlisted
              </span>
            )}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function Inventory() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('items').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      setItems(data || [])
      setLoading(false)
    })
  }, [])

  const stats = computeStats(items)
  const spark = profitSparkline(items)
  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter)
  const filters = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'unsold', label: 'In stock', count: stats.unsold },
    { key: 'listed', label: 'Listed', count: stats.listed },
    { key: 'sold', label: 'Sold', count: stats.sold },
  ]

  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long' }).toUpperCase()

  return (
    <div>
      <div style={{ padding: '14px 18px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Label>Inventory · {monthLabel}</Label>
            <h1 style={{
              margin: '2px 0 0',
              fontSize: 28,
              fontWeight: 700,
              fontFamily: 'Georgia, serif',
              color: PALETTE.ink,
              letterSpacing: -0.6,
              lineHeight: 1.05,
            }}>
              {stats.total} <span style={{ color: PALETTE.ink3, fontWeight: 500, fontStyle: 'italic' }}>finds</span>
            </h1>
          </div>
        </div>

        <div style={{
          marginTop: 14,
          padding: '10px 14px',
          background: PALETTE.blush50,
          borderRadius: 14,
          border: `1px solid ${PALETTE.blush100}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <Label color={PALETTE.blush700} size={10}>Profit · all-time</Label>
            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: 22,
              fontWeight: 700,
              color: PALETTE.blush900,
              letterSpacing: -0.4,
              marginTop: 2,
            }}>
              <Money value={stats.profit} size={22} weight={700} color={PALETTE.blush900}/>
            </div>
          </div>
          <Sparkline data={spark} width={84} height={32}/>
        </div>
      </div>

      <div className="no-scrollbar" style={{
        display: 'flex',
        gap: 6,
        padding: '0 18px 12px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {filters.map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              padding: '7px 12px',
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: -0.1,
              background: filter === f.key ? PALETTE.ink : 'transparent',
              color: filter === f.key ? PALETTE.blush50 : PALETTE.ink2,
              border: filter === f.key ? '1px solid transparent' : `1px solid ${PALETTE.hairline}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {f.label}
            <span style={{
              fontSize: 10.5,
              fontWeight: 600,
              opacity: filter === f.key ? 0.7 : 0.5,
              fontVariantNumeric: 'tabular-nums',
            }}>{f.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: 48, color: PALETTE.ink3 }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: 'center', padding: 48, color: PALETTE.ink3, fontStyle: 'italic' }}>
          {items.length === 0 ? 'No finds yet. Tap Log find to get started.' : 'Nothing in this filter.'}
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          padding: '0 18px',
        }}>
          {filtered.map(item => <ItemCard key={item.id} item={item}/>)}
        </div>
      )}
    </div>
  )
}
