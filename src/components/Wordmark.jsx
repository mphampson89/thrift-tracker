export default function Wordmark({ size = 16 }) {
  return (
    <span style={{
      fontFamily: '-apple-system, "SF Pro", "Inter", system-ui, sans-serif',
      fontSize: size,
      fontWeight: 700,
      letterSpacing: -0.4,
      color: '#7a2c45',
    }}>
      thrifted<span style={{ color: '#d8919f' }}>.</span>
    </span>
  )
}
