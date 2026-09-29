import crypto from 'crypto';
import {advisorForCode,createSession} from './_lib/campaignAuth.js';

const AUDITOR_PIN_SHA256='8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';

function managerForCredential(value){
  const supplied=String(value||'');
  const hash=crypto.createHash('sha256').update(supplied).digest('hex');
  if(hash===AUDITOR_PIN_SHA256||Boolean(process.env.ADMIN_SECRET)&&supplied===String(process.env.ADMIN_SECRET)){
    return{id:'manager-primary',name:'Gestor principal'};
  }
  const configured=String(process.env.MANAGER_2_PIN||'');
  const configuredHash=String(process.env.MANAGER_2_PIN_SHA256||'');
  if((configured&&supplied===configured)||(configuredHash&&hash===configuredHash)){
    return{id:'manager-secondary',name:'Gestor comercial 2'};
  }
  return null;
}

export default async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin',process.env.APP_ORIGIN||'*');
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Cache-Control','no-store');
  if(req.method==='OPTIONS')return res.status(200).end();
  if(req.method!=='POST')return res.status(405).json({error:'Metodo nao permitido'});

  try{
    const {mode='advisor',code,secret}=req.body||{};
    if(mode==='admin'){
      const manager=managerForCredential(secret);
      if(!manager)return res.status(401).json({error:'Credencial de gestor invalida'});
      const token=createSession({role:'admin',managerId:manager.id,managerName:manager.name,name:manager.name},8);
      return res.status(200).json({ok:true,token,user:{role:'admin',managerId:manager.id,managerName:manager.name,name:manager.name}});
    }

    const advisor=advisorForCode(code);
    if(!advisor)return res.status(401).json({error:'Codigo de assessor invalido'});
    const token=createSession({role:'advisor',code:advisor.code,name:advisor.name,squad:advisor.squad},12);
    return res.status(200).json({ok:true,token,user:{role:'advisor',...advisor}});
  }catch(error){
    console.error('[auth error]',error);
    return res.status(500).json({error:error.message||'Falha de autenticacao'});
  }
}
