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
const BG   = '#0a0a0a';
const CAROUSEL_INTERVAL = 4500;

// ====== FIREWORKS ======
const fwRef = { canvas:null, ctx:null, particles:[], raf:null, active:false };
function initFW(){
  if(fwRef.canvas)return;
  const c=document.createElement('canvas');
  c.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:8888;';
  c.width=window.innerWidth;c.height=window.innerHeight;
  document.body.appendChild(c);
  fwRef.canvas=c;fwRef.ctx=c.getContext('2d');
  window.addEventListener('resize',()=>{c.width=window.innerWidth;c.height=window.innerHeight;});
}
function launchFireworks(type){
  initFW();
  const{canvas:cv,ctx}=fwRef,W=cv.width,H=cv.height;
  const palettes={R1:['#3b82f6','#60a5fa','#bfdbfe','#fff'],R2:['#eab308','#facc15','#fde047','#fff'],Venda:['#d4af37','#f59e0b','#10b981','#fff','#f43f5e']};
  const cols=palettes[type]||palettes.Venda,bursts=type==='Venda'?5:3;
  for(let b=0;b<bursts;b++){setTimeout(()=>{const x=W*(0.2+Math.random()*0.6),y=H*(0.1+Math.random()*0.4),n=type==='Venda'?120:80;for(let i=0;i<n;i++){const angle=(Math.PI*2*i)/n+Math.random()*0.3,spd=2+Math.random()*6;fwRef.particles.push({x,y,vx:Math.cos(angle)*spd,vy:Math.sin(angle)*spd,alpha:1,decay:0.012+Math.random()*0.01,size:1.5+Math.random()*2,color:cols[Math.floor(Math.random()*cols.length)],trail:[]});}},b*220);}
  if(!fwRef.active){fwRef.active=true;function tick(){ctx.fillStyle='rgba(10,10,10,0.18)';ctx.fillRect(0,0,W,H);fwRef.particles=fwRef.particles.filter(p=>p.alpha>0.02);fwRef.particles.forEach(p=>{p.trail.push({x:p.x,y:p.y});if(p.trail.length>6)p.trail.shift();p.trail.forEach((t,i)=>{ctx.beginPath();ctx.arc(t.x,t.y,p.size*(i/p.trail.length)*0.6,0,Math.PI*2);ctx.fillStyle=p.color;ctx.globalAlpha=p.alpha*(i/p.trail.length)*0.4;ctx.fill();});ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fillStyle=p.color;ctx.globalAlpha=p.alpha;ctx.fill();ctx.globalAlpha=1;p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.vx*=0.98;p.alpha-=p.decay;});if(fwRef.particles.length>0)fwRef.raf=requestAnimationFrame(tick);else{ctx.clearRect(0,0,W,H);fwRef.active=false;}}tick();}
}

// ====== COUNT-UP ======
function useCountUp(target,duration=600){
  const[val,setVal]=useState(target),prev=useRef(target);
  useEffect(()=>{const start=prev.current,diff=target-start;if(diff===0)return;const t0=performance.now();const step=ts=>{const p=Math.min((ts-t0)/duration,1),ease=1-Math.pow(1-p,3);setVal(Math.round(start+diff*ease));if(p<1)requestAnimationFrame(step);else prev.current=target;};requestAnimationFrame(step);},[target,duration]);
  return val;
}

// ====== KV ======
async function kvFetch(){const r=await fetch('/api/kv');if(!r.ok)throw new Error('Falha ao buscar dados');const d=await r.json();return Array.isArray(d.records)?d.records:[];}
async function kvAdd(user,type){const r=await fetch('/api/kv',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'add',record:{code:user.code,name:user.name,squad:user.squad,type}})});if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.error||'Erro ao gravar');}return r.json();}
function buildRanking(records){const m={};ASSESSORS.forEach(a=>{m[a.code]={...a,R1:0,R2:0,Venda:0,pts:0};});(Array.isArray(records)?records:[]).forEach(r=>{if(m[r.code]){m[r.code][r.type]=(m[r.code][r.type]||0)+1;m[r.code].pts+=(PTS[r.type]||0);}});return Object.values(m).sort((a,b)=>b.pts-a.pts||b.Venda-a.Venda||b.R2-a.R2);}
function premio(a){if(a.R1>=4&&a.R2>=4&&a.Venda>=2)return{label:'Ouro',val:500,hex:'#d4af37'};if(a.R1>=4&&a.R2>=4)return{label:'Prata',val:300,hex:'#9ca3af'};if(a.R1>=4)return{label:'Bronze',val:150,hex:'#b45309'};return null;}
function initials(name){return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();}
function fmt(ts){return new Date(ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}

function useKV(){
  const[records,setRecords]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(null),[countdown,setCountdown]=useState(TICK),[lastUpdate,setLastUpdate]=useState(null);
  const load=useCallback(async(quiet=false)=>{if(!quiet)setLoading(true);setError(null);try{const data=await kvFetch();setRecords(Array.isArray(data)?data:[]);setLastUpdate(new Date());setCountdown(TICK);}catch(e){setError(e.message);}finally{setLoading(false);}},[]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{const id=setInterval(()=>load(true),TICK*1000);return()=>clearInterval(id);},[load]);
  useEffect(()=>{const id=setInterval(()=>setCountdown(p=>p<=1?TICK:p-1),1000);return()=>clearInterval(id);},[]);
  useEffect(()=>{const fn=()=>{if(document.visibilityState==='visible')load(true);};document.addEventListener('visibilitychange',fn);return()=>document.removeEventListener('visibilitychange',fn);},[load]);
  const add=useCallback(async(user,type)=>{const tmp={id:'tmp_'+Date.now(),code:user.code,name:user.name,squad:user.squad,type,ts:Date.now()};setRecords(p=>Array.isArray(p)?[...p,tmp]:[tmp]);await kvAdd(user,type);setTimeout(()=>load(true),800);},[load]);
  return{records,loading,error,countdown,lastUpdate,load,add};
}

// ====== ROCKY BACKGROUND ======
function RockyBg(){
  const ref=useRef(null);
  useEffect(()=>{
    const cv=ref.current;if(!cv)return;
    const ctx=cv.getContext('2d');
    let W=window.innerWidth,H=window.innerHeight;
    cv.width=W;cv.height=H;

    function rnd(min,max){return min+Math.random()*(max-min);}

    // Gera uma rocha poligonal angulosa
    function makeRock(cx,cy,w,h,npts){
      const pts=[];
      for(let i=0;i<npts;i++){
        const angle=(Math.PI*2*i/npts)+rnd(-0.3,0.3);
        const rx=w/2*rnd(0.6,1.0),ry=h/2*rnd(0.5,1.0);
        pts.push({x:cx+Math.cos(angle)*rx,y:cy+Math.sin(angle)*ry});
      }
      return pts;
    }

    function drawRock(pts,baseColor,lit){
      if(pts.length<3)return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x,pts[0].y);
      for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);
      ctx.closePath();
      // gradiente de cima (lit) pra baixo (sombra)
      const minY=Math.min(...pts.map(p=>p.y)),maxY=Math.max(...pts.map(p=>p.y));
      const g=ctx.createLinearGradient(0,minY,0,maxY);
      g.addColorStop(0,lit);
      g.addColorStop(0.4,baseColor);
      g.addColorStop(1,'#050505');
      ctx.fillStyle=g;
      ctx.fill();
      // borda levemente iluminada no topo
      ctx.strokeStyle='rgba(180,180,180,0.07)';
      ctx.lineWidth=1;
      ctx.stroke();
    }

    // Adiciona granulado (noise) sutil
    function addNoise(){
      const imgData=ctx.getImageData(0,0,W,H);
      const d=imgData.data;
      for(let i=0;i<d.length;i+=4){
        const n=(Math.random()-0.5)*18;
        d[i]  =Math.max(0,Math.min(255,d[i]+n));
        d[i+1]=Math.max(0,Math.min(255,d[i+1]+n));
        d[i+2]=Math.max(0,Math.min(255,d[i+2]+n));
      }
      ctx.putImageData(imgData,0,0);
    }

    function draw(){
      // Fundo base preto
      ctx.fillStyle='#0a0a0a';
      ctx.fillRect(0,0,W,H);

      // Camadas de rochas — fundo (menores/mais claras = mais longe)
      const rockDefs=[
        // fundo distante — rochas pequenas cinza médio
        {cx:W*0.05,cy:H*0.85,w:W*0.28,h:H*0.5, n:9, base:'#1c1c1c',lit:'#2e2e2e'},
        {cx:W*0.20,cy:H*0.9, w:W*0.22,h:H*0.45,n:8, base:'#181818',lit:'#282828'},
        {cx:W*0.60,cy:H*0.88,w:W*0.25,h:H*0.48,n:9, base:'#1a1a1a',lit:'#2c2c2c'},
        {cx:W*0.80,cy:H*0.85,w:W*0.3, h:H*0.5, n:10,base:'#1e1e1e',lit:'#303030'},
        {cx:W*0.92,cy:H*0.9, w:W*0.2, h:H*0.42,n:8, base:'#171717',lit:'#272727'},
        // meio — pedras médias
        {cx:W*-0.02,cy:H*0.92,w:W*0.32,h:H*0.65,n:10,base:'#141414',lit:'#222222'},
        {cx:W*0.35,cy:H*0.95,w:W*0.18,h:H*0.38,n:7, base:'#161616',lit:'#242424'},
        {cx:W*0.50,cy:H*0.97,w:W*0.14,h:H*0.3, n:7, base:'#111111',lit:'#1e1e1e'},
        {cx:W*0.70,cy:H*0.93,w:W*0.20,h:H*0.42,n:8, base:'#131313',lit:'#202020'},
        {cx:W*1.02,cy:H*0.92,w:W*0.28,h:H*0.58,n:9, base:'#151515',lit:'#232323'},
        // frente — pedras grandes e escuras
        {cx:W*0.10,cy:H*1.0, w:W*0.38,h:H*0.72,n:11,base:'#0d0d0d',lit:'#1a1a1a'},
        {cx:W*0.88,cy:H*1.0, w:W*0.35,h:H*0.68,n:10,base:'#0e0e0e',lit:'#1b1b1b'},
        {cx:W*0.38,cy:H*1.05,w:W*0.20,h:H*0.35,n:8, base:'#0c0c0c',lit:'#181818'},
        {cx:W*0.62,cy:H*1.02,w:W*0.22,h:H*0.38,n:8, base:'#0b0b0b',lit:'#171717'},
      ];

      // Seed fixo para shapes deterministas (sem re-render)
      const savedRnd=Math.random;
      let seed=42;
      Math.random=()=>{seed=(seed*1664525+1013904223)&0xffffffff;return(seed>>>0)/0xffffffff;};

      rockDefs.forEach(r=>{
        const pts=makeRock(r.cx,r.cy,r.w,r.h,r.n);
        drawRock(pts,r.base,r.lit);
      });

      Math.random=savedRnd;

      // Vinheta escura nas bordas
      const vig=ctx.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.9);
      vig.addColorStop(0,'rgba(0,0,0,0)');
      vig.addColorStop(1,'rgba(0,0,0,0.75)');
      ctx.fillStyle=vig;
      ctx.fillRect(0,0,W,H);

      // Névoa sutil no centro (como na imagem de referência)
      const fog=ctx.createRadialGradient(W/2,H*0.55,0,W/2,H*0.55,W*0.45);
      fog.addColorStop(0,'rgba(30,30,35,0.18)');
      fog.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=fog;
      ctx.fillRect(0,0,W,H);

      // Granulado
      addNoise();
    }

    draw();

    const onResize=()=>{W=window.innerWidth;H=window.innerHeight;cv.width=W;cv.height=H;draw();};
    window.addEventListener('resize',onResize);
    return()=>window.removeEventListener('resize',onResize);
  },[]);
  return <canvas ref={ref} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:0}}/>;
}

const CARD={background:'rgba(8,8,8,0.82)',border:'1px solid #1f1f1f',borderRadius:12,padding:16,backdropFilter:'blur(8px)'};

function Av({name,size=56,ring=GOLD,glow=false}){
  const bgs=['#1d4ed8','#7c3aed','#c2410c','#065f46','#92400e','#0e7490','#374151'];
  return <div style={{width:size,height:size,borderRadius:'50%',background:bgs[name.charCodeAt(0)%bgs.length],border:'3px solid '+ring,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:size*0.32,flexShrink:0,letterSpacing:1,boxShadow:glow?'0 0 24px '+ring+'99,0 0 48px '+ring+'44':'0 0 8px '+ring+'33'}}>{initials(name)}</div>;
}

function Toast({msg,ok,pts}){
  const[vis,setVis]=useState(false);
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
  const[pos,setPos]=useState(0),[op,setOp]=useState(1);
  useEffect(()=>{setTimeout(()=>{setPos(-60);setOp(0);},50);},[]);
  return <div style={{position:'fixed',bottom:120,left:'50%',transform:`translateX(-50%) translateY(${pos}px)`,color,fontSize:36,fontWeight:900,textShadow:'0 0 20px '+color,opacity:op,transition:'all 1.2s ease-out',pointerEvents:'none',zIndex:9998}}>+{pts}</div>;
}

function DeltaBadge({delta}){
  if(!delta||delta===0)return null;
  const up=delta>0;
  return <div style={{display:'inline-flex',alignItems:'center',gap:2,background:up?'#10b98122':'#ef444422',border:'1px solid '+(up?'#10b981':'#ef4444'),borderRadius:99,padding:'2px 6px',fontSize:10,fontWeight:800,color:up?'#10b981':'#ef4444',animation:'deltaFade 3s forwards'}}>{up?'↑':'↓'}{Math.abs(delta)}</div>;
}

function AnimPts({pts,style}){
  const val=useCountUp(pts);
  return <div style={style}>{val}</div>;
}

// ====== SPOTLIGHT CARD ======
function SpotlightCard({a,rank,deltas}){
  const pr=premio(a);
  const ringColors=['#d4af37','#c0c0c0','#cd7f32','#6b7280','#4b5563'];
  const medalEmoji=['🥇','🥈','🥉','4️⃣','5️⃣'];
  const ring=ringColors[rank]||GOLD,d=deltas[a.code],animPts=useCountUp(a.pts,800);
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'32px 24px',gap:16,animation:'carouselIn 0.5s cubic-bezier(0.34,1.2,0.64,1)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:32}}>{medalEmoji[rank]}</span>
        <div style={{color:ring,fontSize:13,fontWeight:800,letterSpacing:3,textTransform:'uppercase',textShadow:'0 0 16px '+ring+'88'}}>{rank+1}º LUGAR</div>
        <DeltaBadge delta={d}/>
      </div>
      <div style={{position:'relative'}}>
        <Av name={a.name} size={120} ring={ring} glow={rank===0}/>
        {rank===0&&<div style={{position:'absolute',top:-20,left:'50%',transform:'translateX(-50%)',fontSize:32,animation:'bounce 1s ease-in-out infinite'}}>👑</div>}
      </div>
      <div style={{textAlign:'center'}}>
        <div style={{color:rank===0?GOLD:'#e5e7eb',fontSize:rank===0?28:22,fontWeight:800,letterSpacing:2,textTransform:'uppercase',textShadow:rank===0?'0 0 30px '+GOLD+'88':'none',lineHeight:1.2}}>{a.name}</div>
        <div style={{color:'#555',fontSize:12,letterSpacing:2,marginTop:6}}>{a.squad.toUpperCase()}</div>
        {pr&&<div style={{marginTop:8,display:'inline-block',background:pr.hex+'22',border:'1px solid '+pr.hex,color:pr.hex,borderRadius:99,padding:'4px 16px',fontSize:11,fontWeight:700,animation:'glowPulse 2s ease-in-out infinite'}}>{pr.label} · R$ {pr.val}</div>}
      </div>
      <div style={{display:'flex',gap:24,background:'rgba(255,255,255,0.03)',borderRadius:16,padding:'16px 32px',border:'1px solid rgba(212,175,55,0.1)'}}>
        {[{v:a.R1,c:'#3b82f6',l:'R1'},{v:a.R2,c:'#eab308',l:'R2'},{v:a.Venda,c:'#10b981',l:'VENDA'}].map(x=>(
          <div key={x.l} style={{textAlign:'center'}}><div style={{color:x.c,fontSize:36,fontWeight:800,lineHeight:1}}>{x.v}</div><div style={{color:'#444',fontSize:10,letterSpacing:2,marginTop:4}}>{x.l}</div></div>
        ))}
      </div>
      <div style={{textAlign:'center'}}>
        <div style={{color:ring,fontSize:56,fontWeight:900,lineHeight:1,textShadow:'0 0 30px '+ring+'66'}}>{animPts}</div>
        <div style={{color:'#444',fontSize:11,letterSpacing:3,marginTop:4}}>PONTOS</div>
      </div>
      <div style={{width:'100%',maxWidth:320}}>
        {[{type:'R1',val:a.R1,max:META.R1,color:'#3b82f6'},{type:'R2',val:a.R2,max:META.R2,color:'#eab308'},{type:'Venda',val:a.Venda,max:META.Venda,color:'#10b981'}].map(m=>(
          <div key={m.type} style={{marginBottom:8}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}><span style={{color:'#555',fontSize:11}}>{m.type}</span><span style={{color:m.color,fontSize:11,fontWeight:700}}>{m.val}/{m.max}</span></div>
            <div style={{background:'#1a1a1a',borderRadius:4,height:6,overflow:'hidden'}}><div style={{width:Math.min(100,(m.val/m.max)*100)+'%',height:'100%',background:'linear-gradient(90deg,'+m.color+','+m.color+'cc)',borderRadius:4,transition:'width .8s cubic-bezier(0.34,1.56,0.64,1)',boxShadow:'0 0 8px '+m.color}}/></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ====== PODIO VIEW ======
function PodiumView({top5,deltas,cardRefs}){
  const podiumOrder=[1,0,2],podiumH=[180,240,150],podiumAvSz=[72,96,64];
  return(
    <div style={{position:'relative',background:'linear-gradient(180deg,rgba(10,10,10,0.96) 0%,rgba(5,5,5,0.99) 100%)',borderRadius:20,padding:'40px 16px 0',minHeight:340,overflow:'hidden',border:'1px solid rgba(212,175,55,0.12)',boxShadow:'0 0 60px rgba(0,0,0,0.6)',animation:'carouselIn 0.5s cubic-bezier(0.34,1.2,0.64,1)'}}>
      {/* Linha dourada sutil no topo */}
      <div style={{position:'absolute',top:0,left:'10%',right:'10%',height:1,background:'linear-gradient(90deg,transparent,'+GOLD+'44,transparent)'}}/>
      <div style={{position:'absolute',top:'8%',left:'50%',transform:'translateX(-50%)',width:400,height:200,background:'radial-gradient(ellipse,rgba(212,175,55,0.06) 0%,transparent 70%)',pointerEvents:'none'}}/>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'center',gap:0,position:'relative',zIndex:2}}>
        {podiumOrder.map((idx,vi)=>{
          const a=top5[idx];if(!a)return <div key={vi} style={{flex:1}}/>;
          const isFirst=idx===0,avSz=podiumAvSz[vi],colH=podiumH[vi];
          const ringCol=idx===0?GOLD:idx===1?'#c0c0c0':'#cd7f32';
          const pr=premio(a),d=deltas[a.code];
          return(
            <div key={a.code} ref={el=>cardRefs.current[a.code]=el} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',maxWidth:200}}>
              <div style={{textAlign:'center',marginBottom:10,padding:'0 8px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginBottom:2}}>
                  <div style={{color:isFirst?GOLD:'#e5e7eb',fontWeight:800,fontSize:isFirst?14:12,letterSpacing:2,textTransform:'uppercase',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',textShadow:isFirst?'0 0 20px '+GOLD+'88':'none'}}>{a.name}</div>
                  <DeltaBadge delta={d}/>
                </div>
                <div style={{color:'#444',fontSize:10,letterSpacing:1}}>{a.squad.toUpperCase()}</div>
                {pr&&<div style={{color:pr.hex,fontSize:10,fontWeight:700,marginTop:3,animation:'glowPulse 2s ease-in-out infinite'}}>{pr.label} R${pr.val}</div>}
              </div>
              <div style={{position:'relative',marginBottom:0}}>
                <Av name={a.name} size={avSz} ring={ringCol} glow={isFirst}/>
                {isFirst&&<div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',fontSize:20,animation:'bounce 1s ease-in-out infinite'}}>👑</div>}
                <div style={{position:'absolute',bottom:-8,left:'50%',transform:'translateX(-50%)',background:ringCol,color:'#000',borderRadius:'50%',width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:11}}>{idx+1}</div>
              </div>
              <div style={{marginTop:16,width:'100%',height:colH,background:'linear-gradient(180deg,rgba(18,18,18,0.95) 0%,rgba(6,6,6,0.98) 100%)',border:'1px solid '+(isFirst?GOLD+'55':'rgba(212,175,55,0.08)'),borderBottom:'none',borderRadius:'8px 8px 0 0',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'16px 8px',boxShadow:isFirst?'0 -8px 30px '+GOLD+'1a':'none'}}>
                <div style={{display:'flex',gap:20}}>
                  <div style={{textAlign:'center'}}><AnimPts pts={a.R1} style={{color:'#e5e7eb',fontSize:isFirst?36:28,fontWeight:800,lineHeight:1}}/><div style={{color:'#333',fontSize:9,letterSpacing:1,marginTop:4}}>R1</div></div>
                  <div style={{textAlign:'center'}}><AnimPts pts={a.R2} style={{color:'#e5e7eb',fontSize:isFirst?36:28,fontWeight:800,lineHeight:1}}/><div style={{color:'#333',fontSize:9,letterSpacing:1,marginTop:4}}>R2</div></div>
                  {a.Venda>0&&<div style={{textAlign:'center'}}><AnimPts pts={a.Venda} style={{color:'#10b981',fontSize:isFirst?36:28,fontWeight:800,lineHeight:1}}/><div style={{color:'#333',fontSize:9,letterSpacing:1,marginTop:4}}>VENDA</div></div>}
                </div>
                <AnimPts pts={a.pts} style={{color:GOLD,fontWeight:800,fontSize:isFirst?18:14,marginTop:10,textShadow:'0 0 10px '+GOLD+'66'}}/>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ====== TAB RANKING ======
function TabRanking({records,loading}){
  const[showAll,setShowAll]=useState(false);
  const rank=buildRanking(records),top5=rank.slice(0,5);
  const TOTAL_SLIDES=1+Math.min(top5.length,5);
  const[slide,setSlide]=useState(0),[paused,setPaused]=useState(false),[slideKey,setSlideKey]=useState(0);

  useEffect(()=>{
    if(paused||TOTAL_SLIDES<=1)return;
    const id=setInterval(()=>{setSlide(s=>(s+1)%TOTAL_SLIDES);setSlideKey(k=>k+1);},CAROUSEL_INTERVAL);
    return()=>clearInterval(id);
  },[paused,TOTAL_SLIDES]);

  const cardRefs=useRef({}),snapshots=useRef({}),prevRankOrder=useRef([]);
  const[deltas,setDeltas]=useState({});

  useEffect(()=>{
    const prevOrder=prevRankOrder.current;
    if(prevOrder.length>0){const nd={};rank.forEach((a,ni)=>{const oi=prevOrder.indexOf(a.code);if(oi!==-1&&oi!==ni)nd[a.code]=oi-ni;});if(Object.keys(nd).length>0){setDeltas(nd);setTimeout(()=>setDeltas({}),3000);}}
    prevRankOrder.current=rank.map(a=>a.code);
  },[records]);

  useLayoutEffect(()=>{Object.keys(cardRefs.current).forEach(code=>{const el=cardRefs.current[code];if(el)snapshots.current[code]=el.getBoundingClientRect().top;});});
  useLayoutEffect(()=>{Object.keys(cardRefs.current).forEach(code=>{const el=cardRefs.current[code],prevTop=snapshots.current[code];if(!el||prevTop==null)return;const delta=prevTop-el.getBoundingClientRect().top;if(Math.abs(delta)>2){el.style.transition='none';el.style.transform=`translateY(${delta}px)`;requestAnimationFrame(()=>{el.style.transition='transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94)';el.style.transform='translateY(0)';});}});},[records]);

  const totalR1=rank.reduce((s,a)=>s+a.R1,0),totalR2=rank.reduce((s,a)=>s+a.R2,0),totalVenda=rank.reduce((s,a)=>s+a.Venda,0);
  const ating=ASSESSORS.length*META.R1>0?Math.round((totalR1/(ASSESSORS.length*META.R1))*100):0;

  if(loading&&records.length===0)return(<div style={{textAlign:'center',padding:80}}><div style={{fontSize:40,animation:'spin 1s linear infinite',display:'inline-block'}}>✨</div><div style={{color:'#444',marginTop:12,letterSpacing:2,fontSize:12}}>CARREGANDO...</div></div>);

  return(
    <div style={{maxWidth:760,margin:'0 auto',padding:'24px 0'}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:32}}>
        {[
          {label:'R1 REALIZADAS',val:totalR1,  color:'#3b82f6',icon:'📅'},
          {label:'R2 REALIZADAS',val:totalR2,  color:'#eab308',icon:'✅'},
          {label:'VENDAS',       val:totalVenda,color:'#10b981',icon:'💰'},
          {label:'ATINGIMENTO',  val:ating+'%', color:'#22c55e',icon:'🎯'},
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

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <span style={{color:GOLD,fontSize:13,fontWeight:700,letterSpacing:3,textShadow:'0 0 16px '+GOLD+'66'}}>
          🏆 {slide===0?'TOP 5 ASSESSORES':'DESTAQUE · '+top5[slide-1]?.name.split(' ')[0].toUpperCase()}
        </span>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{display:'flex',gap:5}}>
            {Array.from({length:TOTAL_SLIDES}).map((_,i)=>(
              <button key={i} onClick={()=>{setSlide(i);setSlideKey(k=>k+1);setPaused(true);setTimeout(()=>setPaused(false),8000);}}
                style={{width:i===slide?20:8,height:8,borderRadius:4,border:'none',cursor:'pointer',background:i===slide?GOLD:'#222',transition:'all .3s',padding:0}}/>
            ))}
          </div>
          <button onClick={()=>setPaused(p=>!p)}
            style={{background:'#111',border:'1px solid #222',color:'#555',borderRadius:8,padding:'4px 10px',cursor:'pointer',fontSize:13,transition:'color .2s'}}
            onMouseEnter={e=>e.currentTarget.style.color=GOLD} onMouseLeave={e=>e.currentTarget.style.color='#555'}>
            {paused?'▶':'⏸'}
          </button>
        </div>
      </div>

      {!paused&&<div style={{height:2,background:'#1a1a1a',borderRadius:2,marginBottom:16,overflow:'hidden'}}>
        <div key={slideKey} style={{height:'100%',background:GOLD,borderRadius:2,animation:`slideProgress ${CAROUSEL_INTERVAL}ms linear`}}/>
      </div>}

      <div style={{...CARD,padding:0,overflow:'hidden',minHeight:380,marginBottom:16}}>
        {slide===0&&<PodiumView key={'podium-'+slideKey} top5={top5} deltas={deltas} cardRefs={cardRefs}/>}
        {slide>0&&top5[slide-1]&&<SpotlightCard key={'spot-'+slideKey} a={top5[slide-1]} rank={slide-1} deltas={deltas}/>}
      </div>

      <div style={CARD}>
        <button onClick={()=>setShowAll(p=>!p)} style={{background:'none',border:'none',color:'#444',fontSize:12,cursor:'pointer',letterSpacing:1,padding:'4px 0',width:'100%',textAlign:'left',transition:'color .2s'}} onMouseEnter={e=>e.currentTarget.style.color=GOLD} onMouseLeave={e=>e.currentTarget.style.color='#444'}>
          {showAll?'▲ OCULTAR':'▼ VER TODOS OS '+rank.length+' ASSESSORES'}
        </button>
        {showAll&&(
          <div style={{marginTop:14}}>
            {rank.slice(5).map((a,i)=>{
              const d=deltas[a.code];
              return(
                <div key={a.code} ref={el=>cardRefs.current[a.code]=el}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #141414',transition:'background .15s',borderRadius:6}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(212,175,55,0.04)'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}>
                  <span style={{color:'#2a2a2a',fontSize:12,minWidth:28,textAlign:'center'}}>{i+6}</span>
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
  const list=Array.isArray(records)?records:[],recent=[...list].sort((a,b)=>b.ts-a.ts).slice(0,40);
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
            <span style={{color:'#444',fontSize:12}}>às {updStr}</span>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:60,height:4,background:'#1a1a1a',borderRadius:4,overflow:'hidden'}}>
                <div style={{width:((TICK-countdown)/TICK*100)+'%',height:'100%',background:GOLD,borderRadius:4,transition:'width 1s linear'}}/>
              </div>
              <span style={{color:GOLD,fontSize:12,fontWeight:700,minWidth:20}}>{countdown}s</span>
            </div>
            <button onClick={()=>load(false)} disabled={loading} style={{background:'#111',border:'1px solid #222',color:loading?'#2a2a2a':'#666',borderRadius:8,padding:'5px 12px',cursor:loading?'default':'pointer',fontSize:13}}>{loading?'⏳':'↻'}</button>
          </div>
        </div>
      </div>
      {error&&<div style={{...CARD,background:'#ef444410',border:'1px solid #ef444440',color:'#ef4444',fontSize:13,marginBottom:16}}>⚠️ {error}</div>}
      <div style={{color:'#444',fontSize:11,letterSpacing:2,marginBottom:12}}>ÚLTIMOS REGISTROS</div>
      {recent.length===0&&!loading&&<div style={{...CARD,textAlign:'center',color:'#2a2a2a',padding:40,fontSize:13}}>Nenhum registro ainda</div>}
      {recent.map((r,i)=>{
        const a=ASSESSORS.find(x=>x.code===r.code),tc=r.type==='R1'?'#3b82f6':r.type==='R2'?'#eab308':'#10b981',isNew=i===0;
        return(
          <div key={r.id||i} style={{...CARD,marginBottom:8,display:'flex',alignItems:'center',gap:12,animation:isNew?'slideIn 0.4s ease-out':'none',borderColor:isNew?tc+'44':'#1f1f1f',boxShadow:isNew?'0 0 20px '+tc+'22':'none'}}>
            <Av name={r.name||'?'} size={36} ring={a?a.color:'#222'}/>
            <div style={{flex:1}}><div style={{color:'#e5e7eb',fontWeight:700,fontSize:14,textTransform:'uppercase',letterSpacing:.5}}>{r.name}</div><div style={{color:'#444',fontSize:11}}>{r.squad} · {fmt(r.ts)}</div></div>
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
  const[q,setQ]=useState(''),[sel,setSel]=useState(null),[err,setErr]=useState('');
  const list=q.length>=2?ASSESSORS.filter(a=>a.name.toLowerCase().includes(q.toLowerCase())||a.code.toLowerCase().includes(q.toLowerCase())).slice(0,7):[];
  const pick=a=>{setSel(a);setQ(a.name);setErr('');};
  const go=()=>{if(!sel){setErr('Selecione um nome da lista');return;}onLogin(sel);};
  return(
    <div style={{maxWidth:420,margin:'0 auto',padding:'40px 0'}}>
      <div style={{textAlign:'center',marginBottom:32}}>
        <div style={{fontSize:56,animation:'bounce 2s ease-in-out infinite'}}>🛡️</div>
        <h1 style={{margin:'8px 0 4px',color:GOLD,fontSize:24,letterSpacing:3,fontWeight:800,textShadow:'0 0 20px '+GOLD+'44'}}>INSURANCE DAY</h1>
        <p style={{color:'#444',fontSize:12,margin:0,letterSpacing:1}}>CAMPANHA 4-4-2 · JUNHO &amp; JULHO 2026</p>
      </div>
      <div style={CARD}>
        <label style={{display:'block',color:'#444',fontSize:11,marginBottom:8,letterSpacing:2}}>CÓDIGO XP OU NOME</label>
        <input autoFocus value={q} onChange={e=>{setQ(e.target.value);setSel(null);}} onKeyDown={e=>e.key==='Enter'&&go()} placeholder="Ex: A98943 ou Israel Gusso" style={{width:'100%',padding:'12px 14px',borderRadius:8,border:'1px solid #1f1f1f',background:'rgba(4,4,4,0.9)',color:'#e5e7eb',fontSize:14,outline:'none',boxSizing:'border-box'}}/>
        {list.length>0&&(
          <div style={{marginTop:4,borderRadius:8,border:'1px solid #1a1a1a',background:'rgba(4,4,4,0.98)',overflow:'hidden'}}>
            {list.map(a=>(
              <button key={a.code} onClick={()=>pick(a)} style={{width:'100%',textAlign:'left',padding:'10px 12px',border:'none',borderBottom:'1px solid #1a1a1a',background:'transparent',cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
                <Av name={a.name} size={32} ring={a.color}/>
                <div><div style={{color:'#e5e7eb',fontSize:13,fontWeight:600,textTransform:'uppercase',letterSpacing:.5}}>{a.name}</div><div style={{color:'#444',fontSize:11}}>{a.code} · {a.squad}</div></div>
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
  const[saving,setSaving]=useState(false),[toast,setToast]=useState(null),[floatPts,setFloatPts]=useState(null),[lastType,setLastType]=useState(null);
  const mine=(Array.isArray(records)?records:[]).filter(r=>r.code===user.code);
  const myR1=mine.filter(r=>r.type==='R1').length,myR2=mine.filter(r=>r.type==='R2').length,myV=mine.filter(r=>r.type==='Venda').length;
  const myPts=myR1*30+myR2*50+myV*100,pr=premio({R1:myR1,R2:myR2,Venda:myV}),animPts=useCountUp(myPts,800);
  const showToast=(msg,ok,pts)=>{setToast({msg,ok,pts});setTimeout(()=>setToast(null),3500);};
  const reg=async type=>{setSaving(true);setLastType(type);try{await add(user,type);launchFireworks(type);setFloatPts(PTS[type]);setTimeout(()=>setFloatPts(null),1500);showToast(type+' registrado com sucesso!',true,PTS[type]);}catch(e){showToast(e.message,false,null);}finally{setSaving(false);}}
  const BTNS=[{type:'R1',label:'R1',sub:'Reunião Agendada',pts:30,color:'#3b82f6'},{type:'R2',label:'R2',sub:'Reunião Realizada',pts:50,color:'#eab308'},{type:'Venda',label:'VENDA',sub:'Fechamento',pts:100,color:'#10b981'}];
  return(
    <div style={{maxWidth:500,margin:'0 auto',padding:'24px 0'}}>
      {toast&&<Toast msg={toast.msg} ok={toast.ok} pts={toast.pts}/>}
      {floatPts&&<FloatingPts pts={floatPts} color={lastType==='Venda'?'#10b981':lastType==='R2'?'#eab308':'#3b82f6'}/>}
      <div style={{...CARD,marginBottom:16,display:'flex',alignItems:'center',gap:14,justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <Av name={user.name} size={46} ring={user.color} glow/>
          <div><div style={{color:'#e5e7eb',fontWeight:800,fontSize:16,textTransform:'uppercase',letterSpacing:1}}>{user.name}</div><div style={{color:'#444',fontSize:12}}>{user.squad} · {user.code}</div></div>
        </div>
        <button onClick={onLogout} style={{background:'#ef444420',border:'1px solid #ef444440',color:'#ef4444',borderRadius:8,padding:'6px 12px',cursor:'pointer',fontSize:12,fontWeight:700}}>SAIR</button>
      </div>
      <div style={{...CARD,marginBottom:16,textAlign:'center'}}>
        <div style={{color:'#444',fontSize:11,letterSpacing:2,marginBottom:4}}>SEUS PONTOS</div>
        <div style={{color:GOLD,fontSize:52,fontWeight:800,lineHeight:1,textShadow:'0 0 20px '+GOLD+'66'}}>{animPts}</div>
        {pr&&<div style={{marginTop:10,display:'inline-block',background:pr.hex+'22',border:'1px solid '+pr.hex,color:pr.hex,borderRadius:99,padding:'4px 16px',fontSize:12,fontWeight:700,animation:'glowPulse 2s ease-in-out infinite'}}>{pr.label} · R$ {pr.val}</div>}
      </div>
      <div style={{...CARD,marginBottom:16}}>
        <div style={{color:'#444',fontSize:11,letterSpacing:2,marginBottom:14}}>PROGRESSO 4-4-2</div>
        {[{type:'R1',val:myR1,max:4,color:'#3b82f6'},{type:'R2',val:myR2,max:4,color:'#eab308'},{type:'Venda',val:myV,max:2,color:'#10b981'}].map(m=>(
          <div key={m.type} style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{color:'#aaa',fontSize:13}}>{m.type}</span><span style={{color:m.color,fontWeight:800,fontSize:13}}>{m.val} / {m.max}</span></div>
            <div style={{background:'#1a1a1a',borderRadius:4,height:8,overflow:'hidden',position:'relative'}}>
              <div style={{width:Math.min(100,(m.val/m.max)*100)+'%',height:'100%',background:'linear-gradient(90deg,'+m.color+','+m.color+'cc)',borderRadius:4,transition:'width .6s cubic-bezier(0.34,1.56,0.64,1)',boxShadow:'0 0 12px '+m.color}}/>
              {m.val>=m.max&&<div style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',fontSize:12}}>✅</div>}
            </div>
          </div>
        ))}
      </div>
      <div style={{color:'#444',fontSize:11,letterSpacing:2,textAlign:'center',marginBottom:12}}>REGISTRAR</div>
      <div style={{display:'flex',gap:12,marginBottom:16}}>
        {BTNS.map(b=>(
          <button key={b.type} disabled={saving} onClick={()=>reg(b.type)}
            style={{flex:1,padding:'18px 8px',borderRadius:12,background:b.color+'18',border:'2px solid '+b.color,color:'#fff',cursor:saving?'not-allowed':'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:6,opacity:saving?0.5:1,transition:'all .2s',backdropFilter:'blur(4px)'}}
            onMouseEnter={e=>{if(!saving){e.currentTarget.style.transform='translateY(-4px) scale(1.04)';e.currentTarget.style.boxShadow='0 8px 24px '+b.color+'44';e.currentTarget.style.background=b.color+'30';}}}
            onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow='';e.currentTarget.style.background=b.color+'18';}}>
            <span style={{fontSize:28}}>{saving&&lastType===b.type?'⏳':b.type==='R1'?'📅':b.type==='R2'?'✅':'💰'}</span>
            <span style={{fontWeight:800,fontSize:16,color:b.color,letterSpacing:1}}>{b.label}</span>
            <span style={{fontSize:11,color:'#444'}}>{b.sub}</span>
            <span style={{fontSize:13,fontWeight:700,color:b.color}}>+{b.pts} pts</span>
          </button>
        ))}
      </div>
      {mine.length>0&&(
        <div style={CARD}>
          <div style={{color:'#444',fontSize:11,letterSpacing:2,marginBottom:12}}>SEUS REGISTROS</div>
          {[...mine].sort((a,b)=>b.ts-a.ts).slice(0,8).map((r,i)=>{
            const b=BTNS.find(x=>x.type===r.type);
            return(<div key={i} style={{display:'flex',justifyContent:'space-between',padding:'7px 0',borderBottom:'1px solid #141414',alignItems:'center',animation:i===0?'slideIn 0.4s ease-out':'none'}}><span style={{color:b?b.color:'#aaa',fontSize:13,fontWeight:700}}>{r.type}</span><span style={{color:'#333',fontSize:11}}>{fmt(r.ts)}</span><span style={{color:GOLD,fontWeight:800,fontSize:12}}>+{PTS[r.type]} pts</span></div>);
          })}
        </div>
      )}
    </div>
  );
}

// ====== APP ROOT ======
export default function App(){
  const[tab,setTab]=useState('ranking'),[user,setUser]=useState(null);
  const kv=useKV();
  const TABS=[{id:'ranking',label:'🏆 Ranking'},{id:'ao-vivo',label:'🔴 Ao Vivo'},{id:'registrar',label:'＋ Registrar'}];
  const login=a=>{setUser(a);setTab('registrar');};
  const logout=()=>{setUser(null);setTab('ranking');};
  return(
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{min-height:100vh;}
        body{background:#0a0a0a;color:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;}
        button,input{font-family:inherit;}
        @keyframes livePulse  {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.8)}}
        @keyframes bounce     {0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes spin       {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes glowPulse  {0%,100%{box-shadow:0 0 8px currentColor}50%{box-shadow:0 0 20px currentColor}}
        @keyframes slideIn    {from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}
        @keyframes deltaFade  {0%{opacity:1}70%{opacity:1}100%{opacity:0}}
        @keyframes carouselIn {from{opacity:0;transform:translateY(18px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes slideProgress {from{width:0%}to{width:100%}}
      `}</style>
      <RockyBg/>
      <div style={{position:'relative',zIndex:1,padding:'0 16px',maxWidth:800,margin:'0 auto'}}>
        <div style={{padding:'14px 0 0',display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(212,175,55,0.12)'}}>
          <span style={{color:GOLD,fontWeight:800,fontSize:17,letterSpacing:3,textShadow:'0 0 20px '+GOLD+'44'}}>🛡️ INSURANCE DAY</span>
          {user&&(<div style={{display:'flex',alignItems:'center',gap:8}}><Av name={user.name} size={26} ring={user.color}/><span style={{color:'#666',fontSize:12,textTransform:'uppercase',letterSpacing:1}}>{user.name.split(' ')[0]}</span></div>)}
        </div>
        <div style={{display:'flex',gap:4,padding:'8px 0',borderBottom:'1px solid rgba(212,175,55,0.08)',marginBottom:4}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>{if(t.id==='registrar'&&!user){setTab('login');return;}setTab(t.id);}}
              style={{padding:'8px 18px',borderRadius:8,border:'none',cursor:'pointer',fontWeight:700,fontSize:12,letterSpacing:1,transition:'all .15s',background:tab===t.id?GOLD+'22':'transparent',color:tab===t.id?GOLD:'#444',borderBottom:tab===t.id?'2px solid '+GOLD:'2px solid transparent'}}
            >{t.label}</button>
          ))}
        </div>
        {tab==='login'    &&<TabLogin onLogin={login}/>}
        {tab==='ranking'  &&<TabRanking records={kv.records} loading={kv.loading}/>}
        {tab==='ao-vivo'  &&<TabAoVivo records={kv.records} countdown={kv.countdown} lastUpdate={kv.lastUpdate} load={kv.load} loading={kv.loading} error={kv.error}/>}
        {tab==='registrar'&&user  &&<TabRegistrar user={user} records={kv.records} add={kv.add} onLogout={logout}/>}
        {tab==='registrar'&&!user &&<TabLogin onLogin={login}/>}
      </div>
    </>
  );
}
