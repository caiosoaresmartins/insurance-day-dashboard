import React,{useEffect,useMemo,useState} from 'react';

const META={R1:4,R2:4,Venda:2};
const PTS={R1:30,R2:50,Venda:100};
const GOLD='#d4af37';

function monthKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;}
function monthLabel(date){return date.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase());}
function withinMonth(ts,date){const d=new Date(ts);return d.getFullYear()===date.getFullYear()&&d.getMonth()===date.getMonth();}
function aggregate(records,assessors){
  const byCode=Object.fromEntries(assessors.map(a=>[a.code,{...a,R1:0,R2:0,Venda:0,pts:0}]));
  records.forEach(r=>{const a=byCode[r.code];if(!a||!PTS[r.type])return;a[r.type]+=1;a.pts+=PTS[r.type];});
  return Object.values(byCode);
}

export default function IntelligencePanel(){
  const[open,setOpen]=useState(false),[records,setRecords]=useState([]),[assessors,setAssessors]=useState([]),[period,setPeriod]=useState(()=>new Date()),[loading,setLoading]=useState(false);
  async function load(){
    setLoading(true);
    try{
      const [kr,ar]=await Promise.all([fetch('/api/kv?scope=all',{cache:'no-store'}),fetch('/api/assessors')]);
      const [kd,ad]=await Promise.all([kr.json(),ar.json()]);
      setRecords(Array.isArray(kd.records)?kd.records:[]);setAssessors(Array.isArray(ad.assessors)?ad.assessors:[]);
    }catch(error){console.error('[intelligence]',error);}finally{setLoading(false);}
  }
  useEffect(()=>{load();const id=setInterval(load,15000);return()=>clearInterval(id);},[]);

  const stats=useMemo(()=>{
    const filtered=records.filter(r=>withinMonth(r.ts,period));
    const people=aggregate(filtered,assessors);
    const r1=people.reduce((s,a)=>s+a.R1,0),r2=people.reduce((s,a)=>s+a.R2,0),sales=people.reduce((s,a)=>s+a.Venda,0);
    const squads={};people.forEach(a=>{const s=squads[a.squad]||(squads[a.squad]={name:a.squad,pts:0,count:0,r1:0,r2:0,sales:0});s.pts+=a.pts;s.count+=1;s.r1+=a.R1;s.r2+=a.R2;s.sales+=a.Venda;});
    const squadRank=Object.values(squads).map(s=>({...s,perAdvisor:Math.round(s.pts/Math.max(1,s.count))})).sort((a,b)=>b.perAdvisor-a.perAdvisor);
    const near=people.map(a=>({...a,missingR1:Math.max(0,META.R1-a.R1),missingR2:Math.max(0,META.R2-a.R2),missingVenda:Math.max(0,META.Venda-a.Venda)})).filter(a=>a.missingR1+a.missingR2+a.missingVenda>0).sort((a,b)=>(a.missingR1+a.missingR2+a.missingVenda)-(b.missingR1+b.missingR2+b.missingVenda)||b.pts-a.pts).slice(0,5);
    const noActivity=people.filter(a=>a.R1+a.R2+a.Venda===0).length;
    const r1NoR2=people.filter(a=>a.R1>0&&a.R2===0).length;
    const r2NoSale=people.filter(a=>a.R2>0&&a.Venda===0).length;
    return {r1,r2,sales,convR1R2:r1?Math.round(r2/r1*100):0,convR2Sale:r2?Math.round(sales/r2*100):0,squadRank,near,noActivity,r1NoR2,r2NoSale};
  },[records,assessors,period]);

  function shiftMonth(delta){setPeriod(p=>new Date(p.getFullYear(),p.getMonth()+delta,1));}
  return <>
    <button className="intelligence-launcher" onClick={()=>setOpen(true)}>◈ Intelligence</button>
    {open&&<div className="intelligence-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
      <section className="intelligence-panel" aria-label="Insurance Intelligence">
        <header className="intel-header"><div><small>EUROSTOCK</small><h2>Insurance Intelligence</h2></div><button onClick={()=>setOpen(false)}>✕</button></header>
        <div className="intel-period"><button onClick={()=>shiftMonth(-1)}>‹</button><strong>{monthLabel(period)}</strong><button onClick={()=>shiftMonth(1)}>›</button></div>
        <div className="intel-kpis">
          <article><span>R1</span><b>{stats.r1}</b></article><article><span>R2</span><b>{stats.r2}</b></article><article><span>Vendas</span><b>{stats.sales}</b></article><article><span>R1 → R2</span><b>{stats.convR1R2}%</b></article><article><span>R2 → Venda</span><b>{stats.convR2Sale}%</b></article>
        </div>
        <div className="intel-grid">
          <article className="intel-card"><h3>Funil comercial</h3><div className="funnel-row"><span>R1</span><i style={{width:'100%'}}/><b>{stats.r1}</b></div><div className="funnel-row"><span>R2</span><i style={{width:`${stats.r1?Math.max(8,stats.r2/stats.r1*100):8}%`}}/><b>{stats.r2}</b></div><div className="funnel-row"><span>Venda</span><i style={{width:`${stats.r1?Math.max(8,stats.sales/stats.r1*100):8}%`}}/><b>{stats.sales}</b></div></article>
          <article className="intel-card"><h3>Atenção</h3><div className="alert-line"><b>{stats.noActivity}</b><span>sem atividade no período</span></div><div className="alert-line"><b>{stats.r1NoR2}</b><span>com R1 e nenhum R2</span></div><div className="alert-line"><b>{stats.r2NoSale}</b><span>com R2 e nenhuma venda</span></div></article>
          <article className="intel-card"><h3>Ranking dos squads <small>pts / assessor</small></h3>{stats.squadRank.map((s,i)=><div className="rank-line" key={s.name}><em>{i+1}</em><span>{s.name}</span><b>{s.perAdvisor}</b></div>)}</article>
          <article className="intel-card"><h3>Próximos da meta</h3>{stats.near.map(a=><div className="near-line" key={a.code}><div><strong>{a.name}</strong><small>{a.squad}</small></div><span>{a.missingR1?`${a.missingR1} R1 `:''}{a.missingR2?`${a.missingR2} R2 `:''}{a.missingVenda?`${a.missingVenda} Venda`:''}</span></div>)}</article>
        </div>
        <footer>{loading?'Atualizando…':`Atualização automática · ${assessors.length} pessoas na base · histórico preservado`}</footer>
      </section>
    </div>}
  </>;
}
