import { Label, PALETTE } from '../lib/ui'
import CompsPanel from './CompsPanel'

export default function AIPanel({ result, onAccept, accepted }) {
  if (!result) return null
  const { name, era, description, priceLow, priceHigh, suggestedPrice, confidence, searchQuery } = result
  const lo = priceLow ?? suggestedPrice
  const hi = priceHigh ?? suggestedPrice
  const conf = confidence || 'Medium'

  return (
    <>
      <div style={{
        margin: '14px 18px 0',
        background: PALETTE.ink,
        borderRadius: 22,
        overflow: 'hidden',
        position: 'relative',
        color: PALETTE.blush50,
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 10% 0%, rgba(244,168,180,0.14) 0%, transparent 60%)',
        }}/>
        <div style={{ position: 'relative', padding: '14px 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{
              width: 18,
              height: 18,
              borderRadius: 999,
              background: PALETTE.blush300,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M5 1L6 4L9 5L6 6L5 9L4 6L1 5L4 4Z" fill={PALETTE.ink}/>
              </svg>
            </span>
            <Label color={PALETTE.blush300}>Identified</Label>
          </div>

          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: -0.4,
            lineHeight: 1.15,
          }}>
            {name}
            {era && (
              <>
                <br/>
                <span style={{ fontStyle: 'italic', color: PALETTE.blush300 }}>{era}</span>
              </>
            )}
          </div>

          {description && (
            <p style={{
              margin: '12px 0 0',
              fontSize: 13.2,
              lineHeight: 1.55,
              color: '#e8c5cc',
              letterSpacing: -0.1,
            }}>{description}</p>
          )}

          <div style={{
            marginTop: 14,
            padding: '12px 14px',
            borderRadius: 14,
            background: 'rgba(244,168,180,0.14)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}>
            <div>
              <Label color={PALETTE.blush300}>Suggested resale</Label>
              <div style={{
                marginTop: 2,
                fontFamily: 'Georgia, serif',
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: -0.6,
              }}>
                <span style={{ opacity: 0.6, fontSize: 16 }}>$</span>
                {Math.round(lo)}
                {hi !== lo && <><span style={{ opacity: 0.5 }}>–</span>{Math.round(hi)}</>}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Label color={PALETTE.blush300}>Confidence</Label>
              <div style={{ marginTop: 2, fontSize: 14, fontWeight: 600 }}>{conf}</div>
            </div>
          </div>

          {!accepted && onAccept && (
            <button
              type="button"
              onClick={onAccept}
              style={{
                all: 'unset',
                cursor: 'pointer',
                marginTop: 12,
                padding: '11px 14px',
                width: '100%',
                boxSizing: 'border-box',
                background: PALETTE.blush50,
                color: PALETTE.ink,
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 14,
                textAlign: 'center',
                letterSpacing: -0.1,
              }}
            >Looks right →</button>
          )}
        </div>
      </div>

      <CompsPanel searchQuery={searchQuery ?? name} />
    </>
  )
}
