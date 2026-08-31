const NOTION_API = 'https://api.notion.com/v1';
const NOTION_KEY = process.env.NOTION_KEY;
const NOTION_VERSION = '2022-06-28';
const ASSESSORS_DATABASE_ID = 'd5fa57e757ba41e7a3d97091c161153c';

export const FALLBACK_ASSESSORS = [
  ['A73614','Bruno Bruel','Alavancados','#2563eb','Assessor'],['A26347','Guilherme Monticelli','Alavancados','#2563eb','Assessor'],['A38636','Hellen Carvalho','Alavancados','#2563eb','Assessor'],['A38548','Igor Bairros','Alavancados','#2563eb','Assessor'],['A96379','Leonardo Vacca','Alavancados','#2563eb','Assessor'],['A51532','Nicolas Mallmann','Alavancados','#2563eb','Assessor'],['A26305','Pedro Couto','Alavancados','#2563eb','Assessor'],['A27267','Rodrigo Lisboa','Alavancados','#2563eb','Assessor'],['A27321','Vitória Vidor','Alavancados','#2563eb','Assessor'],['A42881','Ygor Walter','Alavancados','#2563eb','Assessor'],
  ['A1607','Assessoria Eurostock','Los Hermanos','#92400e','Assessoria'],['A98897','Daniel Mendonça','Los Hermanos','#92400e','Assessor'],['A73851','Eduardo Freitas','Los Hermanos','#92400e','Assessor'],['A26969','Eurostock Digital','Los Hermanos','#92400e','Assessoria'],['A3744','Guilherme Vitt','Los Hermanos','#92400e','Assessor'],['A98943','Israel Gusso','Los Hermanos','#92400e','Assessor'],['A97096','Júlia Mendonça','Los Hermanos','#92400e','Assessor'],
  ['A39869','Fernando Parisotto','Advisors','#6d28d9','Assessor'],['A20680','Francisco Dall Agnol','Advisors','#6d28d9','Assessor'],['A50655','Paulo Bortolini','Advisors','#6d28d9','Assessor'],
  ['A1998','Icaro Piacini','Outliers','#b45309','Assessor'],['A42105','Joceane Lenhart','Outliers','#b45309','Assessor'],['A59147','Lucas Bach','Outliers','#b45309','Assessor'],['A47707','Mateus Brandão','Outliers','#b45309','Assessor'],
  ['A56902','Daniel Mastalir','Anywhere','#065f46','Assessor'],['A56903','Leonardo Dutra','Anywhere','#065f46','Assessor'],
  ['A54287','Bruno Giacomuzzi','Operacionais','#374151','Operacional'],['A22616','Enzo Hejazi','Operacionais','#374151','Operacional'],['A61852','Gabriel Berté','Operacionais','#374151','Operacional'],['A22038','José Colling','Operacionais','#374151','Operacional'],['A20557','Milena Portela','Operacionais','#374151','Operacional'],['A33788','Nicolas Gotz','Operacionais','#374151','Operacional'],
].map(([code,name,squad,color,type],index)=>({code,name,squad,color,type,order:index+1,active:true}));

function text(property) {
  const values = property?.title || property?.rich_text || [];
  return values.map(v => v.plain_text || v.text?.content || '').join('');
}

function normalize(page) {
  const p = page.properties || {};
  return {
    code: text(p['Código XP']), name: text(p.Nome), squad: p.Squad?.select?.name || '',
    color: text(p.Cor) || '#374151', type: p.Tipo?.select?.name || 'Assessor',
    order: Number(p.Ordem?.number || 999), active: Boolean(p.Ativo?.checkbox),
  };
}

export async function getAssessors() {
  if (!NOTION_KEY) return FALLBACK_ASSESSORS;
  const response = await fetch(`${NOTION_API}/databases/${ASSESSORS_DATABASE_ID}/query`, {
    method:'POST', headers:{Authorization:`Bearer ${NOTION_KEY}`,'Notion-Version':NOTION_VERSION,'Content-Type':'application/json'},
    body:JSON.stringify({page_size:100}),
  });
  if (!response.ok) throw new Error(`Notion ${response.status}`);
  const data = await response.json();
  return (data.results || []).map(normalize).filter(a=>a.active && a.code && a.name).sort((a,b)=>a.order-b.order);
}

export default async function handler(req,res) {
  res.setHeader('Cache-Control','s-maxage=60, stale-while-revalidate=300');
  if (req.method !== 'GET') return res.status(405).json({error:'Metodo nao permitido'});
  try { return res.status(200).json({assessors:await getAssessors(),source:NOTION_KEY?'notion':'fallback'}); }
  catch (error) { console.error('[assessors]',error); return res.status(200).json({assessors:FALLBACK_ASSESSORS,source:'fallback'}); }
}
