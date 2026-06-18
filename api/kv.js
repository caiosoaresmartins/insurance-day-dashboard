const KV_KEY = 'insurance_records_2026';

async function upstash(commands) {
  // Upstash pipeline: POST /pipeline com array de comandos
  const res = await fetch(process.env.KV_REST_API_URL + '/pipeline', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error('Upstash error ' + res.status + ': ' + txt);
  }
  return res.json();
}

async function kvGet(key) {
  try {
    const result = await upstash([['GET', key]]);
    const raw = result[0]?.result;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) { return []; }
}

async function kvSet(key, value) {
  // SET key serialized_json
  const serialized = JSON.stringify(value);
  const result = await upstash([['SET', key, serialized]]);
  if (result[0]?.error) throw new Error(result[0].error);
  return result[0];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(500).json({ error: 'KV nao configurado nas env vars da Vercel' });
  }

  try {
    if (req.method === 'GET') {
      const records = await kvGet(KV_KEY);
      return res.status(200).json({ records });
    }

    if (req.method === 'POST') {
      const body   = req.body || {};
      const action = body.action;
      const record = body.record;

      if (action === 'add') {
        if (!record || !record.code || !record.type) {
          return res.status(400).json({ error: 'code e type obrigatorios' });
        }
        const existing = await kvGet(KV_KEY);
        const newRec = {
          id:    record.code + '_' + record.type + '_' + Date.now(),
          code:  record.code,
          name:  record.name  || '',
          squad: record.squad || '',
          type:  record.type,
          ts:    Date.now(),
        };
        existing.push(newRec);
        await kvSet(KV_KEY, existing);
        return res.status(200).json({ ok: true, record: newRec });
      }

      if (action === 'clear') {
        await kvSet(KV_KEY, []);
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ error: 'action invalida. Use: add ou clear' });
    }

    return res.status(405).json({ error: 'Metodo nao permitido' });
  } catch (e) {
    console.error('[KV error]', e);
    return res.status(500).json({ error: e.message });
  }
}
