// Vercel Serverless — leitura e escrita no Vercel KV via REST API (sem dependências)
// GET  /api/kv  → retorna todos os registros
// POST /api/kv  { action: 'add', record: {...} } → adiciona um registro

const KV_KEY = 'insurance_records_2026'

async function kvGet(key) {
  const url = `${process.env.KV_REST_API_URL}/get/${key}`
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.result ? JSON.parse(data.result) : null
}

async function kvSet(key, value) {
  const url = `${process.env.KV_REST_API_URL}/set/${key}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value: JSON.stringify(value) }),
  })
  if (!res.ok) throw new Error(`KV set failed: ${res.status}`)
  return res.json()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(500).json({ error: 'KV_REST_API_URL ou KV_REST_API_TOKEN não configurados na Vercel' })
  }

  try {
    if (req.method === 'GET') {
      const records = await kvGet(KV_KEY)
      return res.status(200).json({ records: records || [] })
    }

    if (req.method === 'POST') {
      const { action, record } = req.body || {}

      if (action === 'add') {
        if (!record?.code || !record?.type) {
          return res.status(400).json({ error: 'record.code e record.type são obrigatórios' })
        }
        const existing = (await kvGet(KV_KEY)) || []
        const newRecord = {
          id:    `${record.code}_${record.type}_${Date.now()}`,
          code:  record.code,
          name:  record.name,
          squad: record.squad,
          type:  record.type,
          ts:    Date.now(),
        }
        existing.push(newRecord)
        await kvSet(KV_KEY, existing)
        return res.status(200).json({ ok: true, record: newRecord })
      }

      if (action === 'clear') {
        await kvSet(KV_KEY, [])
        return res.status(200).json({ ok: true })
      }

      return res.status(400).json({ error: 'action inválida. Use "add" ou "clear"' })
    }

    return res.status(405).json({ error: 'Método não permitido' })
  } catch (e) {
    console.error('KV error:', e)
    return res.status(500).json({ error: e.message })
  }
}
