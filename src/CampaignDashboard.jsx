import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {SEPTEMBER_CAMPAIGN as CAMPAIGN} from './campaignConfig.js';

const EVENT_META={
  R1:{label:'REUNIÃO AGENDADA',short:'AGENDADA',goal:3,reward:'R$ 100',icon:'⚡',color:'#4f8cff'},
  R2:{label:'REUNIÃO REALIZADA',short:'REALIZADA',goal:1,reward:'R$ 200',icon:'◆',color:'#d4af37'},
  Venda:{label:'VENDA',short:'VENDA',goal:1,reward:'50% DE COMISSÃO',icon:'♛',color:'#16c784'},
};
const TICK=15;

function initials(name=''){return name.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'EU';}
function fmt(ts){try{return new Date(ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}catch{return ''}}

function useCampaignData(){
  const[records,setRecords]=useState([]);const[advisors,setAdvisors]=useState([]);const[loading,setLoading]=useState(true);const[error,setError]=useState('');const[countdown,setCountdown]=useState(TICK);
  const load=useCallback(async()=>{
    try{
      const[r1,r2]=await Promise.all([fetch('/api/kv',{cache:'no-store'}),fetch('/api/assessors',{cache:'no-store'})]);
      const d1=await r1.json();const d2=await r2.json();
      setRecords(Array.isArray(d1.records)?d1.records:[]);
      const list=Array.isArray(d2.assessors)?d2.assessors:Array.isArray(d2)?d2:[];
      setAdvisors(list.filter(a=>a.ativo!==false&&a.Ativo!==false));setError('');setCountdown(TICK);
    }catch(e){setError(e.message||'Falha ao atualizar campanha');}finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();const id=setInterval(load,TICK*1000);return()=>clearInterval(id)},[load]);
  useEffect(()=>{const id=setInterval(()=>setCountdown(v=>v<=1?TICK:v-1),1000);return()=>clearInterval(id)},[]);
  const add=useCallback(async(user,type)=>{
    const optimistic={id:'tmp-'+Date.now(),code:user.code,name:user.name,squad:user.squad,type,ts:Date.now()};
    setRecords(prev=>[...prev,optimistic]);
    const r=await fetch('/api/kv',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'add',record:{code:user.code,name:user.name,squad:user.squad,type}})});
    if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.error||'Não foi possível registrar');}
    setTimeout(load,700);
  },[load]);
  return{records,advisors,loading,error,countdown,load,add};
}

function buildStats(advisors,records){
  const map={};
  advisors.forEach(a=>{const code=a.code||a.codigo||a['Código XP'];if(!code)return;map[code]={code,name:a.name||a.nome||a.Nome||code,squad:a.squad||a.Squad||'',color:a.color||a.cor||a.Cor||'#d4af37',R1:0,R2:0,Venda:0};});
  records.forEach(r=>{if(!map[r.code])map[r.code]={code:r.code,name:r.name||r.code,squad:r.squad||'',color:'#d4af37',R1:0,R2:0,Venda:0};if(map[r.code][r.type]!=null)map[r.code][r.type]++;});
  return Object.values(map);
}

function unlocked(a){return{agenda:a.R1>=3,realizada:a.R2>=1,venda:a.Venda>=1};}
function statusLabel(a){const u=unlocked(a);if(u.venda)return'50% COMISSÃO';if(u.realizada)return'R$ 200';if(u.agenda)return'R$ 100';return'EM JOGO';}

function ProgressCard({type,value}){
  const m=EVENT_META[type];const pct=Math.min(100,(value/m.goal)*100);const done=value>=m.goal;
  return <article className={`mseg-progress-card ${done?'done':''}`}>
    <div className="mseg-progress-top"><span className="mseg-progress-icon" style={{color:m.color}}>{m.icon}</span><div><small>{m.label}</small><strong>{m.reward}</strong></div><b style={{color:done?m.color:'#7a7a7a'}}>{Math.min(value,m.goal)}/{m.goal}</b></div>
    <div className="mseg-track"><span style={{width:`${pct}%`,background:m.color}}/></div>
    <p>{done?'PRÊMIO DESBLOQUEADO':type==='R1'?`Faltam ${Math.max(0,m.goal-value)} agendamento(s)`:'Faça o registro para desbloquear'}</p>
  </article>
}

function LoginCard({advisors,onLogin}){
  const[code,setCode]=useState('');
  const sorted=[...advisors].sort((a,b)=>(a.name||a.nome||'').localeCompare(b.name||b.nome||''));
  return <section className="mseg-login-card">
    <span className="mseg-kicker">ÁREA DO ASSESSOR</span><h2>Entre para registrar sua produção</h2><p>Selecione seu nome. Todo registro entra no acompanhamento do Mês do Seguro.</p>
    <select value={code} onChange={e=>setCode(e.target.value)}><option value="">Selecione o assessor...</option>{sorted.map(a=>{const c=a.code||a.codigo||a['Código XP'];return <option key={c} value={c}>{a.name||a.nome||a.Nome} · {a.squad||a.Squad||''}</option>})}</select>
    <button disabled={!code} onClick={()=>{const a=sorted.find(x=>(x.code||x.codigo||x['Código XP'])===code);if(a)onLogin({code,name:a.name||a.nome||a.Nome,squad:a.squad||a.Squad||'',color:a.color||a.cor||a.Cor||'#d4af37'})}}>ENTRAR NA CAMPANHA →</button>
  </section>
}

function AdvisorPanel({user,stats,records,onAdd,onLogout}){
  const[saving,setSaving]=useState('');const[msg,setMsg]=useState('');
  const mine=stats.find(x=>x.code===user.code)||{...user,R1:0,R2:0,Venda:0};
  const recent=records.filter(r=>r.code===user.code).slice(-5).reverse();
  async function add(type){setSaving(type);setMsg('');try{await onAdd(user,type);setMsg(`${EVENT_META[type].short} registrada com sucesso.`);}catch(e){setMsg(e.message)}finally{setSaving('');setTimeout(()=>setMsg(''),3200)}}
  return <div className="mseg-advisor-wrap">
    <section className="mseg-user-card"><div className="mseg-avatar" style={{borderColor:user.color}}>{initials(user.name)}</div><div className="mseg-user-copy"><small>ASSESSOR</small><h2>{user.name}</h2><p>{user.squad} · {user.code}</p></div><button className="mseg-ghost" onClick={onLogout}>SAIR</button></section>
    <section className="mseg-section"><div className="mseg-section-title"><div><span className="mseg-kicker">SEU PROGRESSO</span><h3>Mês do Seguro</h3></div><span className="mseg-live">● AO VIVO</span></div><div className="mseg-progress-grid"><ProgressCard type="R1" value={mine.R1}/><ProgressCard type="R2" value={mine.R2}/><ProgressCard type="Venda" value={mine.Venda}/></div></section>
    <section className="mseg-section"><div className="mseg-section-title"><div><span className="mseg-kicker">REGISTRAR</span><h3>Produção de setembro</h3></div></div><div className="mseg-action-grid">
      {Object.entries(EVENT_META).map(([type,m])=><button key={type} className="mseg-action" style={{'--accent':m.color}} disabled={!!saving} onClick={()=>add(type)}><span>{m.icon}</span><b>{m.short}</b><small>{m.label}</small><em>{m.reward}</em>{saving===type&&<i>REGISTRANDO...</i>}</button>)}
    </div>{msg&&<div className="mseg-toast">{msg}</div>}</section>
    {recent.length>0&&<section className="mseg-section"><div className="mseg-section-title"><div><span className="mseg-kicker">ÚLTIMOS REGISTROS</span><h3>Sua atividade</h3></div></div><div className="mseg-feed">{recent.map((r,i)=>{const m=EVENT_META[r.type]||EVENT_META.R1;return <div key={r.id||i}><span style={{color:m.color}}>{m.icon}</span><b>{m.label}</b><small>{fmt(r.ts)}</small><strong>{m.reward}</strong></div>})}</div></section>}
  </div>
}

export default function CampaignDashboard(){
  const{records,advisors,loading,error,countdown,add}=useCampaignData();
  const[user,setUser]=useState(null);const[view,setView]=useState('overview');
  const stats=useMemo(()=>buildStats(advisors,records),[advisors,records]);
  const totals=useMemo(()=>stats.reduce((a,x)=>({R1:a.R1+x.R1,R2:a.R2+x.R2,Venda:a.Venda+x.Venda}),{R1:0,R2:0,Venda:0}),[stats]);
  const ranked=useMemo(()=>[...stats].sort((a,b)=>b.Venda-a.Venda||b.R2-a.R2||b.R1-a.R1||a.name.localeCompare(b.name)),[stats]);
  const active=stats.filter(a=>a.R1+a.R2+a.Venda>0).length;
  const unlockTotals=stats.reduce((a,x)=>{const u=unlocked(x);a.agenda+=u.agenda?1:0;a.realizada+=u.realizada?1:0;a.venda+=u.venda?1:0;return a},{agenda:0,realizada:0,venda:0});
  return <div className="mseg-app">
    <div className="mseg-bg"/><header className="mseg-header"><div className="mseg-brand"><span className="mseg-brand-mark">E</span><div><b>EUROSTOCK</b><small>INSURANCE DAY · SETEMBRO 2026</small></div></div><nav><button className={view==='overview'?'active':''} onClick={()=>setView('overview')}>VISÃO GERAL</button><button className={view==='ranking'?'active':''} onClick={()=>setView('ranking')}>RANKING</button><button className={view==='advisor'?'active':''} onClick={()=>setView('advisor')}>MEU PROGRESSO</button></nav><div className="mseg-sync">ATUALIZA EM {countdown}s</div></header>
    <main className="mseg-main">
      {error&&<div className="mseg-error">{error}</div>}
      {view==='overview'&&<>
        <section className="mseg-hero"><div><span className="mseg-kicker">SETEMBRO · CAMPANHA OFICIAL</span><h1>MÊS DO <em>SEGURO</em></h1><p>{CAMPAIGN.slogan}. Três metas simples, recompensa imediata e acompanhamento em tempo real.</p></div><div className="mseg-hero-rule"><small>REGRA DO MÊS</small><strong>3 → 1 → 1</strong><span>3 agendadas · 1 realizada · 1 venda</span></div></section>
        <section className="mseg-kpis"><article><small>REUNIÕES AGENDADAS</small><strong>{totals.R1}</strong><span>meta que libera R$ 100</span></article><article><small>REUNIÕES REALIZADAS</small><strong>{totals.R2}</strong><span>libera R$ 200</span></article><article><small>VENDAS</small><strong>{totals.Venda}</strong><span>50% de comissão</span></article><article><small>ASSESSORES NO JOGO</small><strong>{active}</strong><span>de {stats.length||advisors.length} ativos</span></article></section>
        <section className="mseg-two-col"><div className="mseg-section"><div className="mseg-section-title"><div><span className="mseg-kicker">PRÊMIOS DESBLOQUEADOS</span><h3>Resultado da campanha</h3></div></div><div className="mseg-unlocks"><article><span>⚡</span><div><b>{unlockTotals.agenda}</b><small>assessores</small></div><strong>R$ 100</strong><p>3 reuniões agendadas</p></article><article><span>◆</span><div><b>{unlockTotals.realizada}</b><small>assessores</small></div><strong>R$ 200</strong><p>1 reunião realizada</p></article><article><span>♛</span><div><b>{unlockTotals.venda}</b><small>assessores</small></div><strong>50%</strong><p>comissão na venda</p></article></div></div>
        <div className="mseg-section"><div className="mseg-section-title"><div><span className="mseg-kicker">TOP DA CAMPANHA</span><h3>Destaques do Mês do Seguro</h3></div><button className="mseg-link" onClick={()=>setView('ranking')}>VER RANKING →</button></div><div className="mseg-mini-ranking">{ranked.slice(0,6).map((a,i)=><div key={a.code}><em>{String(i+1).padStart(2,'0')}</em><span><b>{a.name}</b><small>{a.squad}</small></span><div><strong>{a.Venda}V · {a.R2}R · {a.R1}A</strong><small>{statusLabel(a)}</small></div></div>)}</div></div></section>
      </>}
      {view==='ranking'&&<section className="mseg-section mseg-ranking-page"><div className="mseg-section-title"><div><span className="mseg-kicker">RANKING DE SETEMBRO</span><h2>Mês do Seguro</h2><p>Ordem: vendas, reuniões realizadas e reuniões agendadas.</p></div></div><div className="mseg-ranking-table"><header><span>#</span><span>ASSESSOR</span><span>AGENDADAS</span><span>REALIZADAS</span><span>VENDAS</span><span>STATUS</span></header>{ranked.map((a,i)=><div key={a.code}><em>{i+1}</em><span className="mseg-rank-name"><i style={{borderColor:a.color}}>{initials(a.name)}</i><b>{a.name}<small>{a.squad} · {a.code}</small></b></span><strong>{a.R1}</strong><strong>{a.R2}</strong><strong>{a.Venda}</strong><span className="mseg-status">{statusLabel(a)}</span></div>)}</div></section>}
      {view==='advisor'&&(user?<AdvisorPanel user={user} stats={stats} records={records} onAdd={add} onLogout={()=>setUser(null)}/>:<LoginCard advisors={advisors} onLogin={u=>setUser(u)}/>)}
      {loading&&<div className="mseg-loading">ATUALIZANDO MÊS DO SEGURO...</div>}
    </main>
  </div>;
}
