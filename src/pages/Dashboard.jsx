import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Label, CountUp, Sparkline, PALETTE } from '../lib/ui'
import { computeStats, bestFind, profitSparkline } from '../lib/stats'

function MiniStat({ label, value, fg, suffix }) {
  return (
    <div style={{ textAlign: 'center', borderRight: '1px solid rgba(244,168,180,0.14)' }}>
      <div style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 1.3,
        textTransform: 'uppercase',
        color: '#b07a8a',
      }}>{label}</div>
      <div style={{
        marginTop: 3,
        fontFamily: 'Georgia, serif',
        fontSize: 18,
        fontWeight: 700,
        color: fg,
        letterSpacing: -0.3,
        fontVariantNumeric: 'tabular-nums',
      }}>{suffix === '%' ? `${value}%` : `$${(value || 0).toLocaleString()}`}</div>
    </div>
  )
}

function Tile({ label, value }) {
  return (
    <div style={{
      background: PALETTE.card,
      borderRadius: 16,
      border: `1px solid ${PALETTE.hairline}`,
      padding: '12px 14px',
    }}>
      <Label>{label}</Label>
      <div style={{
        marginTop: 4,
        fontSize: 26,
        fontWeight: 700,
        color: PALETTE.ink,
        fontFamily: 'Georgia, serif',
        letterSpacing: -0.6,
      }}>{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('items').select('*').then(({ data }) => {
      setItems(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ textAlign: 'center', padding: 48, color: PALETTE.ink3 }}>Loading…</p>

  const stats = computeStats(items)
  const best = bestFind(items)
  const bestProfit = best ? Math.round((parseFloat(best.sold_price) || 0) - (parseFloat(best.cost) || 0)) : 0
  const spark = profitSparkline(items)
  const monthLabel = new Date().toLocaleDateString('en-US', { month: 'long' }).toUpperCase()

  return (
    <div>
      <div style={{ padding: '14px 18px 8px' }}>
        <Label>{monthLabel} · ledger</Label>
        <h1 style={{
          margin: '2px 0 0',
          fontSize: 28,
          fontWeight: 700,
          fontFamily: 'Georgia, serif',
          color: PALETTE.ink,
          letterSpacing: -0.6,
          lineHeight: 1.05,
        }}>The take.</h1>
      </div>

      <div style={{ padding: '8px 18px 0' }}>
        <div style={{
          background: PALETTE.ink,
          color: PALETTE.blush50,
          borderRadius: 22,
          padding: '18px 18px 14px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            right: -20,
            top: -20,
            opacity: 0.06,
            fontFamily: 'Georgia, serif',
            fontSize: 180,
            fontWeight: 700,
            color: PALETTE.blush300,
            lineHeight: 1,
            letterSpacing: -10,
            pointerEvents: 'none',
          }}>$</div>

          <Label color={PALETTE.blush300}>Profit · all-time</Label>
          <div style={{ marginTop: 4 }}>
            <CountUp value={stats.profit} size={48} color={PALETTE.blush50}/>
          </div>

          <div style={{ marginTop: 14 }}>
            <Sparkline data={spark} width={326} height={56} color={PALETTE.blush300}/>
          </div>

          <div style={{
            marginTop: 12,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            background: 'rgba(244,168,180,0.1)',
            borderRadius: 14,
            padding: '10px 4px',
          }}>
            <MiniStat label="Invested" value={stats.invested} fg={PALETTE.blush50}/>
            <MiniStat label="Earned" value={stats.earned} fg={PALETTE.blush50}/>
            <MiniStat label="Margin" value={stats.margin} suffix="%" fg={PALETTE.blush300}/>
          </div>
        </div>
      </div>

      {best && (
        <div style={{ padding: '16px 18px 0' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}>
            <Label>★ Best find</Label>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/item/${best.id}`)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'block',
              width: '100%',
              background: PALETTE.card,
              borderRadius: 18,
              border: `1px solid ${PALETTE.hairline}`,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex' }}>
              <div style={{ width: 110, height: 110, flexShrink: 0, background: '#f1dfe1' }}>
                {best.photo_url && (
                  <img src={best.photo_url} alt={best.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                )}
              </div>
              <div style={{
                flex: 1,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: PALETTE.ink, letterSpacing: -0.2 }}>{best.name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 22,
                    fontWeight: 700,
                    color: PALETTE.blush700,
                    letterSpacing: -0.4,
                  }}>+${bestProfit}</span>
                  <span style={{ fontSize: 11, color: PALETTE.ink3 }}>
                    paid ${Math.round(parseFloat(best.cost) || 0)} · sold ${Math.round(parseFloat(best.sold_price) || 0)}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      <div style={{ padding: '16px 18px 0' }}>
        <Label style={{ marginBottom: 8 }}>Inventory</Label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Tile label="Items" value={stats.total}/>
          <Tile label="Sold" value={stats.sold}/>
          <Tile label="Listed" value={stats.listed}/>
          <Tile label="In stock" value={stats.unsold}/>
        </div>
      </div>
    </div>
  )
}
