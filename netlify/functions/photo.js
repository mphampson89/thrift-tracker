import { getStore } from '@netlify/blobs'

// Replaces the Supabase Storage public bucket. URLs are path-shaped
// (/photo/<key>) so EditItem's photo_url.split('/').pop() keeps working.
export default async (req, context) => {
  const key = context.params.key
  const store = getStore('item-photos')

  if (req.method === 'PUT') {
    await store.set(key, await req.arrayBuffer(), {
      metadata: { type: req.headers.get('content-type') || 'application/octet-stream' },
    })
    return Response.json({ data: { path: key }, error: null })
  }
  if (req.method === 'GET') {
    const blob = await store.getWithMetadata(key, { type: 'arrayBuffer' })
    if (!blob) return new Response('Not found', { status: 404 })
    return new Response(blob.data, {
      headers: {
        'Content-Type': blob.metadata?.type || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }
  if (req.method === 'DELETE') {
    await store.delete(key)
    return Response.json({ data: null, error: null })
  }
  return new Response('Method not allowed', { status: 405 })
}

export const config = { path: '/photo/:key' }
