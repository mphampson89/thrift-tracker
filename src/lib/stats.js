export function computeStats(items) {
  const total = items.length
  const sold = items.filter(i => i.status === 'sold').length
  const listed = items.filter(i => i.status === 'listed').length
  const unsold = items.filter(i => i.status === 'unsold').length

  const invested = items.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0)
  const soldItems = items.filter(i => i.status === 'sold')
  const earned = soldItems.reduce((s, i) => s + (parseFloat(i.sold_price) || 0), 0)
  const costOfSold = soldItems.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0)
  const profit = earned - costOfSold
  const margin = costOfSold > 0 ? Math.round((profit / costOfSold) * 100) : 0

  return {
    total,
    sold,
    listed,
    unsold,
    invested: Math.round(invested),
    earned: Math.round(earned),
    profit: Math.round(profit),
    margin,
  }
}

export function bestFind(items) {
  const sold = items.filter(i => i.status === 'sold' && i.sold_price && i.cost)
  if (sold.length === 0) return null
  return sold.reduce((best, item) => {
    const p = (parseFloat(item.sold_price) || 0) - (parseFloat(item.cost) || 0)
    const bp = (parseFloat(best.sold_price) || 0) - (parseFloat(best.cost) || 0)
    return p > bp ? item : best
  })
}

export function profitSparkline(items, weeks = 12) {
  const now = Date.now()
  const buckets = new Array(weeks).fill(0)
  for (const item of items) {
    if (item.status !== 'sold' || !item.sold_price || !item.cost) continue
    const ts = new Date(item.created_at || now).getTime()
    const weeksAgo = Math.floor((now - ts) / (7 * 24 * 60 * 60 * 1000))
    if (weeksAgo < 0 || weeksAgo >= weeks) continue
    buckets[weeks - 1 - weeksAgo] += parseFloat(item.sold_price) - parseFloat(item.cost)
  }
  if (buckets.every(b => b === 0)) {
    // gentle waveform when no data, so the sparkline still draws a line
    return [2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8]
  }
  return buckets
}
