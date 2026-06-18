// Notion API integration via Cloudflare Worker proxy
// DATABASE_ID: 2a078fd8-3b27-4ad4-9447-7ba22da86e47

const DB_ID = '2a078fd8-3b27-4ad4-9447-7ba22da86e47'
const PROXY = 'https://notion-proxy.insurance-day.workers.dev'
// Fallback: chamada direta (precisa de proxy CORS em prod)
const NOTION_API = 'https://api.notion.com/v1'
const NOTION_KEY = import.meta.env.VITE_NOTION_KEY
const NOTION_VERSION = '2022-06-28'

const headers = () => ({
  'Authorization': `Bearer ${NOTION_KEY}`,
  'Notion-Version': NOTION_VERSION,
  'Content-Type': 'application/json',
})

// Mapeia classificacao Notion → tipo interno
const MAP_CLASS = {
  '🔵 R1 - Agendada': 'R1',
  '🟡 R2 - Realizada': 'R2',
  '💰 Venda': 'Venda',
}

// Mapeia squad Notion → squad interno
const MAP_SQUAD = {
  '🔵 Alavancados':      'Alavancados',
  '🟤 Los Hermanos':    'Los Hermanos',
  '🟣 Advisors':         'Advisors',
  '🟠 Outliers':         'Outliers',
  '🟢 Anywhere':         'Anywhere',
  '⚙️ Áreas Operacionais': 'Áreas Operacionais',
}

export async function fetchRecordsFromNotion() {
  const url = `${NOTION_API}/databases/${DB_ID}/query`
  const body = {
    filter: {
      and: [
        { property: 'Ano', select: { equals: '2026' } },
        {
          or: [
            { property: 'Mês', select: { equals: 'Junho' } },
            { property: 'Mês', select: { equals: 'Julho' } },
          ]
        },
        {
          or: [
            { property: 'Classificação', select: { equals: '🔵 R1 - Agendada' } },
            { property: 'Classificação', select: { equals: '🟡 R2 - Realizada' } },
            { property: 'Classificação', select: { equals: '💰 Venda' } },
          ]
        }
      ]
    },
    page_size: 100,
    sorts: [{ property: 'Data', direction: 'descending' }]
  }

  let allResults = []
  let cursor = undefined

  // Paginação completa
  do {
    const payload = cursor ? { ...body, start_cursor: cursor } : body
    const res = await fetch(url, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`Notion API error: ${res.status}`)
    const data = await res.json()
    allResults = [...allResults, ...data.results]
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  // Normaliza para o formato interno { code, type, ts }
  return allResults
    .map(page => {
      const props = page.properties
      const assessor  = props['Assessor']?.rich_text?.[0]?.plain_text || ''
      const classif   = props['Classificação']?.select?.name || ''
      const squad     = props['Squad']?.select?.name || ''
      const dateStr   = props['Data']?.date?.start || page.created_time
      const type      = MAP_CLASS[classif]
      const squadNorm = MAP_SQUAD[squad] || squad
      if (!assessor || !type) return null
      // Encontra o código do assessor pelo nome
      return {
        code: assessor.trim(), // usaremos nome como fallback se nao tiver codigo
        name: assessor.trim(),
        squad: squadNorm,
        type,
        ts: new Date(dateStr).getTime(),
        notionId: page.id,
      }
    })
    .filter(Boolean)
}

export async function createRecordInNotion({ user, type }) {
  const url = `${NOTION_API}/pages`
  const now = new Date()
  const mes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][now.getMonth()]
  const ano = String(now.getFullYear())
  const dateISO = now.toISOString().split('T')[0]

  const classifMap = {
    R1:    '🔵 R1 - Agendada',
    R2:    '🟡 R2 - Realizada',
    Venda: '💰 Venda',
  }
  const squadMap = {
    'Alavancados':       '🔵 Alavancados',
    'Los Hermanos':      '🟤 Los Hermanos',
    'Advisors':          '🟣 Advisors',
    'Outliers':          '🟠 Outliers',
    'Anywhere':          '🟢 Anywhere',
    'Áreas Operacionais':'⚙️ Áreas Operacionais',
  }

  const body = {
    parent: { database_id: DB_ID },
    properties: {
      'Reunião':       { title: [{ text: { content: `${type} — ${user.name}` } }] },
      'Assessor':      { rich_text: [{ text: { content: user.name } }] },
      'Responsável':   { rich_text: [{ text: { content: user.name } }] },
      'Squad':         { select: { name: squadMap[user.squad] || user.squad } },
      'Classificação': { select: { name: classifMap[type] } },
      'Mês':           { select: { name: mes } },
      'Ano':           { select: { name: ano } },
      'Data':          { date: { start: dateISO } },
      'Status':        { select: { name: type === 'R1' ? '⏳ Agendada' : '✅ Realizada' } },
      'Pipedrive Registrado': { checkbox: false },
      'Patrimônio do Cliente': { select: { name: '❓ Não informado' } },
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || `Notion error ${res.status}`)
  }
  return await res.json()
}
