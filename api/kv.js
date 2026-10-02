import {BUSINESS_TIMEZONE,requestSession} from './_lib/campaignAuth.js';

const SUPABASE_URL='https://xuicmbbhawozqjgqrcvj.supabase.co';
const SUPABASE_KEY='sb_publishable_YaoN6J9iolPcqyhnjqSU-Q_P2KCeXNy';
const CAMPAIGN_ID='2026-cgc-cross-sell';

function normalize(row){
  return {
    id:row.id,campaignId:row.campaign_id||row.campaignId||CAMPAIGN_ID,code:row.code,name:row.name,squad:row.squad||'',
    type:row.type||'Venda',ts:Number(row.ts||row.event_ts||Date.now()),status:row.status||'active',source:row.source||'manager',
    createdBy:row.created_by||row.createdBy||null,deletedAt:row.deleted_at?Number(row.deleted_at):null,deletedBy:row.deleted_by||null,
    deleteReason:row.delete_reason||null,cardValue:Number(row.card_value??row.cardValue??0),
    insuranceValue:Number(row.insurance_value??row.insuranceValue??0),insurancePeriod:row.insurance_period||row.insurancePeriod||'mensal',
    proposalRef:row.proposal_ref||row.proposalRef||'',notes:row.notes||'',acceleratorLevel:Number(row.accelerator_level??row.acceleratorLevel??0),
  };
}
async function rpc(name,body){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${SUPABASE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify(body||{})});
  const text=await r.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!r.ok){const message=data?.message||data?.hint||data?.details||String(data||'Supabase RPC error');throw new Error(message)}
  return data;
}
function cors(req,res){res.setHeader('Access-Control-Allow-Origin',process.env.APP_ORIGIN||'*');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, X-Auditor-Pin');res.setHeader('Cache-Control','no-store');}
function managerPin(req){return String(req.headers['x-auditor-pin']||'');}

export default async function handler(req,res){
  cors(req,res);if(req.method==='OPTIONS')return res.status(200).end();
  try{
    const session=requestSession(req);
    if(!session||session.role!=='admin')return res.status(401).json({error:'Acesso exclusivo para gestores'});
    const pin=managerPin(req);if(!pin)return res.status(401).json({error:'PIN do gestor ausente'});
    if(req.method==='GET'){
      if(String(req.query?.meta||'')==='accelerators'){
        const rules=await rpc('campaign_manager_accelerators',{p_pin:pin,p_campaign_id:CAMPAIGN_ID});
        return res.status(200).json({campaignId:CAMPAIGN_ID,rules:Array.isArray(rules)?rules:[],timezone:BUSINESS_TIMEZONE});
      }
      const rows=await rpc('campaign_manager_records_all',{p_pin:pin,p_campaign_id:CAMPAIGN_ID});
      return res.status(200).json({records:(Array.isArray(rows)?rows:[]).map(normalize),scope:'campaign',campaignId:CAMPAIGN_ID,authenticated:true,role:'admin',timezone:BUSINESS_TIMEZONE,storage:'supabase'});
    }
    if(req.method==='POST'){
      const {action,record,recordId,reason}=req.body||{};
      if(action==='add_venda'){
        const code=String(record?.code||'').trim().toUpperCase(),name=String(record?.name||'').trim(),squad=String(record?.squad||'').trim();
        const cardValue=Number(record?.cardValue),insuranceValue=Number(record?.insuranceValue),insurancePeriod=String(record?.insurancePeriod||'mensal').toLowerCase();
        if(!code||!name)return res.status(400).json({error:'Selecione o assessor'});
        if(!Number.isFinite(cardValue)||cardValue<=0)return res.status(400).json({error:'Informe um valor válido para a carta'});
        if(!Number.isFinite(insuranceValue)||insuranceValue<=0)return res.status(400).json({error:'Informe um valor válido para o seguro'});
        if(!['mensal','anual','total'].includes(insurancePeriod))return res.status(400).json({error:'Informe a periodicidade do seguro'});
        const saved=await rpc('campaign_manager_record',{p_pin:pin,p_campaign_id:CAMPAIGN_ID,p_code:code,p_name:name,p_squad:squad,p_sale_date:record?.saleDate||null,p_card_value:cardValue,p_insurance_value:insuranceValue,p_insurance_period:insurancePeriod,p_proposal_ref:String(record?.proposalRef||'').trim()||null,p_notes:String(record?.notes||'').trim()||null,p_created_by:session.managerName||session.managerId||'Gestor'});
        return res.status(200).json({ok:true,record:normalize(saved),storage:'supabase'});
      }
      if(action==='delete'){
        const result=await rpc('campaign_manager_delete',{p_pin:pin,p_record_id:recordId,p_reason:String(reason||'Ajuste de campanha').slice(0,300)});
        return res.status(200).json({ok:true,result,storage:'supabase'});
      }
      return res.status(400).json({error:'Ação inválida'});
    }
    return res.status(405).json({error:'Método não permitido'});
  }catch(error){console.error('[Campaign storage error]',error);return res.status(500).json({error:error.message||'Falha no armazenamento da campanha'});}
}
