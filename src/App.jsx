import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';

const ASSESSORS = [
  { code:'A73614', name:'Bruno Bruel',           squad:'Alavancados',  color:'#2563eb' },
  { code:'A26347', name:'Guilherme Monticelli',  squad:'Alavancados',  color:'#2563eb' },
  { code:'A38636', name:'Hellen Carvalho',       squad:'Alavancados',  color:'#2563eb' },
  { code:'A38548', name:'Igor Bairros',          squad:'Alavancados',  color:'#2563eb' },
  { code:'A96379', name:'Leonardo Vacca',        squad:'Alavancados',  color:'#2563eb' },
  { code:'A51532', name:'Nicolas Mallmann',      squad:'Alavancados',  color:'#2563eb' },
  { code:'A26305', name:'Pedro Couto',           squad:'Alavancados',  color:'#2563eb' },
  { code:'A27267', name:'Rodrigo Lisboa',        squad:'Alavancados',  color:'#2563eb' },
  { code:'A27321', name:'Vitoria Vidor',         squad:'Alavancados',  color:'#2563eb' },
  { code:'A42881', name:'Ygor Walter',           squad:'Alavancados',  color:'#2563eb' },
  { code:'A98897', name:'Daniel Mendonca',       squad:'Los Hermanos', color:'#92400e' },
  { code:'A73851', name:'Eduardo Freitas',       squad:'Los Hermanos', color:'#92400e' },
  { code:'A98943', name:'Israel Gusso',          squad:'Los Hermanos', color:'#92400e' },
  { code:'A97096', name:'Julia Mendonca',        squad:'Los Hermanos', color:'#92400e' },
  { code:'A39869', name:'Fernando Parisotto',    squad:'Advisors',     color:'#6d28d9' },
  { code:'A20680', name:'Francisco Dall Agnol',  squad:'Advisors',     color:'#6d28d9' },
  { code:'A50655', name:'Paulo Bortolini',       squad:'Advisors',     color:'#6d28d9' },
  { code:'A1998',  name:'Icaro Piacini',         squad:'Outliers',     color:'#b45309' },
  { code:'A42105', name:'Joceane Lenhart',       squad:'Outliers',     color:'#b45309' },
  { code:'A59147', name:'Lucas Bach',            squad:'Outliers',     color:'#b45309' },
  { code:'A47707', name:'Mateus Brandao',        squad:'Outliers',     color:'#b45309' },
  { code:'A56902', name:'Daniel Mastalir',       squad:'Anywhere',     color:'#065f46' },
  { code:'A56903', name:'Leonardo Dutra',        squad:'Anywhere',     color:'#065f46' },
  { code:'A54287', name:'Bruno Giacomuzzi',      squad:'Operacionais', color:'#374151' },
  { code:'A22616', name:'Enzo Hejazi',           squad:'Operacionais', color:'#374151' },
  { code:'A61852', name:'Gabriel Berte',         squad:'Operacionais', color:'#374151' },
  { code:'A22038', name:'Jose Colling',          squad:'Operacionais', color:'#374151' },
  { code:'A20557', name:'Milena Portela',        squad:'Operacionais', color:'#374151' },
  { code:'A33788', name:'Nicolas Gotz',          squad:'Operacionais', color:'#374151' },
];

const PTS  = { R1:30, R2:50, Venda:100 };
const META = { R1:4, R2:4, Venda:2 };
const TICK = 15;
const GOLD = '#d4af37';
const BG   = '#04040f';

// ====== FIREWORKS ======
const fwRef = { canvas:null, ctx:null, particles:[], raf:null, active:false };
function initFW() {
  if (fwRef.canvas) return;
  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:8888;';
  c.width = window.innerWidth; c.height = window.innerHeight;
  document.body.appendChild(c);
  fwRef.canvas = c; fwRef.ctx = c.getContext('2d');
  window.addEventListener('resize', () => { c.width=window.innerWidth; c.height=window.innerHeight; });
}
function launchFireworks(type) {
  initFW();
  const { canvas:cv, ctx } = fwRef;
  const W=cv.width, H=cv.height;
  const palettes = {
    R1:    ['#3b82f6','#60a5fa','#bfdbfe','#fff'],
    R2:    ['#eab308','#facc15','#fde047','#fff'],
    Venda: ['#d4af37','#f59e0b','#10b981','#fff','#f43f5e'],
  };
  const cols   = palettes[type] || palettes.Venda;
  const bursts = type==='Venda' ? 5 : 3;
  for (let b=0; b<bursts; b++) {
    setTimeout(() => {
      const x=W*(0.2+Math.random()*0.6), y=H*(0.1+Math.random()*0.4);
      const n=type==='Venda'?120:80;
      for (let i=0; i<n; i++) {
        const angle=(Math.PI*2*i)/n+Math.random()*0.3, spd=2+Math.random()*6;
        fwRef.particles.push({ x,y, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd,
          alpha:1, decay:0.012+Math.random()*0.01, size:1.5+Math.random()*2,
          color:cols[Math.floor(Math.random()*cols.length)], trail:[] });
      }
    }, b*220);
  }
  if (!fwRef.active) {
    fwRef.active = true;
    function tick() {
      ctx.fillStyle='rgba(4,4,15,0.18)'; ctx.fillRect(0,0,W,H);
      fwRef.particles = fwRef.particles.filter(p=>p.alpha>0.02);
      fwRef.particles.forEach(p => {
        p.trail.push({x:p.x,y:p.y}); if(p.trail.length>6) p.trail.shift();
        p.trail.forEach((t,i)=>{ ctx.beginPath(); ctx.arc(t.x,t.y,p.size*(i/p.trail.length)*0.6,0,Math.PI*2); ctx.fillStyle=p.color; ctx.globalAlpha=p.alpha*(i/p.trail.length)*0.4; ctx.fill(); });
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fillStyle=p.color; ctx.globalAlpha=p.alpha; ctx.fill(); ctx.globalAlpha=1;
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.08; p.vx*=0.98; p.alpha-=p.decay;
      });
      if (fwRef.particles.length>0) fwRef.raf=requestAnimationFrame(tick);
      else { ctx.clearRect(0,0,W,H); fwRef.active=false; }
    }
    tick();
  }
}

// ====== COUNT-UP HOOK ======
function useCountUp(target, duration=600) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const start=prev.current, diff=target-start;
    if (diff===0) return;
    const t0=performance.now();
    const step=ts => {
      const p=Math.min((ts-t0)/duration,1);
      const ease=1-Math.pow(1-p,3);
      setVal(Math.round(start+diff*ease));
      if (p<1) requestAnimationFrame(step); else prev.current=target;
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

// ====== KV ======
async function kvFetch() {
  const r=await fetch('/api/kv'); if(!r.ok) throw new Error('Falha ao buscar dados');
  const d=await r.json(); return Array.isArray(d.records)?d.records:[];
}
async function kvAdd(user,type) {
  const r=await fetch('/api/kv',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'add',record:{code:user.code,name:user.name,squad:user.squad,type}})});
  if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||'Erro ao gravar');}
  return r.json();
}
function buildRanking(records) {
  const m={};
  ASSESSORS.forEach(a=>{m[a.code]={...a,R1:0,R2:0,Venda:0,pts:0};});
  (Array.isArray(records)?records:[]).forEach(r=>{if(m[r.code]){m[r.code][r.type]=(m[r.code][r.type]||0)+1;m[r.code].pts+=(PTS[r.type]||0);}});
  return Object.values(m).sort((a,b)=>b.pts-a.pts||b.Venda-a.Venda||b.R2-a.R2);
}
function premio(a) {
  if(a.R1>=4&&a.R2>=4&&a.Venda>=2) return {label:'Ouro',  val:500,hex:'#d4af37'};
  if(a.R1>=4&&a.R2>=4)             return {label:'Prata', val:300,hex:'#9ca3af'};
  if(a.R1>=4)                       return {label:'Bronze',val:150,hex:'#b45309'};
  return null;
}
function initials(name){return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();}
function fmt(ts){return new Date(ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}

function useKV() {
  const [records,setRecords]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(null);
  const [countdown,setCountdown]=useState(TICK);
  const [lastUpdate,setLastUpdate]=useState(null);
  const load=useCallback(async(quiet=false)=>{
    if(!quiet) setLoading(true); setError(null);
    try{const data=await kvFetch();setRecords(Array.isArray(data)?data:[]);setLastUpdate(new Date());setCountdown(TICK);}
    catch(e){setError(e.message);}finally{setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{const id=setInterval(()=>load(true),TICK*1000);return()=>clearInterval(id);},[load]);
  useEffect(()=>{const id=setInterval(()=>setCountdown(p=>p<=1?TICK:p-1),1000);return()=>clearInterval(id);},[]);
  useEffect(()=>{
    const fn=()=>{if(document.visibilityState==='visible')load(true);};
    document.addEventListener('visibilitychange',fn);return()=>document.removeEventListener('visibilitychange',fn);
  },[load]);
  const add=useCallback(async(user,type)=>{
    const tmp={id:'tmp_'+Date.now(),code:user.code,name:user.name,squad:user.squad,type,ts:Date.now()};
    setRecords(p=>Array.isArray(p)?[...p,tmp]:[tmp]);
    await kvAdd(user,type); setTimeout(()=>load(true),800);
  },[load]);
  return{records,loading,error,countdown,lastUpdate,load,add};
}

// ====== GALAXY BG ======
function GalaxyBg() {
  const ref=useRef(null);
  useEffect(()=>{
    const cv=ref.current; if(!cv) return;
    const ctx=cv.getContext('2d');
    let W=window.innerWidth,H=window.innerHeight;
    cv.width=W;cv.height=H;
    const stars=Array.from({length:240},()=>({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.4+0.2,a:Math.random(),spd:Math.random()*0.004+0.001,dir:Math.random()>0.5?1:-1,col:['#fff','#d4af37','#a78bfa','#60a5fa','#f9a8d4'][Math.floor(Math.random()*5)]}));
    const neb=[{x:W*.15,y:H*.12,rx:180,ry:100,col:'rgba(99,51,180,0.07)'},{x:W*.80,y:H*.08,rx:220,ry:120,col:'rgba(212,175,55,0.05)'},{x:W*.50,y:H*.30,rx:260,ry:130,col:'rgba(29,78,216,0.06)'},{x:W*.25,y:H*.55,rx:150,ry:80,col:'rgba(99,51,180,0.04)'},{x:W*.75,y:H*.45,rx:200,ry:100,col:'rgba(212,175,55,0.04)'}];
    let raf;
    function draw(){
      ctx.clearRect(0,0,W,H);
      neb.forEach(n=>{const g=ctx.createRadialGradient(n.x,n.y,0,n.x,n.y,n.rx);g.addColorStop(0,n.col);g.addColorStop(1,'transparent');ctx.save();ctx.scale(1,n.ry/n.rx);ctx.beginPath();ctx.arc(n.x,n.y*(n.rx/n.ry),n.rx,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();ctx.restore();});
      stars.forEach(s=>{s.a+=s.spd*s.dir;if(s.a>1||s.a<0.1)s.dir*=-1;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=s.col;ctx.globalAlpha=s.a;ctx.fill();ctx.globalAlpha=1;});
      raf=requestAnimationFrame(draw);
    }
    draw();
    const onResize=()=>{W=window.innerWidth;H=window.innerHeight;cv.width=W;cv.height=H;};
    window.addEventListener('resize',onResize);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',onResize);};
  },[]);
  return <canvas ref={ref} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}}/>;
}

const CARD={background:'rgba(10,10,25,0.85)',border:'1px solid #1f1f3a',borderRadius:12,padding:16,backdropFilter:'blur(6px)'};

function Av({name,size=56,ring=GOLD,glow=false}){
  const bgs=['#1d4ed8','#7c3aed','#c2410c','#065f46','#92400e','#0e7490','#374151'];
  const bg=bgs[name.charCodeAt(0)%bgs.length];
  return <div style={{width:size,height:size,borderRadius:'50%',background:bg,border:'3px solid '+ring,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:size*0.32,flexShrink:0,letterSpacing:1,boxShadow:glow?'0 0 24px '+ring+'99,0 0 48px '+ring+'44':'0 0 8px '+ring+'33'}}>{initials(name)}</div>;
}

function Toast({msg,ok,pts}){
  const [vis,setVis]=useState(false);
  useEffect(()=>{setTimeout(()=>setVis(true),10);},[]);
  return(
    <div style={{position:'fixed',bottom:32,left:'50%',transform:vis?'translateX(-50%) translateY(0) scale(1)':'translateX(-50%) translateY(30px) scale(0.8)',background:ok?'linear-gradient(135deg,#065f46,#10b981)':'#ef4444',color:'#fff',padding:'14px 32px',borderRadius:16,fontWeight:800,fontSize:16,zIndex:9999,boxShadow:'0 8px 40px #000a',whiteSpace:'nowrap',transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',display:'flex',alignItems:'center',gap:12}}>
      <span style={{fontSize:24}}>{ok?(pts===100?'💰':pts===50?'✅':'📅'):'❌'}</span>
      <div><div>{msg}</div>{pts&&ok&&<div style={{fontSize:12,opacity:.8,fontWeight:400}}>+{pts} pontos adicionados!</div>}</div>
      {pts&&ok&&<div style={{fontSize:28,fontWeight:900,color:GOLD,textShadow:'0 0 10px '+GOLD}}>+{pts}</div>}
    </div>
  );
}

function FloatingPts({pts,color}){
  const [pos,setPos]=useState(0),[op,setOp]=useState(1);
  useEffect(()=>{setTimeout(()=>{setPos(-60);setOp(0);},50);},[]);
  return <div style={{position:'fixed',bottom:120,left:'50%',transform:`translateX(-50%) translateY(${pos}px)`,color,fontSize:36,fontWeight:900,textShadow:'0 0 20px '+color,opacity:op,transition:'all 1.2s ease-out',pointerEvents:'none',zIndex:9998}}>+{pts}</div>;
}

// ====== POSITION DELTA BADGE ======
function DeltaBadge({delta}){
  if(!delta||delta===0) return null;
  const up=delta>0;
  return(
    <div style={{display:'inline-flex',alignItems:'center',gap:2,background:up?'#10b98122':'#ef444422',border:'1px solid '+(up?'#10b981':'#ef4444'),borderRadius:99,padding:'2px 6px',fontSize:10,fontWeight:800,color:up?'#10b981':'#ef4444',animation:'deltaFade 3s forwards'}}>
      {up?'↑':'↓'}{Math.abs(delta)}
    </div>
  );
}

// ====== ANIMATED PTS (countUp) ======
function AnimPts({pts,style}){
  const val=useCountUp(pts);
  return <div style={style}>{val}</div>;
}

// ====== TAB RANKING com FLIP ======
function TabRanking({records,loading}){
  const [showAll,setShowAll]=useState(false);
  const rank=buildRanking(records);
  const top5=rank.slice(0,5);

  // FLIP: refs por code
  const cardRefs=useRef({});
  const snapshots=useRef({});

  // Salva posições ANTES do React re-renderizar (snapshot)
  const prevRankOrder=useRef([]);

  // Calcula deltas de posição
  const [deltas,setDeltas]=useState({});

  // Antes de cada render, tira snapshot das posições atuais
  useEffect(()=>{
    // calcula delta de posicao
    const prevOrder=prevRankOrder.current;
    if(prevOrder.length>0){
      const newDeltas={};
      rank.forEach((a,newIdx)=>{
        const oldIdx=prevOrder.indexOf(a.code);
        if(oldIdx!==-1&&oldIdx!==newIdx) newDeltas[a.code]=oldIdx-newIdx; // positivo = subiu
      });
      if(Object.keys(newDeltas).length>0){
        setDeltas(newDeltas);
        setTimeout(()=>setDeltas({}),3000);
      }
    }
    prevRankOrder.current=rank.map(a=>a.code);
  },[records]);

  // FLIP: snapshot ANTES do update
  useLayoutEffect(()=>{
    // tira snapshot antes
    Object.keys(cardRefs.current).forEach(code=>{
      const el=cardRefs.current[code];
      if(el) snapshots.current[code]=el.getBoundingClientRect().top;
    });
  });

  // FLIP: anima DEPOIS do update
  useLayoutEffect(()=>{
    Object.keys(cardRefs.current).forEach(code=>{
      const el=cardRefs.current[code];
      const prevTop=snapshots.current[code];
      if(!el||prevTop==null) return;
      const newTop=el.getBoundingClientRect().top;
      const delta=prevTop-newTop;
      if(Math.abs(delta)>2){
        el.style.transition='none';
        el.style.transform=`translateY(${delta}px)`;
        requestAnimationFrame(()=>{
          el.style.transition='transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94)';
          el.style.transform='translateY(0)';
        });
      }
    });
  },[records]);

  const totalR1   =rank.reduce((s,a)=>s+a.R1,0);
  const totalR2   =rank.reduce((s,a)=>s+a.R2,0);
  const totalVenda=rank.reduce((s,a)=>s+a.Venda,0);
  const ating     =ASSESSORS.length*META.R1>0?Math.round((totalR1/(ASSESSORS.length*META.R1))*100):0;

  const podiumOrder =[1,0,2];
  const podiumH     =[180,240,150];
  const podiumAvSz  =[72,96,64];

  if(loading&&records.length===0) return(
    <div style={{textAlign:'center',padding:80}}>
      <div style={{fontSize:40,animation:'spin 1s linear infinite',display:'inline-block'}}>✨</div>
      <div style={{color:'#555',marginTop:12,letterSpacing:2,fontSize:12}}>CARREGANDO...</div>
    </div>
  );

  return(
    <div style={{maxWidth:760,margin:'0 auto',padding:'24px 0'}}>

      {/* METRICAS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:32}}>
        {[
          {label:'R1 REALIZADAS',val:totalR1,   color:'#3b82f6',icon:'📅'},
          {label:'R2 REALIZADAS',val:totalR2,   color:'#eab308',icon:'✅'},
          {label:'VENDAS',       val:totalVenda, color:'#10b981',icon:'💰'},
          {label:'ATINGIMENTO',  val:ating+'%',  color:'#22c55e',icon:'🎯'},
        ].map(m=>(
          <div key={m.label} style={{...CARD,textAlign:'center',padding:'20px 12px',transition:'transform .3s',cursor:'default'}}
            onMouseEnter={e=>e.currentTarget.style.transform='scale(1.04) translateY(-2px)'}
            onMouseLeave={e=>e.currentTarget.style.transform=''}>
            <div style={{fontSize:20,marginBottom:6}}>{m.icon}</div>
            <div style={{color:'#444',fontSize:10,letterSpacing:2,marginBottom:8}}>{m.label}</div>
            <div style={{color:m.color,fontSize:34,fontWeight:800,lineHeight:1}}>{m.val}</div>
          </div>
        ))}
      </div>

      <div style={{textAlign:'center',marginBottom:32}}>
        <span style={{color:GOLD,fontSize:13,fontWeight:700,letterSpacing:3,textShadow:'0 0 16px '+GOLD+'66'}}>🏆 TOP 5 ASSESSORES</span>
      </div>

      {/* PODIO */}
      <div style={{position:'relative',background:'linear-gradient(180deg,rgba(5,5,20,0.97) 0%,rgba(10,10,30,0.99) 100%)',borderRadius:20,padding:'40px 16px 0',marginBottom:24,minHeight:340,overflow:'hidden',border:'1px solid rgba(212,175,55,0.15)',boxShadow:'0 0 60px rgba(99,51,180,0.15)'}}>
        {[...Array(30)].map((_,i)=>(
          <div key={i} style={{position:'absolute',left:(i*37%100)+'%',top:(i*53%60)+'%',width:i%5===0?2:1,height:i%5===0?2:1,borderRadius:'50%',background:i%3===0?GOLD:i%3===1?'#a78bfa':'#fff',opacity:0.3+(i%4)*0.15,animation:`starPulse ${2+i%3}s ease-in-out infinite`,animationDelay:(i*0.2)+'s'}}/>
        ))}
        <div style={{position:'absolute',top:'10%',left:'50%',transform:'translateX(-50%)',width:400,height:200,background:'radial-gradient(ellipse,rgba(99,51,180,0.12) 0%,transparent 70%)',pointerEvents:'none'}}/>
        <div style={{position:'absolute',left:-20,bottom:0,width:160,height:200,background:'linear-gradient(135deg,#0d0d1a,#06060f)',borderRadius:'20% 50% 30% 10%',opacity:.9}}/>
        <div style={{position:'absolute',right:0,bottom:0,width:140,height:170,background:'linear-gradient(135deg,#0a0a18,#050510)',borderRadius:'40% 10% 50% 20%',opacity:.9}}/>
        <div style={{position:'absolute',left:100,bottom:0,width:90,height:120,background:'linear-gradient(135deg,#0c0c1c,#070712)',borderRadius:'30% 40% 20% 50%',opacity:.8}}/>
        <div style={{position:'absolute',right:110,bottom:0,width:110,height:140,background:'linear-gradient(135deg,#0b0b1a,#060610)',borderRadius:'50% 20% 40% 30%',opacity:.8}}/>

        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'center',gap:0,position:'relative',zIndex:2}}>
          {podiumOrder.map((idx,vi)=>{
            const a=top5[idx]; if(!a) return <div key={vi} style={{flex:1}}/>;
            const isFirst=idx===0, avSz=podiumAvSz[vi], colH=podiumH[vi];
            const ringCol=idx===0?GOLD:idx===1?'#c0c0c0':'#cd7f32';
            const pr=premio(a);
            const d=deltas[a.code];
            return(
              <div key={a.code} ref={el=>cardRefs.current[a.code]=el}
                style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',maxWidth:200}}>
                <div style={{textAlign:'center',marginBottom:10,padding:'0 8px'}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:2}}>
                    <div style={{color:isFirst?GOLD:'#e5e7eb',fontWeight:800,fontSize:isFirst?14:12,letterSpacing:2,textTransform:'uppercase',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',textShadow:isFirst?'0 0 20px '+GOLD+'88':'none'}}>{a.name}</div>
                    <DeltaBadge delta={d}/>
                  </div>
                  <div style={{color:'#555',fontSize:10,letterSpacing:1}}>{a.squad.toUpperCase()}</div>
                  {pr&&<div style={{color:pr.hex,fontSize:10,fontWeight:700,marginTop:3,animation:'glowPulse 2s ease-in-out infinite'}}>{pr.label} R${pr.val}</div>}
                </div>
                <div style={{position:'relative',marginBottom:0}}>
                  <Av name={a.name} size={avSz} ring={ringCol} glow={isFirst}/>
                  {isFirst&&<div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',fontSize:20,animation:'bounce 1s ease-in-out infinite'}}>👑</div>}
                  <div style={{position:'absolute',bottom:-8,left:'50%',transform:'translateX(-50%)',background:ringCol,color:'#000',borderRadius:'50%',width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:11}}>{idx+1}</div>
                </div>
                <div style={{marginTop:16,width:'100%',height:colH,background:'linear-gradient(180deg,rgba(20,20,50,0.9) 0%,rgba(8,8,25,0.95) 100%)',border:'1px solid '+(isFirst?GOLD+'55':'rgba(212,175,55,0.1)'),borderBottom:'none',borderRadius:'8px 8px 0 0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'16px 8px',boxShadow:isFirst?'0 -8px 30px '+GOLD+'22':'none'}}>
                  <div style={{display:'flex',gap:20}}>
                    <div style={{textAlign:'center'}}>
                      <AnimPts pts={a.R1} style={{color:'#e5e7eb',fontSize:isFirst?36:28,fontWeight:800,lineHeight:1}}/>
                      <div style={{color:'#444',fontSize:9,letterSpacing:1,marginTop:4}}>R1</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <AnimPts pts={a.R2} style={{color:'#e5e7eb',fontSize:isFirst?36:28,fontWeight:800,lineHeight:1}}/>
                      <div style={{color:'#444',fontSize:9,letterSpacing:1,marginTop:4}}>R2</div>
                    </div>
                    {a.Venda>0&&(
                      <div style={{textAlign:'center'}}>
                        <AnimPts pts={a.Venda} style={{color:'#10b981',fontSize:isFirst?36:28,fontWeight:800,lineHeight:1}}/>
                        <div style={{color:'#444',fontSize:9,letterSpacing:1,marginTop:4}}>VENDA</div>
                      </div>
                    )}
                  </div>
                  <AnimPts pts={a.pts} style={{color:GOLD,fontWeight:800,fontSize:isFirst?18:14,marginTop:10,textShadow:'0 0 10px '+GOLD+'66'}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4o e 5o */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:24}}>
        {[3,4].map(idx=>{
          const a=top5[idx]; if(!a) return null;
          const d=deltas[a.code];
          return(
            <div key={a.code} ref={el=>cardRefs.current[a.code]=el}
              style={{...CARD,display:'flex',alignItems:'center',gap:12,transition:'transform .2s'}}
              onMouseEnter={e=>e.currentTarget.style.transform='translateX(4px)'}
              onMouseLeave={e=>e.currentTarget.style.transform=''}>
              <div style={{color:'#333',fontWeight:800,fontSize:18,minWidth:28}}>{idx+1}</div>
              <Av name={a.name} size={44} ring={idx===3?'#888':'#666'}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{color:'#e5e7eb',fontWeight:700,fontSize:13,textTransform:'uppercase',letterSpacing:1,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{a.name}</div>
                  <DeltaBadge delta={d}/>
                </div>
                <div style={{color:'#555',fontSize:11}}>{a.squad}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{display:'flex',gap:8,fontSize:13}}>
                  <span style={{color:'#3b82f6',fontWeight:700}}>R1·{a.R1}</span>
                  <span style={{color:'#eab308',fontWeight:700}}>R2·{a.R2}</span>
                </div>
                <AnimPts pts={a.pts} style={{color:GOLD,fontWeight:800,fontSize:14,marginTop:4}}/>
              </div>
            </div>
          );
        })}
      </div>

      {/* VER TODOS */}
      <div style={CARD}>
        <button onClick={()=>setShowAll(p=>!p)} style={{background:'none',border:'none',color:'#555',fontSize:12,cursor:'pointer',letterSpacing:1,padding:'4px 0',width:'100%',textAlign:'left',transition:'color .2s'}} onMouseEnter={e=>e.currentTarget.style.color=GOLD} onMouseLeave={e=>e.currentTarget.style.color='#555'}>
          {showAll?'▲ OCULTAR':'▼ VER TODOS OS '+rank.length+' ASSESSORES'}
        </button>
        {showAll&&(
          <div style={{marginTop:14}}>
            {rank.slice(5).map((a,i)=>{
              const d=deltas[a.code];
              return(
                <div key={a.code} ref={el=>cardRefs.current[a.code]=el}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #1a1a2e',transition:'background .15s',borderRadius:6}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(212,175,55,0.04)'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}>
                  <span style={{color:'#333',fontSize:12,minWidth:28,textAlign:'center'}}>{i+6}</span>
                  <Av name={a.name} size={32} ring={a.color}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{color:'#ccc',fontSize:13,fontWeight:600,textTransform:'uppercase',letterSpacing:.5}}>{a.name}</div>
                      <DeltaBadge delta={d}/>
                    </div>
                    <div style={{color:'#444',fontSize:11}}>{a.squad}</div>
                  </div>
                  <div style={{display:'flex',gap:8,fontSize:11}}>
                    <span style={{color:'#3b82f6'}}>R1·{a.R1}</span>
                    <span style={{color:'#eab308'}}>R2·{a.R2}</span>
                    <span style={{color:'#10b981'}}>V·{a.Venda}</span>
                  </div>
                  <AnimPts pts={a.pts} style={{color:GOLD,fontWeight:700,fontSize:13,minWidth:52,textAlign:'right'}}/>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ====== TAB AO VIVO ======
function TabAoVivo({records,countdown,lastUpdate,load,loading,error}){
  const list=(Array.isArray(records)?records:[]);
  const recent=[...list].sort((a,b)=>b.ts-a.ts).slice(0,40);
  const updStr=lastUpdate?lastUpdate.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'}):'--';
  return(
    <div style={{maxWidth:580,margin:'0 auto',padding:'24px 0'}}>
      <div style={{...CARD,marginBottom:16}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{width:10,height:10,borderRadius:'50%',background:'#10b981',display:'inline-block',animation:'livePulse 1.2s ease-in-out infinite'}}/>
            <span style={{color:'#10b981',fontWeight:700,fontSize:13,letterSpacing:1}}>AO VIVO · UPSTASH KV</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{color:'#555',fontSize:12}}>às {updStr}</span>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:60,height:4,background:'#1f1f2e',borderRadius:4,overflow:'hidden'}}>
                <div style={{width:((TICK-countdown)/TICK*100)+'%',height:'100%',background:GOLD,borderRadius:4,transition:'width 1s linear'}}/>
              </div>
              <span style={{color:GOLD,fontSize:12,fontWeight:700,minWidth:20}}>{countdown}s</span>
            </div>
            <button onClick={()=>load(false)} disabled={loading} style={{background:'#1f1f2e',border:'1px solid #2a2a3e',color:loading?'#333':'#888',borderRadius:8,padding:'5px 12px',cursor:loading?'default':'pointer',fontSize:13}}>{loading?'⏳':'↻'}</button>
          </div>
        </div>
      </div>
      {error&&<div style={{...CARD,background:'#ef444410',border:'1px solid #ef444440',color:'#ef4444',fontSize:13,marginBottom:16}}>⚠️ {error}</div>}
      <div style={{color:'#555',fontSize:11,letterSpacing:2,marginBottom:12}}>ÚLTIMOS REGISTROS</div>
      {recent.length===0&&!loading&&<div style={{...CARD,textAlign:'center',color:'#333',padding:40,fontSize:13}}>Nenhum registro ainda</div>}
      {recent.map((r,i)=>{
        const a=ASSESSORS.find(x=>x.code===r.code);
        const tc=r.type==='R1'?'#3b82f6':r.type==='R2'?'#eab308':'#10b981';
        const isNew=i===0;
        return(
          <div key={r.id||i} style={{...CARD,marginBottom:8,display:'flex',alignItems:'center',gap:12,animation:isNew?'slideIn 0.4s ease-out':'none',borderColor:isNew?tc+'44':'#1f1f3a',boxShadow:isNew?'0 0 20px '+tc+'22':'none'}}>
            <Av name={r.name||'?'} size={36} ring={a?a.color:'#333'}/>
            <div style={{flex:1}}>
              <div style={{color:'#e5e7eb',fontWeight:700,fontSize:14,textTransform:'uppercase',letterSpacing:.5}}>{r.name}</div>
              <div style={{color:'#555',fontSize:11}}>{r.squad} · {fmt(r.ts)}</div>
            </div>
            <span style={{background:tc+'22',border:'1px solid '+tc,color:tc,borderRadius:99,padding:'3px 12px',fontSize:12,fontWeight:700}}>{r.type}</span>
            <div style={{color:GOLD,fontWeight:800,fontSize:15,minWidth:55,textAlign:'right'}}>+{PTS[r.type]||0} pts</div>
          </div>
        );
      })}
    </div>
  );
}

// ====== TAB LOGIN ======
function TabLogin({onLogin}){
  const [q,setQ]=useState(''),[sel,setSel]=useState(null),[err,setErr]=useState('');
  const list=q.length>=2?ASSESSORS.filter(a=>a.name.toLowerCase().includes(q.toLowerCase())||a.code.toLowerCase().includes(q.toLowerCase())).slice(0,7):[];
  const pick=a=>{setSel(a);setQ(a.name);setErr('');};
  const go=()=>{if(!sel){setErr('Selecione um nome da lista');return;}onLogin(sel);};
  return(
    <div style={{maxWidth:420,margin:'0 auto',padding:'40px 0'}}>
      <div style={{textAlign:'center',marginBottom:32}}>
        <div style={{fontSize:56,animation:'bounce 2s ease-in-out infinite'}}>🛡️</div>
        <h1 style={{margin:'8px 0 4px',color:GOLD,fontSize:24,letterSpacing:3,fontWeight:800,textShadow:'0 0 20px '+GOLD+'44'}}>INSURANCE DAY</h1>
        <p style={{color:'#555',fontSize:12,margin:0,letterSpacing:1}}>CAMPANHA 4-4-2 · JUNHO &amp; JULHO 2026</p>
      </div>
      <div style={CARD}>
        <label style={{display:'block',color:'#555',fontSize:11,marginBottom:8,letterSpacing:2}}>CÓDIGO XP OU NOME</label>
        <input autoFocus value={q} onChange={e=>{setQ(e.target.value);setSel(null);}} onKeyDown={e=>e.key==='Enter'&&go()} placeholder="Ex: A98943 ou Israel Gusso" style={{width:'100%',padding:'12px 14px',borderRadius:8,border:'1px solid #1f1f3a',background:'rgba(4,4,20,0.8)',color:'#e5e7eb',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
        {list.length>0&&(
          <div style={{marginTop:4,borderRadius:8,border:'1px solid #1a1a3a',background:'rgba(4,4,20,0.95)',overflow:'hidden'}}>
            {list.map(a=>(
              <button key={a.code} onClick={()=>pick(a)} style={{width:'100%',textAlign:'left',padding:'10px 12px',border:'none',borderBottom:'1px solid #1a1a3a',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
                <Av name={a.name} size={32} ring={a.color}/>
                <div>
                  <div style={{color:'#e5e7eb',fontSize:13,fontWeight:600,textTransform:'uppercase',letterSpacing:.5}}>{a.name}</div>
                  <div style={{color:'#555',fontSize:11}}>{a.code} · {a.squad}</div>
                </div>
              </button>
            ))}
          </div>
        )}
        {err&&<div style={{color:'#ef4444',fontSize:12,marginTop:8}}>{err}</div>}
        <button onClick={go} style={{marginTop:16,width:'100%',padding:'13px',background:'linear-gradient(135deg,'+GOLD+',#b8960c)',border:'none',borderRadius:8,color:'#000',fontWeight:800,fontSize:15,cursor:'pointer',letterSpacing:2,boxShadow:'0 4px 20px '+GOLD+'44',transition:'transform .15s,box-shadow .15s'}} onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 30px '+GOLD+'66';}} onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='0 4px 20px '+GOLD+'44';}}>ENTRAR &#8594;</button>
      </div>
    </div>
  );
}

// ====== TAB REGISTRAR ======
function TabRegistrar({user,records,add,onLogout}){
  const [saving,setSaving]=useState(false),[toast,setToast]=useState(null),[floatPts,setFloatPts]=useState(null),[lastType,setLastType]=useState(null);
  const mine=(Array.isArray(records)?records:[]).filter(r=>r.code===user.code);
  const myR1=mine.filter(r=>r.type==='R1').length, myR2=mine.filter(r=>r.type==='R2').length, myV=mine.filter(r=>r.type==='Venda').length;
  const myPts=myR1*30+myR2*50+myV*100;
  const pr=premio({R1:myR1,R2:myR2,Venda:myV});
  const showToast=(msg,ok,pts)=>{setToast({msg,ok,pts});setTimeout(()=>setToast(null),3500);};
  const animPts=useCountUp(myPts,800);
  const reg=async type=>{
    setSaving(true);setLastType(type);
    try{
      await add(user,type);
      launchFireworks(type);
      setFloatPts(PTS[type]);setTimeout(()=>setFloatPts(null),1500);
      showToast(type+' registrado com sucesso!',true,PTS[type]);
    }catch(e){showToast(e.message,false,null);}
    finally{setSaving(false);}
  };
  const BTNS=[
    {type:'R1',   label:'R1',   sub:'Reunião Agendada', pts:30, color:'#3b82f6'},
    {type:'R2',   label:'R2',   sub:'Reunião Realizada',pts:50, color:'#eab308'},
    {type:'Venda',label:'VENDA',sub:'Fechamento',       pts:100,color:'#10b981'},
  ];
  return(
    <div style={{maxWidth:500,margin:'0 auto',padding:'24px 0'}}>
      {toast    &&<Toast msg={toast.msg} ok={toast.ok} pts={toast.pts}/>}
      {floatPts &&<FloatingPts pts={floatPts} color={lastType==='Venda'?'#10b981':lastType==='R2'?'#eab308':'#3b82f6'}/>}
      <div style={{...CARD,marginBottom:16,display:'flex',alignItems:'center',gap:14,justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <Av name={user.name} size={46} ring={user.color} glow/>
          <div>
            <div style={{color:'#e5e7eb',fontWeight:800,fontSize:16,textTransform:'uppercase',letterSpacing:1}}>{user.name}</div>
            <div style={{color:'#555',fontSize:12}}>{user.squad} · {user.code}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{background:'#ef444420',border:'1px solid #ef444440',color:'#ef4444',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:12,fontWeight:700}}>SAIR</button>
      </div>
      <div style={{...CARD,marginBottom:16,textAlign:'center'}}>
        <div style={{color:'#555',fontSize:11,letterSpacing:2,marginBottom:4}}>SEUS PONTOS</div>
        <div style={{color:GOLD,fontSize:52,fontWeight:800,lineHeight:1,textShadow:'0 0 20px '+GOLD+'66'}}>{animPts}</div>
        {pr&&<div style={{marginTop:10,display:'inline-block',background:pr.hex+'22',border:'1px solid '+pr.hex,color:pr.hex,borderRadius:99,padding:'4px 16px',fontSize:12,fontWeight:700,animation:'glowPulse 2s ease-in-out infinite'}}>{pr.label} · R$ {pr.val}</div>}
      </div>
      <div style={{...CARD,marginBottom:16}}>
        <div style={{color:'#555',fontSize:11,letterSpacing:2,marginBottom:14}}>PROGRESSO 4-4-2</div>
        {[{type:'R1',val:myR1,max:4,color:'#3b82f6'},{type:'R2',val:myR2,max:4,color:'#eab308'},{type:'Venda',val:myV,max:2,color:'#10b981'}].map(m=>(
          <div key={m.type} style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
              <span style={{color:'#aaa',fontSize:13}}>{m.type}</span>
              <span style={{color:m.color,fontWeight:800,fontSize:13}}>{m.val} / {m.max}</span>
            </div>
            <div style={{background:'#1f1f3a',borderRadius:4,height:8,overflow:'hidden',position:'relative'}}>
              <div style={{width:Math.min(100,(m.val/m.max)*100)+'%',height:'100%',background:'linear-gradient(90deg,'+m.color+','+m.color+'cc)',borderRadius:4,transition:'width .6s cubic-bezier(0.34,1.56,0.64,1)',boxShadow:'0 0 12px '+m.color}}/>
              {m.val>=m.max&&<div style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',fontSize:12}}>✅</div>}
            </div>
          </div>
        ))}
      </div>
      <div style={{color:'#555',fontSize:11,letterSpacing:2,textAlign:'center',marginBottom:12}}>REGISTRAR</div>
      <div style={{display:'flex',gap:12,marginBottom:16}}>
        {BTNS.map(b=>(
          <button key={b.type} disabled={saving} onClick={()=>reg(b.type)}
            style={{flex:1,padding:'18px 8px',borderRadius:12,background:b.color+'18',border:'2px solid '+b.color,color:'#fff',cursor:saving?'not-allowed':'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6,opacity:saving?0.5:1,transition:'all .2s',backdropFilter:'blur(4px)'}}
            onMouseEnter={e=>{if(!saving){e.currentTarget.style.transform='translateY(-4px) scale(1.04)';e.currentTarget.style.boxShadow='0 8px 24px '+b.color+'44';e.currentTarget.style.background=b.color+'30';}}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';e.currentTarget.style.background=b.color+'18';}}>
            <span style={{fontSize:28}}>{saving&&lastType===b.type?'⏳':b.type==='R1'?'📅':b.type==='R2'?'✅':'💰'}</span>
            <span style={{fontWeight:800,fontSize:16,color:b.color,letterSpacing:1}}>{b.label}</span>
            <span style={{fontSize:11,color:'#555'}}>{b.sub}</span>
            <span style={{fontSize:13,fontWeight:700,color:b.color}}>+{b.pts} pts</span>
          </button>
        ))}
      </div>
      {mine.length>0&&(
        <div style={CARD}>
          <div style={{color:'#555',fontSize:11,letterSpacing:2,marginBottom:12}}>SEUS REGISTROS</div>
          {[...mine].sort((a,b)=>b.ts-a.ts).slice(0,8).map((r,i)=>{
            const b=BTNS.find(x=>x.type===r.type);
            return(
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #1a1a2e',alignItems:'center',animation:i===0?'slideIn 0.4s ease-out':'none'}}>
                <span style={{color:b?b.color:'#aaa',fontSize:13,fontWeight:700}}>{r.type}</span>
                <span style={{color:'#444',fontSize:11}}>{fmt(r.ts)}</span>
                <span style={{color:GOLD,fontWeight:800,fontSize:12}}>+{PTS[r.type]} pts</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ====== APP ROOT ======
export default function App(){
  const [tab,setTab]=useState('ranking'),[user,setUser]=useState(null);
  const kv=useKV();
  const TABS=[{id:'ranking',label:'🏆 Ranking'},{id:'ao-vivo',label:'🔴 Ao Vivo'},{id:'registrar',label:'＋ Registrar'}];
  const login=a=>{setUser(a);setTab('registrar');};
  const logout=()=>{setUser(null);setTab('ranking');};
  return(
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{min-height:100vh;}
        body{background:${BG};color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
        button,input{font-family:inherit;}
        @keyframes livePulse {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.8)}}
        @keyframes bounce    {0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes spin      {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes starPulse {0%,100%{opacity:.3}50%{opacity:.9}}
        @keyframes glowPulse {0%,100%{box-shadow:0 0 8px currentColor}50%{box-shadow:0 0 20px currentColor}}
        @keyframes slideIn   {from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
        @keyframes deltaFade {0%{opacity:1}70%{opacity:1}100%{opacity:0}}
      `}</style>
      <GalaxyBg/>
      <div style={{position:'relative',zIndex:1,padding:'0 16px',maxWidth:800,margin:'0 auto'}}>
        <div style={{padding:'14px 0 0',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(212,175,55,0.15)'}}>
          <span style={{color:GOLD,fontWeight:800,fontSize:17,letterSpacing:3,textShadow:'0 0 20px '+GOLD+'44'}}>🛡️ INSURANCE DAY</span>
          {user&&(
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <Av name={user.name} size={26} ring={user.color}/>
              <span style={{color:'#888',fontSize:12,textTransform:'uppercase',letterSpacing:1}}>{user.name.split(' ')[0]}</span>
            </div>
          )}
        </div>
        <div style={{display:'flex',gap:4,padding:'8px 0',borderBottom:'1px solid rgba(212,175,55,0.1)',marginBottom:4}}>
          {TABS.map(t=>(
            <button key={t.id}
              onClick={()=>{if(t.id==='registrar'&&!user){setTab('login');return;}setTab(t.id);}}
              style={{padding:'8px 18px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:700,fontSize:12,letterSpacing:1,transition:'all .15s',background:tab===t.id?GOLD+'22':'transparent',color:tab===t.id?GOLD:'#555',borderBottom:tab===t.id?'2px solid '+GOLD:'2px solid transparent'}}
            >{t.label}</button>
          ))}
        </div>
        {tab==='login'     &&<TabLogin onLogin={login}/>}
        {tab==='ranking'   &&<TabRanking records={kv.records} loading={kv.loading}/>}
        {tab==='ao-vivo'   &&<TabAoVivo records={kv.records} countdown={kv.countdown} lastUpdate={kv.lastUpdate} load={kv.load} loading={kv.loading} error={kv.error}/>}
        {tab==='registrar'&&user  &&<TabRegistrar user={user} records={kv.records} add={kv.add} onLogout={logout}/>}
        {tab==='registrar'&&!user &&<TabLogin onLogin={login}/>}
      </div>
    </>
  );
}
