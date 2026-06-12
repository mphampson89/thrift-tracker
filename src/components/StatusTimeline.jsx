import { Label } from '../lib/ui'
import { PALETTE } from '../lib/theme'
import { formatShortDate } from '../lib/format'

export default function StatusTimeline({ status, dateAdded, soldDate }) {
  const steps = [
    { key: 'bought', label: 'Bought', date: formatShortDate(dateAdded), done: true },
    { key: 'listed', label: 'Listed', date: status !== 'unsold' ? '+ listed' : null, done: status !== 'unsold' },
    { key: 'sold', label: 'Sold', date: soldDate ? formatShortDate(soldDate) : null, done: status === 'sold' },
  ]
  const fillPct = status === 'sold' ? '72%' : status === 'listed' ? '36%' : '0%'

  return (
    <div style={{
      marginTop: 16,
      padding: '16px 18px',
      borderRadius: 16,
      background: PALETTE.card,
      border: `1px solid ${PALETTE.hairline}`,
    }}>
      <Label style={{ marginBottom: 12 }}>Status</Label>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          top: 9,
          left: '14%',
          right: '14%',
          height: 2,
          background: PALETTE.hairline,
        }}/>
        <div style={{
          position: 'absolute',
          top: 9,
          left: '14%',
          width: fillPct,
          height: 2,
          background: PALETTE.blush700,
          transition: 'width 0.5s ease',
        }}/>
        {steps.map(s => (
          <div key={s.key} style={{ flex: 1, textAlign: 'center', position: 'relative' }}>
            <div style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              margin: '0 auto',
              background: s.done ? PALETTE.blush700 : PALETTE.blush50,
              border: s.done ? 'none' : `2px solid ${PALETTE.hairline}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
            }}>
              {s.done && (
                <svg width="9" height="9" viewBox="0 0 9 9">
                  <path d="M1.5 4.5L3.7 6.7L7.5 2.5" stroke={PALETTE.blush50} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              )}
            </div>
            <div style={{
              marginTop: 7,
              fontSize: 11.5,
              fontWeight: 600,
              color: s.done ? PALETTE.ink : PALETTE.ink3,
            }}>{s.label}</div>
            <div style={{
              fontSize: 10,
              color: PALETTE.ink3,
              marginTop: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>{s.date || '—'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
