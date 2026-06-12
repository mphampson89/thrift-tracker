import { Label } from '../lib/ui'
import { PALETTE } from '../lib/theme'
import CompsPanel from './CompsPanel'

export default function AIPanel({ result, onAccept, accepted, thumb }) {
  if (!result) return null
  const { name, era, description, priceLow, priceHigh, suggestedPrice, confidence, searchQuery } = result
  const lo = priceLow ?? suggestedPrice
  const hi = priceHigh ?? suggestedPrice
  const conf = confidence || 'Medium'

  return (
    <>
      <div style={{
        margin: '14px 18px 0',
        background: PALETTE.blush50,
        border: `1px solid ${PALETTE.blush100}`,
        borderRadius: 18,
        overflow: 'hidden',
        padding: '14px 16px 16px',
      }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            width: 64,
            height: 64,
            flexShrink: 0,
            borderRadius: 13,
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${PALETTE.blush50} 0%, ${PALETTE.blush100} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {thumb ? (
              <img src={thumb} alt={name || 'Item'} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
            ) : (
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={PALETTE.blush700} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4 Q11 2 13 2 Q15 2 15 4"/>
                <path d="M3 10 L13 4 L23 10"/>
                <line x1="2" y1="10" x2="24" y2="10"/>
              </svg>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M6 1L7.2 4.8L11 6L7.2 7.2L6 11L4.8 7.2L1 6L4.8 4.8Z" fill={PALETTE.blush700}/>
              </svg>
              <Label color={PALETTE.blush700} size={10.5}>AI identified</Label>
            </div>

            <div style={{
              fontFamily: 'Georgia, serif',
              fontSize: 15.5,
              fontWeight: 600,
              letterSpacing: -0.2,
              lineHeight: 1.2,
              color: PALETTE.ink,
            }}>
              {name}
              {era && <span style={{ fontStyle: 'italic', color: PALETTE.blush700 }}> · {era}</span>}
            </div>

            <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{
                fontFamily: 'Georgia, serif',
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: -0.3,
                color: PALETTE.blush700,
              }}>
                <span style={{ opacity: 0.55, fontSize: 12 }}>$</span>{Math.round(lo)}
                {hi !== lo && <><span style={{ opacity: 0.5 }}>–</span>{Math.round(hi)}</>}
              </span>
              <span style={{ fontSize: 11, color: PALETTE.ink3 }}>fair resale range</span>
            </div>
          </div>
        </div>

        {description && (
          <p style={{
            margin: '12px 0 0',
            fontSize: 13,
            lineHeight: 1.5,
            color: PALETTE.ink2,
            letterSpacing: -0.1,
          }}>{description}</p>
        )}

        <div style={{
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: PALETTE.blush100,
            color: PALETTE.blush700,
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.3,
            whiteSpace: 'nowrap',
          }}>Confidence · {conf}</span>

          {!accepted && onAccept && (
            <button
              type="button"
              onClick={onAccept}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '10px 16px',
                background: PALETTE.blush700,
                color: PALETTE.blush50,
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 13.5,
                textAlign: 'center',
                letterSpacing: -0.1,
                whiteSpace: 'nowrap',
              }}
            >Looks right →</button>
          )}
        </div>
      </div>

      <CompsPanel searchQuery={searchQuery ?? name} />
    </>
  )
}
