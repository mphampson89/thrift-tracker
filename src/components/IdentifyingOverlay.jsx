import { PALETTE } from '../lib/ui'

export default function IdentifyingOverlay() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'rgba(58,29,41,0.45)',
      backdropFilter: 'blur(2px)',
      WebkitBackdropFilter: 'blur(2px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 14,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div className="tt-spinner"/>
        <div style={{ fontSize: 13, color: PALETTE.ink, fontWeight: 600 }}>Identifying…</div>
      </div>
    </div>
  )
}
