// GET /api/health — diagnostico completo do ambiente
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const results = {};

  // 1. Verifica env vars
  const hasUrl   = !!process.env.KV_REST_API_URL;
  const hasToken = !!process.env.KV_REST_API_TOKEN;
  results.env = {
    KV_REST_API_URL:   hasUrl   ? '✅ configurado' : '❌ AUSENTE',
    KV_REST_API_TOKEN: hasToken ? '✅ configurado' : '❌ AUSENTE',
  };

  if (!hasUrl || !hasToken) {
    return res.status(200).json({
      status: 'ERRO',
      message: 'Variáveis de ambiente não configuradas',
      results,
    });
  }

  // 2. Testa conexão com o KV (PING)
  try {
    const ping = await fetch(process.env.KV_REST_API_URL + '/ping', {
      headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN },
    });
    const pingData = await ping.json();
    results.ping = ping.ok && pingData.result === 'PONG' ? '✅ PONG recebido' : '❌ falhou: ' + JSON.stringify(pingData);
  } catch(e) {
    results.ping = '❌ erro: ' + e.message;
  }

  // 3. Testa escrita no KV
  try {
    const setRes = await fetch(process.env.KV_REST_API_URL + '/set/health_check_test', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: JSON.stringify({ ts: Date.now(), ok: true }) }),
    });
    const setData = await setRes.json();
    results.write = setRes.ok ? '✅ escrita OK' : '❌ falhou: ' + JSON.stringify(setData);
  } catch(e) {
    results.write = '❌ erro: ' + e.message;
  }

  // 4. Testa leitura no KV
  try {
    const getRes = await fetch(process.env.KV_REST_API_URL + '/get/health_check_test', {
      headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN },
    });
    const getData = await getRes.json();
    results.read = getRes.ok && getData.result ? '✅ leitura OK' : '❌ falhou: ' + JSON.stringify(getData);
  } catch(e) {
    results.read = '❌ erro: ' + e.message;
  }

  // 5. Testa leitura dos registros reais
  try {
    const recRes = await fetch(process.env.KV_REST_API_URL + '/get/insurance_records_2026', {
      headers: { Authorization: 'Bearer ' + process.env.KV_REST_API_TOKEN },
    });
    const recData = await recRes.json();
    let records = [];
    if (recData.result) { try { records = JSON.parse(recData.result); } catch(_) {} }
    results.records = '✅ ' + records.length + ' registro(s) encontrado(s)';
  } catch(e) {
    results.records = '❌ erro: ' + e.message;
  }

  const allOk = Object.values(results).every(v => typeof v === 'string' ? v.startsWith('✅') : Object.values(v).every(x => x.startsWith('✅')));

  return res.status(200).json({
    status:  allOk ? '✅ TUDO OK' : '⚠️ PROBLEMAS ENCONTRADOS',
    results,
    ts: new Date().toISOString(),
  });
}
