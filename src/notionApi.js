// Notion API — via proxy Vercel Serverless (/api/notion)
// DATABASE_ID: 2a078fd8-3b27-4ad4-9447-7ba22da86e47

const DB_ID = '2a078fd8-3b27-4ad4-9447-7ba22da86e47'

// Chama sempre o proxy interno da Vercel — sem CORS, sem chave exposta no frontend
async function notionProxy(path, body) {
  const res = await fetch('/api/notion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, body }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || err.message || `Erro ${res.status}`)
  }
  return res.json()
}

// Mapeia classificacao Notion → tipo interno
const MAP_CLASS = {
  '🔵 R1 - Agendada': 'R1',
  '🟡 R2 - Realizada': 'R2',
  '💰 Venda': 'Venda',
}

// Mapeia squad Notion → squad interno
const MAP_SQUAD = {
  '🔵 Alavancados':        'Alavancados',
  '🟤 Los Hermanos':       'Los Hermanos',
  '🟣 Advisors':           'Advisors',
  '🟠 Outliers':           'Outliers',
  '🟢 Anywhere':           'Anywhere',
  '⚙️ Áreas Operacionais': 'Áreas Operacionais',
}

export async function fetchRecordsFromNotion() {
  const queryBody = {
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

  do {
    const payload = cursor ? { ...queryBody, start_cursor: cursor } : queryBody
    const data = await notionProxy(`/databases/${DB_ID}/query`, payload)
    allResults = [...allResults, ...data.results]
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  return allResults
    .map(page => {
      const props   = page.properties
      const assessor = props['Assessor']?.rich_text?.[0]?.plain_text || ''
      const classif  = props['Classificação']?.select?.name || ''
      const squad    = props['Squad']?.select?.name || ''
      const dateStr  = props['Data']?.date?.start || page.created_time
      const type     = MAP_CLASS[classif]
      const squadNorm = MAP_SQUAD[squad] || squad
      if (!assessor || !type) return null
      return {
        code:     assessor.trim(),
        name:     assessor.trim(),
        squad:    squadNorm,
        type,
        ts:       new Date(dateStr).getTime(),
        notionId: page.id,
      }
    })
    .filter(Boolean)
}

export async function createRecordInNotion({ user, type }) {
  const now    = new Date()
  const mes    = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][now.getMonth()]
  const ano    = String(now.getFullYear())
  const dateISO = now.toISOString().split('T')[0]

  const classifMap = {
    R1:    '🔵 R1 - Agendada',
    R2:    '🟡 R2 - Realizada',
    Venda: '💰 Venda',
  }
  const squadMap = {
    'Alavancados':        '🔵 Alavancados',
    'Los Hermanos':       '🟤 Los Hermanos',
    'Advisors':           '🟣 Advisors',
    'Outliers':           '🟠 Outliers',
    'Anywhere':           '🟢 Anywhere',
    'Áreas Operacionais': '⚙️ Áreas Operacionais',
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
      'Pipedrive Registrado':   { checkbox: false },
      'Patrimônio do Cliente':  { select: { name: '❓ Não informado' } },
    }
  }

  return notionProxy('/pages', body)
}
