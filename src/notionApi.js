// Notion API — via proxy Vercel Serverless (/api/notion)
// DATABASE_ID: edd6a31a-35df-4496-b48f-95213c3fc7c9 (🛡️ Insurance Day — database exclusiva)

const DB_ID = 'edd6a31a-35df-4496-b48f-95213c3fc7c9'

async function notionProxy(path, body, mode) {
  const res = await fetch('/api/notion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, body, ...(mode ? { mode } : {}) }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || err.message || `Erro ${res.status}`)
  }
  return res.json()
}

const MAP_CLASS = {
  '🔵 R1 - Agendada': 'R1',
  '🟡 R2 - Realizada': 'R2',
  '💰 Venda': 'Venda',
}

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

  const data = await notionProxy(`/databases/${DB_ID}/query`, queryBody, 'fetchAll')
  const allResults = data.results || []

  return allResults
    .map(page => {
      const props    = page.properties
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
  const now     = new Date()
  const mes     = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                   'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][now.getMonth()]
  const ano     = String(now.getFullYear())
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
      'Pipedrive Registrado':  { checkbox: false },
      'Patrimônio do Cliente': { select: { name: '❓ Não informado' } },
    }
  }

  return notionProxy('/pages', body)
}
