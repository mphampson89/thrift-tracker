import { useEffect, useState } from 'react'

export const PALETTE = {
  bg: '#fdf5f4',
  card: '#ffffff',
  ink: '#3a1d29',
  ink2: '#6b3a4a',
  ink3: '#a8848e',
  hairline: '#f1dfe1',
  hairline2: '#f7eaec',
  blush50: '#fdeef0',
  blush100: '#fad6db',
  blush300: '#f4a8b4',
  blush500: '#e07d92',
  blush700: '#c25a78',
  blush900: '#7a2c45',
  warmStone: '#efece4',
  gold: '#c89a6a',
}

export function Money({ value, size = 17, weight = 600, color = PALETTE.ink, prefix = '$' }) {
  if (value == null || value === '') {
    return <span style={{ color: PALETTE.ink3, fontSize: size, fontWeight: weight }}>—</span>
  }
  const num = typeof value === 'number' ? value : parseFloat(value) || 0
  return (
    <span style={{
      fontVariantNumeric: 'tabular-nums',
      fontSize: size,
      fontWeight: weight,
      color,
      letterSpacing: -0.3,
    }}>
      <span style={{ opacity: 0.55, fontSize: size * 0.7, marginRight: 1 }}>{prefix}</span>
      {num.toLocaleString()}
    </span>
  )
}

export function Label({ children, size = 10.5, color = PALETTE.ink3, style = {} }) {
  return (
    <div style={{
      fontSize: size,
      fontWeight: 600,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color,
      ...style,
    }}>{children}</div>
  )
}

export function StatusPill({ status, size = 'sm' }) {
  const map = {
    sold: { bg: PALETTE.ink, fg: PALETTE.blush50, label: 'Sold' },
    listed: { bg: PALETTE.blush100, fg: PALETTE.blush700, label: 'Listed' },
    unsold: { bg: PALETTE.warmStone, fg: '#6a6f60', label: 'In stock' },
  }
  const m = map[status]
  if (!m) return null
  const pad = size === 'lg' ? '5px 12px' : '3px 8px'
  const fs = size === 'lg' ? 11 : 9.5
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: m.bg,
      color: m.fg,
      padding: pad,
      borderRadius: 999,
      fontSize: fs,
      fontWeight: 600,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    }}>
      <span style={{
        width: 5,
        height: 5,
        borderRadius: 999,
        background: m.fg,
        opacity: status === 'sold' ? 0.9 : 0.7,
      }}/>
      {m.label}
    </span>
  )
}

export function Sparkline({ data, width = 80, height = 30, color = PALETTE.blush700 }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const norm = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / (max - min || 1)) * (height - 6) - 3,
  }))
  const d = norm.map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `L${p.x} ${p.y}`)).join(' ')
  const area = `${d} L${width} ${height} L0 ${height} Z`
  const id = `sg-${Math.random().toString(36).slice(2, 8)}`
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`}/>
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={norm[norm.length - 1].x} cy={norm[norm.length - 1].y} r="2.2" fill={color}/>
    </svg>
  )
}

export function CountUp({ value, size = 40, color = PALETTE.blush50, prefix = '$' }) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const target = Math.max(0, Math.round(value || 0))
    let raf
    const start = performance.now()
    const dur = 900
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setV(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return (
    <span style={{
      fontFamily: 'Georgia, serif',
      fontSize: size,
      fontWeight: 700,
      color,
      letterSpacing: -1.5,
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1,
    }}>
      <span style={{ opacity: 0.5, fontSize: size * 0.5, marginRight: 3 }}>{prefix}</span>
      {v.toLocaleString()}
    </span>
  )
}

export const PLATFORMS = ['eBay', 'Poshmark', 'Facebook Marketplace', 'Mercari', 'Depop', 'Other']

export function SelectRow({ value, onChange, options = PLATFORMS }) {
  const opts = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o))
  return (
    <div className="no-scrollbar" style={{
      display: 'flex',
      gap: 6,
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      {opts.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: 999,
            fontSize: 12.5,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            background: value === o.value ? PALETTE.blush700 : PALETTE.card,
            color: value === o.value ? PALETTE.blush50 : PALETTE.ink2,
            border: `1px solid ${value === o.value ? 'transparent' : PALETTE.hairline}`,
          }}
        >{o.label}</button>
      ))}
    </div>
  )
}

export function Field({ label, children, style = {} }) {
  return (
    <div style={{ marginBottom: 10, ...style }}>
      <Label style={{ marginBottom: 6 }}>{label}</Label>
      {children}
    </div>
  )
}

const inputBase = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 14px',
  borderRadius: 12,
  border: `1px solid ${PALETTE.hairline}`,
  background: PALETTE.card,
  fontSize: 14.5,
  color: PALETTE.ink,
  outline: 'none',
  WebkitAppearance: 'none',
  fontFamily: 'inherit',
}

export function TextInput({ value, onChange, placeholder = '', ...props }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputBase}
      {...props}
    />
  )
}

export function TextArea({ value, onChange, placeholder = '', rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ ...inputBase, minHeight: 64, paddingTop: 10, resize: 'none' }}
    />
  )
}

export function DollarInput({ value, onChange, placeholder = '0' }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute',
        left: 14,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 14.5,
        color: PALETTE.ink3,
        fontWeight: 600,
        pointerEvents: 'none',
      }}>$</span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="numeric"
        style={{ ...inputBase, paddingLeft: 26 }}
      />
    </div>
  )
}

export function CircleBtn({ children, onClick, ariaLabel }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        all: 'unset',
        cursor: 'pointer',
        width: 36,
        height: 36,
        borderRadius: 999,
        background: 'rgba(253,238,240,0.92)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
      }}
    >{children}</button>
  )
}

export function formatShortDate(d) {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date)) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
