// Supabase-shaped shim over Netlify Functions + Neon + Netlify Blobs.
// Keeps the original supabase-js call-site surface (.from().select().eq().single(),
// .storage.from().upload()/getPublicUrl()/remove()) so pages stay unchanged.

const ITEMS_FN = '/.netlify/functions/items'

class Query {
  constructor(body) {
    this.body = body
  }
  eq(_col, val) {
    this.body.id = val
    return this
  }
  single() {
    this.body.single = true
    return this
  }
  order(_col, opts) {
    this.body.order = { ascending: !!opts?.ascending }
    return this
  }
  then(resolve, reject) {
    return fetch(ITEMS_FN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.body),
    })
      .then((r) => r.json())
      .then(resolve, reject)
  }
}

export const supabase = {
  from() {
    return {
      select: () => new Query({ op: 'select' }),
      insert: (values) => new Query({ op: 'insert', values }),
      update: (values) => new Query({ op: 'update', values }),
      delete: () => new Query({ op: 'delete' }),
    }
  },
  storage: {
    from() {
      return {
        upload: async (path, file) => {
          const res = await fetch(`/photo/${encodeURIComponent(path)}`, {
            method: 'PUT',
            headers: { 'Content-Type': file.type || 'application/octet-stream' },
            body: file,
          })
          return res.ok
            ? { data: { path }, error: null }
            : { data: null, error: await res.text() }
        },
        getPublicUrl: (path) => ({
          data: { publicUrl: `/photo/${encodeURIComponent(path)}` },
        }),
        remove: async (paths) => {
          await Promise.all(
            paths.map((p) => fetch(`/photo/${encodeURIComponent(p)}`, { method: 'DELETE' }))
          )
          return { data: paths, error: null }
        },
      }
    },
  },
}
