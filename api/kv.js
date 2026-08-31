const LEGACY_KEY = 'insurance_records_2026';
const STREAM_KEY = 'insurance_records_2026_v2';
const VALID_TYPES = new Set(['R1','R2','Venda']);

const ASSESSORS = [
  ['A73614','Bruno Bruel','Alavancados'],['A26347','Guilherme Monticelli','Alavancados'],['A38636','Hellen Carvalho','Alavancados'],['A38548','Igor Bairros','Alavancados'],['A96379','Leonardo Vacca','Alavancados'],['A51532','Nicolas Mallmann','Alavancados'],['A26305','Pedro Couto','Alavancados'],['A27267','Rodrigo Lisboa','Alavancados'],['A27321','Vitória Vidor','Alavancados'],['A42881','Ygor Walter','Alavancados'],
  ['A1607','Assessoria Eurostock','Los Hermanos'],['A98897','Daniel Mendonça','Los Hermanos'],['A73851','Eduardo Freitas','Los Hermanos'],['A26969','Eurostock Digital','Los Hermanos'],['A3744','Guilherme Vitt','Los Hermanos'],['A98943','Israel Gusso','Los Hermanos'],['A97096','Júlia Mendonça','Los Hermanos'],
  ['A39869','Fernando Parisotto','Advisors'],['A20680','Francisco Dall Agnol','Advisors'],['A50655','Paulo Bortolini','Advisors'],['A1998','Icaro Piacini','Outliers'],['A42105','Joceane Lenhart','Outliers'],['A59147','Lucas Bach','Outliers'],['A47707','Mateus Brandão','Outliers'],['A56902','Daniel Mastalir','Anywhere'],['A56903','Leonardo Dutra','Anywhere'],
  ['A54287','Bruno Giacomuzzi','Operacionais'],['A22616','Enzo Hejazi','Operacionais'],['A61852','Gabriel Berté','Operacionais'],['A22038','José Colling','Operacionais'],['A20557','Milena Portela','Operacionais'],['A33788','Nicolas Gotz','Operacionais'],
].reduce((map,[code,name,squad])=>{map[code]={code,name,squad};return map;},{});

async function upstash(commands) {
  const response = await fetch(process.env.KV_REST_API_URL + '/pipeline', {
    method:'POST',
    headers:{Authorization:'Bearer ' + process.env.KV_REST_API_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify(commands),
  });
  if (!response.ok) throw new Error('Upstash error ' + response.status + ': ' + await response.text());
  const data = await response.json();
  const failed = data.find(item=>item?.error);
  if (failed) throw new Error(failed.error);
  return data;
}

async function legacyRecords() {
  try {
    const result = await upstash([['GET',LEGACY_KEY]]);
    const raw = result[0]?.result;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

async function streamRecords() {
  try {
    const result = await upstash([['LRANGE',STREAM_KEY,'0','-1']]);
    return (result[0]?.result || []).map(raw=>{try{return JSON.parse(raw);}catch{return null;}}).filter(Boolean);
  } catch { return []; }
}

async function allRecords() {
  const [legacy,stream] = await Promise.all([legacyRecords(),streamRecords()]);
  const seen = new Set();
  return [...legacy,...stream].filter(record=>record?.id && !seen.has(record.id) && seen.add(record.id)).sort((a,b)=>(a.ts||0)-(b.ts||0));
}

function adminAuthorized(req) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  return req.headers['x-admin-secret'] === secret;
}

export default async function handler(req,res) {
  const origin = process.env.APP_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin',origin);
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Admin-Secret');
  res.setHeader('Cache-Control','no-store');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(500).json({error:'KV nao configurado nas env vars da Vercel'});
  }

  try {
    if (req.method === 'GET') return res.status(200).json({records:await allRecords()});

    if (req.method === 'POST') {
      const {action,record} = req.body || {};
      if (action === 'add') {
        if (!record?.code || !VALID_TYPES.has(record?.type)) return res.status(400).json({error:'Registro invalido'});
        const assessor = ASSESSORS[String(record.code).toUpperCase()];
        if (!assessor) return res.status(400).json({error:'Codigo de assessor nao autorizado'});
        const ts = Date.now();
        const newRec = {id:`${assessor.code}_${record.type}_${ts}_${Math.random().toString(36).slice(2,8)}`,code:assessor.code,name:assessor.name,squad:assessor.squad,type:record.type,ts};
        await upstash([['RPUSH',STREAM_KEY,JSON.stringify(newRec)]]);
        return res.status(200).json({ok:true,record:newRec});
      }

      if (action === 'clear') {
        if (!adminAuthorized(req)) return res.status(403).json({error:'Operacao administrativa nao autorizada'});
        await upstash([['DEL',LEGACY_KEY],['DEL',STREAM_KEY]]);
        return res.status(200).json({ok:true});
      }

      return res.status(400).json({error:'action invalida. Use: add ou clear'});
    }
    return res.status(405).json({error:'Metodo nao permitido'});
  } catch (error) {
    console.error('[KV error]',error);
    return res.status(500).json({error:error.message});
  }
}
