const KV_KEY = 'insurance_records_2026';

async function kvGet(key) {
  const url = process.env.KV_REST_API_URL + '/get/' + encodeURIComponent(key);
  const res = await fetch(url, {
    headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN },
  });
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.result) return [];
  try {
    const parsed = JSON.parse(data.result);
    // FIX #1: garante sempre array
    return Array.isArray(parsed) ? parsed : [];
  } catch(_) { return []; }
}

async function kvSet(key, value) {
  const url = process.env.KV_REST_API_URL + '/set/' + encodeURIComponent(key);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value: JSON.stringify(value) }),
  });
  if (!res.ok) throw new Error('KV set failed: ' + res.status);
  return res.json();
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
      // FIX #2: sempre retorna array, nunca null
      return res.status(200).json({ records: Array.isArray(records) ? records : [] });
    }

    if (req.method === 'POST') {
      const body   = req.body || {};
      const action = body.action;
      const record = body.record;

      if (action === 'add') {
        if (!record || !record.code || !record.type) {
          return res.status(400).json({ error: 'code e type obrigatorios' });
        }
        // FIX #1: kvGet ja garante array, push seguro
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

      return res.status(400).json({ error: 'action invalida. Use add ou clear' });
    }

    return res.status(405).json({ error: 'Metodo nao permitido' });
  } catch(e) {
    console.error('KV error', e);
    return res.status(500).json({ error: e.message });
  }
}
