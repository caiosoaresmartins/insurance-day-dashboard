import crypto from 'crypto';
import {createSession} from './_lib/campaignAuth.js';

const PRIMARY_MANAGER_PIN_SHA256='8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';

function managerForCredential(value){
  const supplied=String(value||'');
  const hash=crypto.createHash('sha256').update(supplied).digest('hex');
  if(hash===PRIMARY_MANAGER_PIN_SHA256||(process.env.ADMIN_SECRET&&supplied===String(process.env.ADMIN_SECRET))){
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
  if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});

  try{
    const {mode='admin',secret}=req.body||{};
    if(mode!=='admin')return res.status(403).json({error:'Este painel aceita somente acesso de gestor'});
    const manager=managerForCredential(secret);
    if(!manager)return res.status(401).json({error:'Credencial de gestor inválida'});
    const token=createSession({role:'admin',managerId:manager.id,managerName:manager.name,name:manager.name},8);
    return res.status(200).json({ok:true,token,user:{role:'admin',managerId:manager.id,managerName:manager.name,name:manager.name}});
  }catch(error){
    console.error('[auth error]',error);
    return res.status(500).json({error:error.message||'Falha de autenticação'});
  }
}
