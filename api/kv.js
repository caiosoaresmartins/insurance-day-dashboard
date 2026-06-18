// Vercel Serverless — leitura e escrita no Vercel KV (Redis)
// GET  /api/kv          → retorna todos os registros
// POST /api/kv          → { action: 'add', record: {...} }  adiciona um registro
// POST /api/kv          → { action: 'clear' }               limpa tudo (admin)

import { createClient } from '@vercel/kv'

const KV_KEY = 'insurance_records_2026'

function getClient() {
  return createClient({
    url:   process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const kv = getClient()

  try {
    if (req.method === 'GET') {
      const records = await kv.get(KV_KEY)
      return res.status(200).json({ records: records || [] })
    }

    if (req.method === 'POST') {
      const { action, record } = req.body || {}

      if (action === 'add') {
        if (!record || !record.code || !record.type) {
          return res.status(400).json({ error: 'record.code e record.type são obrigatórios' })
        }
        const existing = (await kv.get(KV_KEY)) || []
        const newRecord = {
          id:    `${record.code}_${record.type}_${Date.now()}`,
          code:  record.code,
          name:  record.name,
          squad: record.squad,
          type:  record.type,
          ts:    Date.now(),
        }
        existing.push(newRecord)
        await kv.set(KV_KEY, existing)
        return res.status(200).json({ ok: true, record: newRecord })
      }

      if (action === 'clear') {
        await kv.set(KV_KEY, [])
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
