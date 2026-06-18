// API do Vercel KV — substitui notionApi.js
// Todos os registros são lidos/gravados via /api/kv

export async function fetchRecordsFromKV() {
  const res = await fetch('/api/kv', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Erro ${res.status}`)
  }
  const data = await res.json()
  return data.records || []
}

export async function createRecordInKV({ user, type }) {
  const res = await fetch('/api/kv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'add',
      record: {
        code:  user.code,
        name:  user.name,
        squad: user.squad,
        type,
      },
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Erro ${res.status}`)
  }
  return res.json()
}
