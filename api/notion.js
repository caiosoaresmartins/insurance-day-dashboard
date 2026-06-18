// Vercel Serverless Function — proxy para a API do Notion
// Modos: "proxy" (padrão) | "fetchAll" (paginação completa no servidor)

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_KEY = process.env.NOTION_KEY
const NOTION_VERSION = '2022-06-28'

async function notionRequest(path, body) {
  const res = await fetch(`${NOTION_API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const data = await res.json()
  if (!res.ok) throw Object.assign(new Error(data.message || `Notion error ${res.status}`), { status: res.status, data })
  return data
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (!NOTION_KEY) return res.status(500).json({ error: 'NOTION_KEY não configurada na Vercel' })

  try {
    const { path, body, mode } = req.body || {}
    if (!path) return res.status(400).json({ error: 'Campo "path" obrigatório' })

    if (mode === 'fetchAll') {
      let allResults = []
      let cursor = undefined
      do {
        const payload = cursor ? { ...body, start_cursor: cursor } : { ...body }
        const data = await notionRequest(path, payload)
        allResults = allResults.concat(data.results || [])
        cursor = data.has_more && data.next_cursor ? data.next_cursor : undefined
      } while (cursor)
      return res.status(200).json({ results: allResults, total: allResults.length })
    }

    const data = await notionRequest(path, body)
    return res.status(200).json(data)
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message, ...(e.data || {}) })
  }
}
