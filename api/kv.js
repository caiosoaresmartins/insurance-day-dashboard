import {BUSINESS_TIMEZONE,requestSession} from './_lib/campaignAuth.js';

const SUPABASE_URL='https://xuicmbbhawozqjgqrcvj.supabase.co';
const SUPABASE_KEY='sb_publishable_YaoN6J9iolPcqyhnjqSU-Q_P2KCeXNy';
const ACTION_TYPES={add_agendada:'R1',add_realizada:'R2',add_venda:'Venda'};

function monthKey(ts){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:BUSINESS_TIMEZONE,year:'numeric',month:'2-digit'}).formatToParts(new Date(ts));
  return `${parts.find(p=>p.type==='year')?.value}-${parts.find(p=>p.type==='month')?.value}`;
}

function normalize(row){
  return {
    id:row.id,code:row.code,name:row.name,squad:row.squad,type:row.type,ts:Number(row.ts),status:row.status,
    source:row.source,createdBy:row.created_by||row.createdBy||null,deletedAt:row.deleted_at?Number(row.deleted_at):null,
    deletedBy:row.deleted_by||null,deleteReason:row.delete_reason||null,
  };
}

async function rpc(name,body){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{
    method:'POST',
    headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},
    body:JSON.stringify(body||{}),
  });
  const text=await r.text();
  let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!r.ok){const message=data?.message||data?.hint||data?.details||String(data||'Supabase RPC error');throw new Error(message)}
  return data;
}

function visibleByScope(records,scope){
  if(scope==='all')return records;
  const current=monthKey(Date.now());
  return records.filter(r=>r?.ts&&monthKey(r.ts)===current);
}

function cors(req,res){
  res.setHeader('Access-Control-Allow-Origin',process.env.APP_ORIGIN||'*');
  res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, X-Auditor-Pin');
  res.setHeader('Cache-Control','no-store');
}

export default async function handler(req,res){
  cors(req,res);if(req.method==='OPTIONS')return res.status(200).end();
  try{
    const session=requestSession(req);
    if(req.method==='GET'){
      if(!session)return res.status(200).json({records:[],scope:'public',authenticated:false,timezone:BUSINESS_TIMEZONE});
      const scope=String(req.query?.scope||'current').toLowerCase()==='all'?'all':'current';
      let rows=[];
      if(session.role==='admin'){
        const pin=String(req.headers['x-auditor-pin']||'');
        if(!pin)return res.status(401).json({error:'PIN do auditor ausente'});
        rows=await rpc('campaign_records_all',{p_pin:pin});
      }else{
        rows=await rpc('campaign_records_for_code',{p_code:session.code});
      }
      const records=visibleByScope((Array.isArray(rows)?rows:[]).map(normalize),scope);
      return res.status(200).json({records,scope,authenticated:true,role:session.role,timezone:BUSINESS_TIMEZONE,storage:'supabase'});
    }

    if(req.method==='POST'){
      if(!session)return res.status(401).json({error:'Faça login para continuar'});
      const {action,record,recordId,reason}=req.body||{};
      const type=ACTION_TYPES[action];
      if(type){
        let saved;
        if(session.role==='admin'){
          const pin=String(req.headers['x-auditor-pin']||'');
          if(!pin)return res.status(401).json({error:'PIN do auditor ausente'});
          saved=await rpc('campaign_record_admin',{p_pin:pin,p_code:String(record?.code||'').toUpperCase(),p_type:type});
        }else{
          saved=await rpc('campaign_record',{p_code:session.code,p_type:type,p_actor:session.code,p_source:'assessor'});
        }
        return res.status(200).json({ok:true,record:saved,storage:'supabase'});
      }

      if(action==='delete'){
        if(session.role!=='admin')return res.status(403).json({error:'Somente o auditor pode excluir registros'});
        const pin=String(req.headers['x-auditor-pin']||'');
        if(!pin)return res.status(401).json({error:'PIN do auditor ausente'});
        const result=await rpc('campaign_delete',{p_pin:pin,p_record_id:recordId,p_reason:String(reason||'Ajuste de auditoria').slice(0,300)});
        return res.status(200).json({ok:true,result,storage:'supabase'});
      }

      return res.status(400).json({error:'Ação inválida'});
    }
    return res.status(405).json({error:'Metodo nao permitido'});
  }catch(error){
    console.error('[Campaign storage error]',error);
    return res.status(500).json({error:error.message||'Falha no armazenamento da campanha'});
  }
}
