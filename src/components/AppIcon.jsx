export default function AppIcon({ size = 26, radius = null }) {
  const r = radius ?? size * 0.27
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{
      borderRadius: r,
      display: 'block',
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <defs>
        <linearGradient id="ic-mono" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fdeef0"/>
          <stop offset="100%" stopColor="#fad6db"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#ic-mono)"/>
      <text x="50" y="68" textAnchor="middle"
        fontFamily="Georgia, 'Cormorant Garamond', serif"
        fontSize="62" fontWeight="700" fill="#7a2c45" fontStyle="italic">J</text>
      <g transform="translate(64 36)" stroke="#c25a78" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-8 4 L0 -3 L8 4"/>
        <line x1="-9" y1="4" x2="9" y2="4"/>
      </g>
    </svg>
  )
}
