import {ASSESSORS,BUSINESS_TIMEZONE,VALID_TYPES,advisorForCode,requestSession} from './_lib/campaignAuth.js';

const LEGACY_KEY='insurance_records_2026';
const STREAM_KEY='insurance_records_2026_v2';
const LEDGER_KEY='insurance_campaign_ledger_2026_v3';

async function upstash(commands){
  const response=await fetch(process.env.KV_REST_API_URL+'/pipeline',{
    method:'POST',headers:{Authorization:'Bearer '+process.env.KV_REST_API_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(commands),
  });
  if(!response.ok)throw new Error('Upstash error '+response.status+': '+await response.text());
  const data=await response.json();const failed=data.find(item=>item?.error);if(failed)throw new Error(failed.error);return data;
}

async function readJsonList(key){
  try{const r=await upstash([['LRANGE',key,'0','-1']]);return(r[0]?.result||[]).map(x=>{try{return JSON.parse(x)}catch{return null}}).filter(Boolean);}catch{return[]}
}
async function legacyRecords(){
  try{const r=await upstash([['GET',LEGACY_KEY]]);const raw=r[0]?.result;if(!raw)return[];const parsed=JSON.parse(raw);return Array.isArray(parsed)?parsed:[];}catch{return[]}
}
async function streamRecords(){return readJsonList(STREAM_KEY)}
async function ledgerEvents(){return readJsonList(LEDGER_KEY)}

function monthKey(ts){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:BUSINESS_TIMEZONE,year:'numeric',month:'2-digit'}).formatToParts(new Date(ts));
  return `${parts.find(p=>p.type==='year')?.value}-${parts.find(p=>p.type==='month')?.value}`;
}

async function materialize(){
  const[legacy,stream,events]=await Promise.all([legacyRecords(),streamRecords(),ledgerEvents()]);
  const base=[...legacy,...stream];const recordEvents=events.filter(e=>e.kind==='record').map(e=>e.record).filter(Boolean);
  const seen=new Set();const records=[...base,...recordEvents].filter(r=>r?.id&&!seen.has(r.id)&&seen.add(r.id));
  const deletions=new Map();events.filter(e=>e.kind==='delete'&&e.recordId).forEach(e=>deletions.set(e.recordId,e));
  const active=[];const audit=[];
  records.forEach(r=>{
    const deletion=deletions.get(r.id)||null;
    const normalized={...r,status:deletion?'deleted':'active',deletedAt:deletion?.ts||null,deletedBy:deletion?.actor||null,deleteReason:deletion?.reason||null};
    audit.push(normalized);if(!deletion)active.push(normalized);
  });
  active.sort((a,b)=>(a.ts||0)-(b.ts||0));audit.sort((a,b)=>(a.ts||0)-(b.ts||0));
  return{active,audit,events};
}

function visibleRecords(records,session,scope){
  let out=records;
  if(session.role==='advisor')out=out.filter(r=>r.code===session.code);
  if(scope!=='all'){const current=monthKey(Date.now());out=out.filter(r=>r?.ts&&monthKey(r.ts)===current);}
  return out;
}

function cors(req,res){
  res.setHeader('Access-Control-Allow-Origin',process.env.APP_ORIGIN||'*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.setHeader('Cache-Control','no-store');
}

export default async function handler(req,res){
  cors(req,res);if(req.method==='OPTIONS')return res.status(200).end();
  if(!process.env.KV_REST_API_URL||!process.env.KV_REST_API_TOKEN)return res.status(500).json({error:'KV nao configurado nas env vars da Vercel'});

  try{
    const session=requestSession(req);
    if(req.method==='GET'){
      if(!session)return res.status(200).json({records:[],scope:'public',authenticated:false,timezone:BUSINESS_TIMEZONE});
      const{active,audit,events}=await materialize();const scope=String(req.query?.scope||'current').toLowerCase()==='all'?'all':'current';
      if(session.role==='admin'&&String(req.query?.audit||'')==='1'){
        return res.status(200).json({records:visibleRecords(audit,session,scope),events,scope,authenticated:true,role:'admin',timezone:BUSINESS_TIMEZONE});
      }
      return res.status(200).json({records:visibleRecords(active,session,scope),scope,authenticated:true,role:session.role,timezone:BUSINESS_TIMEZONE});
    }

    if(req.method==='POST'){
      if(!session)return res.status(401).json({error:'Faça login para continuar'});
      const{action,record,recordId,reason}=req.body||{};

      if(action==='add'){
        if(!VALID_TYPES.has(record?.type))return res.status(400).json({error:'Tipo de registro invalido'});
        const code=session.role==='admin'?String(record?.code||'').toUpperCase():session.code;
        const assessor=advisorForCode(code);if(!assessor)return res.status(400).json({error:'Codigo de assessor nao autorizado'});
        const ts=Date.now();
        const newRec={
          id:`${assessor.code}_${record.type}_${ts}_${Math.random().toString(36).slice(2,8)}`,
          code:assessor.code,name:assessor.name,squad:assessor.squad,type:record.type,ts,
          campaignId:'2026-09-ceo-endoidou',source:session.role==='admin'?'auditor':'assessor',
          createdBy:session.role==='admin'?'AUDITOR':session.code,status:'active',
        };
        const event={kind:'record',ts,actor:session.role==='admin'?'AUDITOR':session.code,role:session.role,record:newRec};
        await upstash([['RPUSH',LEDGER_KEY,JSON.stringify(event)]]);
        return res.status(200).json({ok:true,record:newRec});
      }

      if(action==='delete'){
        if(session.role!=='admin')return res.status(403).json({error:'Somente o auditor pode excluir registros'});
        if(!recordId)return res.status(400).json({error:'recordId obrigatorio'});
        const{audit}=await materialize();const target=audit.find(r=>r.id===recordId);if(!target)return res.status(404).json({error:'Registro nao encontrado'});if(target.status==='deleted')return res.status(409).json({error:'Registro ja excluido'});
        const event={kind:'delete',recordId,ts:Date.now(),actor:'AUDITOR',role:'admin',reason:String(reason||'Ajuste de auditoria').slice(0,300),snapshot:{code:target.code,name:target.name,type:target.type,ts:target.ts}};
        await upstash([['RPUSH',LEDGER_KEY,JSON.stringify(event)]]);
        return res.status(200).json({ok:true,event});
      }

      return res.status(400).json({error:'action invalida. Use add ou delete'});
    }
    return res.status(405).json({error:'Metodo nao permitido'});
  }catch(error){console.error('[KV error]',error);return res.status(500).json({error:error.message||'Falha no ledger da campanha'});}
}
