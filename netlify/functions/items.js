import { neon } from '@neondatabase/serverless'

// Whitelisted writable columns — keeps the gateway from accepting arbitrary SQL targets.
const COLS = new Set([
  'name', 'cost', 'listing_price', 'sold_price', 'ai_suggested_price',
  'status', 'listed_on', 'notes', 'photo_url', 'search_query',
])

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ data: null, error: 'POST only' }, { status: 405 })
  }
  const sql = neon(process.env.DATABASE_URL)
  const { op, values, id, order, single } = await req.json()
  try {
    let rows
    if (op === 'select') {
      if (id) {
        rows = await sql.query('SELECT * FROM items WHERE id = $1', [id])
      } else {
        rows = await sql.query(
          `SELECT * FROM items ORDER BY created_at ${order?.ascending ? 'ASC' : 'DESC'}`
        )
      }
    } else if (op === 'insert') {
      const keys = Object.keys(values).filter((k) => COLS.has(k))
      const placeholders = keys.map((_, i) => `$${i + 1}`)
      rows = await sql.query(
        `INSERT INTO items (${keys.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
        keys.map((k) => values[k])
      )
    } else if (op === 'update') {
      const keys = Object.keys(values).filter((k) => COLS.has(k))
      const sets = keys.map((k, i) => `${k} = $${i + 1}`)
      rows = await sql.query(
        `UPDATE items SET ${sets.join(', ')} WHERE id = $${keys.length + 1} RETURNING *`,
        [...keys.map((k) => values[k]), id]
      )
    } else if (op === 'delete') {
      rows = await sql.query('DELETE FROM items WHERE id = $1 RETURNING *', [id])
    } else {
      return Response.json({ data: null, error: `unknown op: ${op}` }, { status: 400 })
    }
    return Response.json({ data: single ? rows[0] ?? null : rows, error: null })
  } catch (err) {
    return Response.json({ data: null, error: String(err) }, { status: 500 })
  }
}
