// Vercel Serverless Function — proxy para a API do Notion
// Resolve o bloqueio de CORS que impede chamadas diretas do browser

const NOTION_API = 'https://api.notion.com/v1'
const NOTION_KEY = process.env.NOTION_KEY
const NOTION_VERSION = '2022-06-28'

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (!NOTION_KEY) {
    return res.status(500).json({ error: 'NOTION_KEY não configurada na Vercel' })
  }

  try {
    const { path, body } = req.body || {}

    if (!path) {
      return res.status(400).json({ error: 'Campo "path" obrigatório' })
    }

    const notionRes = await fetch(`${NOTION_API}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    const data = await notionRes.json()

    if (!notionRes.ok) {
      return res.status(notionRes.status).json(data)
    }

    return res.status(200).json(data)
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
