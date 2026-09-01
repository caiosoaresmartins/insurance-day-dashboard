import {advisorForCode,createSession} from './_lib/campaignAuth.js';

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
      if(!process.env.ADMIN_SECRET)return res.status(500).json({error:'ADMIN_SECRET nao configurado'});
      if(String(secret||'')!==String(process.env.ADMIN_SECRET))return res.status(401).json({error:'Credencial de auditor invalida'});
      const token=createSession({role:'admin',name:'Auditor da Campanha'},8);
      return res.status(200).json({ok:true,token,user:{role:'admin',name:'Auditor da Campanha'}});
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
