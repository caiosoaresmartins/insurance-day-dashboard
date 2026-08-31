import React,{useEffect,useMemo,useRef,useState} from 'react';
import {SEPTEMBER_CAMPAIGN as CAMPAIGN} from './campaignConfig.js';

function useCampaignRecords(){
  const[records,setRecords]=useState([]);
  useEffect(()=>{let live=true;async function load(){try{const r=await fetch('/api/kv',{cache:'no-store'});const d=await r.json();if(live)setRecords(Array.isArray(d.records)?d.records:[]);}catch{}}load();const id=setInterval(load,15000);return()=>{live=false;clearInterval(id);};},[]);
  return records;
}

function synthSting(){
  const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;
  const ctx=new AudioCtx();const master=ctx.createGain();master.gain.value=.14;master.connect(ctx.destination);
  const now=ctx.currentTime;
  const freqs=[110,164.81,220,329.63,440];
  freqs.forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=i<2?'sawtooth':'triangle';o.frequency.setValueAtTime(f,now+i*.18);g.gain.setValueAtTime(0,now+i*.18);g.gain.linearRampToValueAtTime(.24,now+i*.18+.03);g.gain.exponentialRampToValueAtTime(.001,now+i*.18+.55);o.connect(g);g.connect(master);o.start(now+i*.18);o.stop(now+i*.18+.6);});
  setTimeout(()=>ctx.close(),1800);
}

function Intro({onClose}){
  const[step,setStep]=useState(0);const[muted,setMuted]=useState(true);const canvasRef=useRef(null);
  useEffect(()=>{const timers=[700,1800,3200,4700].map((ms,i)=>setTimeout(()=>setStep(i+1),ms));return()=>timers.forEach(clearTimeout);},[]);
  useEffect(()=>{if(!muted)synthSting();},[muted]);
  useEffect(()=>{const cv=canvasRef.current;if(!cv)return;const ctx=cv.getContext('2d');let raf;let w=cv.width=innerWidth,h=cv.height=innerHeight;const pts=Array.from({length:90},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*1.8,vy:-.4-Math.random()*1.7,r:.5+Math.random()*2,a:.2+Math.random()*.8}));function draw(){ctx.clearRect(0,0,w,h);pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;if(p.y<-10){p.y=h+10;p.x=Math.random()*w}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(212,175,55,${p.a})`;ctx.fill();});raf=requestAnimationFrame(draw)}draw();const rs=()=>{w=cv.width=innerWidth;h=cv.height=innerHeight};addEventListener('resize',rs);return()=>{cancelAnimationFrame(raf);removeEventListener('resize',rs)};},[]);
  return <div className="campaign-intro"><canvas ref={canvasRef}/><div className="campaign-vignette"/><button className="campaign-sound" onClick={()=>setMuted(v=>!v)}>{muted?'🔇 ATIVAR SOM':'🔊 SOM ATIVO'}</button><div className="campaign-intro-content">
    <div className={`campaign-kicker ${step>=1?'show':''}`}>{CAMPAIGN.eyebrow}</div>
    <h1 className={step>=2?'show':''}>A MESA<br/><span>ENDOIDOU.</span></h1>
    <p className={step>=3?'show':''}>Setembro começou. Meta curta. Recompensa rápida. Comissão agressiva.</p>
    <div className={`campaign-reveal ${step>=4?'show':''}`}><div><b>3</b><span>REUNIÕES AGENDADAS</span></div><div><b>1</b><span>REUNIÃO REALIZADA</span></div><div className="gold"><b>50%</b><span>COMISSÃO NA VENDA</span></div></div>
    <button className={`campaign-enter ${step>=4?'show':''}`} onClick={onClose}>ENTRAR NA CAMPANHA →</button>
  </div></div>
}

export default function SeptemberCampaign(){
  const records=useCampaignRecords();const[showIntro,setShowIntro]=useState(()=>sessionStorage.getItem('sep-intro-seen')!=='1');const[open,setOpen]=useState(false);const[userCode,setUserCode]=useState('');
  const closeIntro=()=>{sessionStorage.setItem('sep-intro-seen','1');setShowIntro(false)};
  const byAdvisor=useMemo(()=>{const m={};records.forEach(r=>{const a=m[r.code]||(m[r.code]={code:r.code,name:r.name,squad:r.squad,R1:0,R2:0,Venda:0});if(a[r.type]!=null)a[r.type]++;});return m;},[records]);
  const advisors=Object.values(byAdvisor).sort((a,b)=>b.Venda-a.Venda||b.R2-a.R2||b.R1-a.R1);
  const selected=byAdvisor[userCode]||null;
  return <>
    {showIntro&&<Intro onClose={closeIntro}/>} 
    <button className="campaign-launcher" onClick={()=>setOpen(true)}>⚡ Setembro</button>
    {open&&<div className="campaign-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}><section className="campaign-panel"><header><div><small>{CAMPAIGN.eyebrow}</small><h2>{CAMPAIGN.name}</h2></div><button onClick={()=>setOpen(false)}>✕</button></header>
      <div className="campaign-rule-grid">{CAMPAIGN.rewards.map(rule=><article key={rule.id}><span>{rule.icon}</span><small>{rule.title}</small><h3>{rule.rule}</h3><b>{rule.reward}</b></article>)}</div>
      <div className="campaign-user-picker"><label>VER PROGRESSO DO ASSESSOR</label><select value={userCode} onChange={e=>setUserCode(e.target.value)}><option value="">Selecione...</option>{advisors.map(a=><option value={a.code} key={a.code}>{a.name}</option>)}</select></div>
      {selected&&<div className="campaign-progress"><div><strong>{selected.name}</strong><span>{selected.squad}</span></div>{CAMPAIGN.rewards.map(rule=>{const current=selected[rule.type]||0;const done=current>=rule.goal;return <article key={rule.id} className={done?'done':''}><div><span>{rule.icon}</span><div><b>{rule.rule}</b><small>{done?'DESBLOQUEADO':`${current}/${rule.goal}`}</small></div></div><strong>{done?rule.reward:'EM PROGRESSO'}</strong></article>})}</div>}
      <div className="campaign-leaderboard"><h3>Quem virou a mesa</h3>{advisors.slice(0,8).map((a,i)=><div key={a.code}><em>{i+1}</em><span><b>{a.name}</b><small>{a.squad}</small></span><strong>{a.Venda>0?'50% comissão':a.R2>0?'Prêmio R2':a.R1>=3?'Prêmio R1':'Em jogo'}</strong></div>)}</div>
      <footer><button onClick={()=>{setOpen(false);setShowIntro(true);sessionStorage.removeItem('sep-intro-seen')}}>▶ REVER ABERTURA</button><span>Campanha válida em setembro de 2026</span></footer>
    </section></div>}
  </>;
}
