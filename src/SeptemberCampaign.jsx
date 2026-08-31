import React,{useEffect,useMemo,useState} from 'react';
import {SEPTEMBER_CAMPAIGN as CAMPAIGN} from './campaignConfig.js';
import CampaignIntroCinematic from './CampaignIntroCinematic.jsx';

function useCampaignRecords(){
  const[records,setRecords]=useState([]);
  useEffect(()=>{let live=true;async function load(){try{const r=await fetch('/api/kv',{cache:'no-store'});const d=await r.json();if(live)setRecords(Array.isArray(d.records)?d.records:[]);}catch{}}load();const id=setInterval(load,15000);return()=>{live=false;clearInterval(id);};},[]);
  return records;
}

export default function SeptemberCampaign(){
  const records=useCampaignRecords();
  const[showIntro,setShowIntro]=useState(()=>sessionStorage.getItem('sep-intro-seen')!=='1');
  const[open,setOpen]=useState(false);const[userCode,setUserCode]=useState('');
  const closeIntro=()=>{sessionStorage.setItem('sep-intro-seen','1');setShowIntro(false)};
  const replayIntro=()=>{setOpen(false);sessionStorage.removeItem('sep-intro-seen');setShowIntro(true)};
  const byAdvisor=useMemo(()=>{const m={};records.forEach(r=>{const a=m[r.code]||(m[r.code]={code:r.code,name:r.name,squad:r.squad,R1:0,R2:0,Venda:0});if(a[r.type]!=null)a[r.type]++;});return m;},[records]);
  const advisors=Object.values(byAdvisor).sort((a,b)=>b.Venda-a.Venda||b.R2-a.R2||b.R1-a.R1);
  const selected=byAdvisor[userCode]||null;
  return <>
    {showIntro&&<CampaignIntroCinematic onClose={closeIntro}/>} 
    <button className="campaign-launcher" onClick={()=>setOpen(true)}>⚡ CEO Endoidou</button>
    {open&&<div className="campaign-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><section className="campaign-panel campaign-panel-v2">
      <header><div><small>{CAMPAIGN.eyebrow}</small><h2>{CAMPAIGN.name}</h2><p>Produção de setembro · metas rápidas e recompensa imediata</p></div><button onClick={()=>setOpen(false)}>✕</button></header>
      <div className="campaign-v2-layout">
        <main className="campaign-v2-main">
          <div className="campaign-rule-grid campaign-rule-grid-v2">{CAMPAIGN.rewards.map(rule=><article key={rule.id}><span>{rule.icon}</span><small>{rule.title}</small><h3>{rule.rule}</h3><b>{rule.reward}</b></article>)}</div>
          <div className="campaign-user-picker"><label>PROGRESSO INDIVIDUAL</label><select value={userCode} onChange={e=>setUserCode(e.target.value)}><option value="">Selecione o assessor...</option>{advisors.map(a=><option value={a.code} key={a.code}>{a.name}</option>)}</select></div>
          {selected?<div className="campaign-progress campaign-progress-v2"><div><strong>{selected.name}</strong><span>{selected.squad}</span></div>{CAMPAIGN.rewards.map(rule=>{const current=selected[rule.type]||0;const done=current>=rule.goal;return <article key={rule.id} className={done?'done':''}><div><span>{rule.icon}</span><div><b>{rule.rule}</b><small>{done?'DESBLOQUEADO':`${current}/${rule.goal}`}</small></div></div><strong>{done?rule.reward:'EM PROGRESSO'}</strong></article>})}</div>:<div className="campaign-empty-state"><strong>Selecione um assessor</strong><span>Veja quanto falta para desbloquear cada prêmio.</span></div>}
        </main>
        <aside className="campaign-v2-side">
          <div className="campaign-leaderboard"><h3>Quem virou a mesa</h3>{advisors.length?advisors.slice(0,8).map((a,i)=><div key={a.code}><em>{i+1}</em><span><b>{a.name}</b><small>{a.squad}</small></span><strong>{a.Venda>0?'50% comissão':a.R2>0?'R$ 200':a.R1>=3?'R$ 100':'Em jogo'}</strong></div>):<p className="campaign-no-data">Produção zerada. O jogo começa em setembro.</p>}</div>
          <div className="campaign-summary-card"><small>REGRA DA CAMPANHA</small><strong>3 → 1 → 1</strong><span>3 agendadas · 1 realizada · 1 venda</span></div>
        </aside>
      </div>
      <footer><button onClick={replayIntro}>▶ REVER ABERTURA</button><span>Campanha válida em setembro de 2026</span></footer>
    </section></div>}
  </>;
}
