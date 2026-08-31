import React,{useEffect,useRef,useState} from 'react';
import {SEPTEMBER_CAMPAIGN as CAMPAIGN} from './campaignConfig.js';

const SCENES=[
  {eyebrow:'SETEMBRO · MÊS DO SEGURO',title:['MÊS DO','SEGURO'],reward:'O CEO ENDOIDOU',sub:'Setembro começou. Agora a produção vale mais.'},
  {eyebrow:'META 01',title:['3 REUNIÕES','AGENDADAS'],reward:'R$ 100',sub:'Bateu três agendamentos, desbloqueou.'},
  {eyebrow:'META 02',title:['1 REUNIÃO','REALIZADA'],reward:'R$ 200',sub:'Uma reunião realizada. Recompensa imediata.'},
  {eyebrow:'META 03',title:['1 VENDA'],reward:'50% DE COMISSÃO',sub:'Fechou uma venda? O jogo muda.'},
  {eyebrow:'SETEMBRO 2026',title:['AGORA É','PRODUÇÃO.'],sub:'O Mês do Seguro está valendo. Acompanhe a campanha em tempo real.'},
];

const SCENE_MS=2500;
const LOOP_MS=SCENES.length*SCENE_MS;

function createSoundtrackCycle(){
  const AudioCtx=window.AudioContext||window.webkitAudioContext;
  if(!AudioCtx)return null;
  const ctx=new AudioCtx();
  const master=ctx.createGain();master.gain.value=.11;master.connect(ctx.destination);
  const start=ctx.currentTime;
  const roots=[55,65.41,73.42,82.41,110];
  for(let i=0;i<28;i++){
    const t=start+i*.34;
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type=i%4===0?'sawtooth':'triangle';
    o.frequency.setValueAtTime(roots[i%roots.length]*(i%7===0?2:1),t);
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(i%4===0?.11:.045,t+.025);
    g.gain.exponentialRampToValueAtTime(.0001,t+.3);
    o.connect(g);g.connect(master);o.start(t);o.stop(t+.32);
  }
  [0,2.5,5,7.5,10].forEach((offset,index)=>{
    [110,164.81,220,329.63].forEach((freq,j)=>{
      const t=start+offset+j*.08;
      const o=ctx.createOscillator(),g=ctx.createGain();
      o.type='sine';o.frequency.value=freq*(index===4?1.25:1);
      g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.06,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.52);
      o.connect(g);g.connect(master);o.start(t);o.stop(t+.55);
    });
  });
  return ctx;
}

function startSoundtrackLoop(){
  let ctx=createSoundtrackCycle();
  const timer=setInterval(()=>{
    ctx?.close?.().catch?.(()=>{});
    ctx=createSoundtrackCycle();
  },LOOP_MS);
  return {close(){clearInterval(timer);ctx?.close?.().catch?.(()=>{});}};
}

function speakIntro(){
  if(!('speechSynthesis' in window))return;
  window.speechSynthesis.cancel();
  const text='Setembro começou. Bem-vindos ao Mês do Seguro. O CEO endoidou. Três reuniões agendadas, cem reais. Uma reunião realizada, duzentos reais. Uma venda, cinquenta por cento de comissão. Agora é produção.';
  const utter=new SpeechSynthesisUtterance(text);
  utter.lang='pt-BR';utter.rate=.96;utter.pitch=.9;utter.volume=.92;
  window.speechSynthesis.speak(utter);
}

export default function CampaignIntroCinematic({onClose,onFollow}){
  const[scene,setScene]=useState(0);
  const[soundOn,setSoundOn]=useState(false);
  const canvasRef=useRef(null);
  const audioRef=useRef(null);

  useEffect(()=>{
    document.documentElement.dataset.campaignIntro='true';
    const timer=setInterval(()=>setScene(current=>(current+1)%SCENES.length),SCENE_MS);
    return()=>{
      clearInterval(timer);
      delete document.documentElement.dataset.campaignIntro;
      window.speechSynthesis?.cancel();
      audioRef.current?.close?.();
    };
  },[]);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext('2d');let raf=0;let width=0;let height=0;let dpr=1;let last=performance.now();
    const motes=[];const sparks=[];
    const burstTimes=[700,2500,5000,7500,10000,11700];
    let started=performance.now();let burstIndex=0;let cycleIndex=-1;

    function resize(){
      dpr=Math.min(window.devicePixelRatio||1,2.5);width=window.innerWidth;height=window.innerHeight;
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      motes.length=0;
      const count=Math.min(150,Math.max(70,Math.round(width/10)));
      for(let i=0;i<count;i++)motes.push({x:Math.random()*width,y:Math.random()*height,r:.4+Math.random()*1.5,v:.08+Math.random()*.32,a:.08+Math.random()*.34});
    }
    function burst(){
      const side=Math.random()>.5?1:-1;const cx=width*(side>0?.76:.24);const cy=height*(.2+Math.random()*.28);
      for(let i=0;i<58;i++){
        const angle=Math.random()*Math.PI*2;const speed=65+Math.random()*240;
        sparks.push({x:cx,y:cy,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:.65+Math.random()*.65,age:0,r:.7+Math.random()*1.8});
      }
    }
    function draw(now){
      const dt=Math.min(.035,(now-last)/1000);last=now;
      const totalElapsed=now-started;
      const nextCycle=Math.floor(totalElapsed/LOOP_MS);
      if(nextCycle!==cycleIndex){cycleIndex=nextCycle;burstIndex=0;}
      const elapsed=totalElapsed%LOOP_MS;
      while(burstIndex<burstTimes.length&&elapsed>=burstTimes[burstIndex]){burst();burstIndex++;}
      ctx.clearRect(0,0,width,height);
      const glow=ctx.createRadialGradient(width*.5,height*.45,0,width*.5,height*.45,Math.max(width,height)*.62);
      glow.addColorStop(0,'rgba(212,175,55,.075)');glow.addColorStop(.42,'rgba(212,175,55,.018)');glow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
      motes.forEach(p=>{p.y-=p.v;if(p.y<-5){p.y=height+5;p.x=Math.random()*width;}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(225,190,78,${p.a})`;ctx.fill();});
      for(let i=sparks.length-1;i>=0;i--){const p=sparks[i];p.age+=dt;if(p.age>=p.life){sparks.splice(i,1);continue;}p.vy+=80*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;const a=Math.pow(1-p.age/p.life,1.7);ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(239,197,73,${a})`;ctx.fill();}
      raf=requestAnimationFrame(draw);
    }
    resize();window.addEventListener('resize',resize,{passive:true});raf=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',resize);};
  },[]);

  function enableSound(){
    if(soundOn)return;
    setSoundOn(true);audioRef.current=startSoundtrackLoop();speakIntro();
  }

  const current=SCENES[scene];
  return <div className="cinematic-intro" role="dialog" aria-modal="true" aria-label={`Abertura da campanha ${CAMPAIGN.name}`}>
    <canvas ref={canvasRef} className="cinematic-canvas"/>
    <div className="cinematic-grid"/><div className="cinematic-beam cinematic-beam-a"/><div className="cinematic-beam cinematic-beam-b"/><div className="cinematic-vignette"/>
    <header className="cinematic-topbar"><div><span className="cinematic-brand-dot"/>EUROSTOCK · INSURANCE DAY</div><button onClick={enableSound}>{soundOn?'🔊 SOM ATIVO':'🔇 ATIVAR SOM'}</button></header>
    <main className={`cinematic-stage scene-${scene}`} key={scene}>
      <div className="cinematic-eyebrow">{current.eyebrow}</div>
      <div className="cinematic-rule"/>
      <h1>{current.title.map((line,i)=><span key={line} className={i===current.title.length-1?'accent':''}>{line}</span>)}</h1>
      {current.reward&&<div className="cinematic-reward">{current.reward}</div>}
      <p>{current.sub}</p>
      {scene===4&&<button className="cinematic-enter" onClick={onFollow}>ACOMPANHE A CAMPANHA <span>→</span></button>}
    </main>
    <div className="cinematic-timeline"><div className="cinematic-progress" style={{width:`${((scene+1)/SCENES.length)*100}%`}}/>{SCENES.map((_,i)=><span key={i} className={i<=scene?'active':''}/>)}</div>
    <footer className="cinematic-footer"><span>{CAMPAIGN.name.toUpperCase()} · {CAMPAIGN.slogan.toUpperCase()} · SETEMBRO 2026</span><div className="cinematic-footer-actions"><button onClick={onClose}>ENTRAR NO DASHBOARD</button><button className="cinematic-follow" onClick={onFollow}>ACOMPANHE →</button></div></footer>
  </div>;
}
