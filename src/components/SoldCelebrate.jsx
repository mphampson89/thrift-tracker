import { CountUp } from '../lib/ui'
import { PALETTE } from '../lib/theme'

export default function SoldCelebrate({ profit }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(58,29,41,0.55)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'tt-fade-in 0.25s ease',
    }}>
      <div style={{
        background: PALETTE.blush50,
        borderRadius: 24,
        padding: '28px 32px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'tt-pop 0.45s cubic-bezier(0.2, 0.8, 0.2, 1.1)',
      }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          margin: '0 auto',
          background: PALETTE.blush700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 28 28">
            <path
              d="M6 14L12 20L22 8"
              stroke={PALETTE.blush50}
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              strokeDasharray="30"
              strokeDashoffset="30"
              style={{ animation: 'tt-draw 0.5s ease-out 0.15s forwards' }}
            />
          </svg>
        </div>
        <div style={{
          marginTop: 14,
          fontFamily: 'Georgia, serif',
          fontSize: 22,
          fontWeight: 700,
          color: PALETTE.ink,
          letterSpacing: -0.4,
        }}>Sold.</div>
        <div style={{ marginTop: 6 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 32, fontWeight: 700, color: PALETTE.blush700 }}>+</span>
          <CountUp value={profit} size={32} color={PALETTE.blush700}/>
        </div>
        <div style={{
          marginTop: 6,
          fontSize: 11.5,
          color: PALETTE.ink3,
          letterSpacing: 0.5,
        }}>added to your ledger</div>
      </div>
    </div>
  )
}
