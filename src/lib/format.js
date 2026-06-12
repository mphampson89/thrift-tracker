export function formatShortDate(d) {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date)) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
