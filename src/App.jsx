import React, { useState, useEffect, useCallback } from 'react';

// ─── DADOS ───────────────────────────────────────────────────────────────────
const ASSESSORS = [
  { code:'A73614', name:'Bruno Bruel',           squad:'Alavancados',        color:'#2563eb' },
  { code:'A26347', name:'Guilherme Monticelli',  squad:'Alavancados',        color:'#2563eb' },
  { code:'A38636', name:'Hellen Carvalho',       squad:'Alavancados',        color:'#2563eb' },
  { code:'A38548', name:'Igor Bairros',          squad:'Alavancados',        color:'#2563eb' },
  { code:'A96379', name:'Leonardo Vacca',        squad:'Alavancados',        color:'#2563eb' },
  { code:'A51532', name:'Nicolas Mallmann',      squad:'Alavancados',        color:'#2563eb' },
  { code:'A26305', name:'Pedro Couto',           squad:'Alavancados',        color:'#2563eb' },
  { code:'A27267', name:'Rodrigo Lisboa',        squad:'Alavancados',        color:'#2563eb' },
  { code:'A27321', name:'Vitoria Vidor',         squad:'Alavancados',        color:'#2563eb' },
  { code:'A42881', name:'Ygor Walter',           squad:'Alavancados',        color:'#2563eb' },
  { code:'A98897', name:'Daniel Mendonca',       squad:'Los Hermanos',       color:'#92400e' },
  { code:'A73851', name:'Eduardo Freitas',       squad:'Los Hermanos',       color:'#92400e' },
  { code:'A98943', name:'Israel Gusso',          squad:'Los Hermanos',       color:'#92400e' },
  { code:'A97096', name:'Julia Mendonca',        squad:'Los Hermanos',       color:'#92400e' },
  { code:'A39869', name:'Fernando Parisotto',    squad:'Advisors',           color:'#6d28d9' },
  { code:'A20680', name:'Francisco Dall Agnol',  squad:'Advisors',           color:'#6d28d9' },
  { code:'A50655', name:'Paulo Bortolini',       squad:'Advisors',           color:'#6d28d9' },
  { code:'A1998',  name:'Icaro Piacini',         squad:'Outliers',           color:'#b45309' },
  { code:'A42105', name:'Joceane Lenhart',       squad:'Outliers',           color:'#b45309' },
  { code:'A59147', name:'Lucas Bach',            squad:'Outliers',           color:'#b45309' },
  { code:'A47707', name:'Mateus Brandao',        squad:'Outliers',           color:'#b45309' },
  { code:'A56902', name:'Daniel Mastalir',       squad:'Anywhere',           color:'#065f46' },
  { code:'A56903', name:'Leonardo Dutra',        squad:'Anywhere',           color:'#065f46' },
  { code:'A54287', name:'Bruno Giacomuzzi',      squad:'Op. Operacionais',   color:'#374151' },
  { code:'A22616', name:'Enzo Hejazi',           squad:'Op. Operacionais',   color:'#374151' },
  { code:'A61852', name:'Gabriel Berte',         squad:'Op. Operacionais',   color:'#374151' },
  { code:'A22038', name:'Jose Colling',          squad:'Op. Operacionais',   color:'#374151' },
  { code:'A20557', name:'Milena Portela',        squad:'Op. Operacionais',   color:'#374151' },
  { code:'A33788', name:'Nicolas Gotz',          squad:'Op. Operacionais',   color:'#374151' },
];

const PTS   = { R1:30, R2:50, Venda:100 };
const META  = { R1:4,  R2:4,  Venda:2  };
const TICK  = 15; // segundos entre refreshes

// ─── KV API ──────────────────────────────────────────────────────────────────
async function kvFetch() {
  const r = await fetch('/api/kv');
  if (!r.ok) throw new Error('Falha ao buscar dados');
  const d = await r.json();
  return Array.isArray(d.records) ? d.records : [];
}

async function kvAdd(user, type) {
  const r = await fetch('/api/kv', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'add',
      record: { code: user.code, name: user.name, squad: user.squad, type },
    }),
  });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Erro ao gravar'); }
  return r.json();
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function buildRanking(records) {
  const m = {};
  ASSESSORS.forEach(a => { m[a.code] = { ...a, R1:0, R2:0, Venda:0, pts:0 }; });
  records.forEach(r => {
    if (m[r.code]) { m[r.code][r.type] += 1; m[r.code].pts += (PTS[r.type] || 0); }
  });
  return Object.values(m).sort((a,b) => b.pts - a.pts || b.Venda - a.Venda || b.R2 - a.R2);
}

function premio(a) {
  if (a.R1>=4 && a.R2>=4 && a.Venda>=2) return { label:'Ouro',   val:500, hex:'#d4af37' };
  if (a.R1>=4 && a.R2>=4)               return { label:'Prata',  val:300, hex:'#9ca3af' };
  if (a.R1>=4)                           return { label:'Bronze', val:150, hex:'#b45309' };
  return null;
}

function initials(name) {
  return name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
}

function fmt(ts) {
  return new Date(ts).toLocaleString('pt-BR',{ day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit' });
}

// ─── ESTILOS BASE ─────────────────────────────────────────────────────────────
const BG   = '#05050a';
const CARD = { background:'#0f0f18', border:'1px solid #1a1a2e', borderRadius:12, padding:16 };
const GOLD = '#d4af37';

// ─── COMPONENTES SIMPLES ──────────────────────────────────────────────────────
function Av({ name, size=40, ring='#333' }) {
  const bg = ['#1d4ed8','#7c3aed','#c2410c','#065f46','#92400e','#374151'];
  const c  = bg[name.charCodeAt(0) % bg.length];
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', background:c,
      border:'2px solid '+ring, display:'flex', alignItems:'center',
      justifyContent:'center', color:'#fff', fontWeight:700,
      fontSize:size*0.35, flexShrink:0,
    }}>{initials(name)}</div>
  );
}

function Bar({ val, max, color='#d4af37' }) {
  const p = Math.min(100, max ? (val/max)*100 : 0);
  return (
    <div style={{ background:'#1f1f2e', borderRadius:4, height:6, overflow:'hidden' }}>
      <div style={{ width:p+'%', height:'100%', background:color, borderRadius:4, transition:'width .5s ease' }} />
    </div>
  );
}

function Badge({ label, color }) {
  return (
    <span style={{
      background:color+'22', border:'1px solid '+color,
      color:color, borderRadius:99, padding:'2px 10px',
      fontSize:11, fontWeight:700,
    }}>{label}</span>
  );
}

function Toast({ msg, ok }) {
  return (
    <div style={{
      position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)',
      background: ok ? '#10b981' : '#ef4444',
      color:'#fff', padding:'12px 24px', borderRadius:10,
      fontWeight:600, fontSize:14, zIndex:9999, boxShadow:'0 4px 24px #0008',
      whiteSpace:'nowrap',
    }}>{msg}</div>
  );
}

// ─── HOOK REALTIME ────────────────────────────────────────────────────────────
function useKV() {
  const [records,    setRecords]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [countdown,  setCountdown]  = useState(TICK);
  const [lastUpdate, setLastUpdate] = useState(null);

  const load = useCallback(async (quiet=false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const data = await kvFetch();
      setRecords(data);
      setLastUpdate(new Date());
      setCountdown(TICK);
    } catch(e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const id=setInterval(()=>load(true), TICK*1000); return ()=>clearInterval(id); }, [load]);
  useEffect(() => { const id=setInterval(()=>setCountdown(p=>p<=1?TICK:p-1),1000); return ()=>clearInterval(id); }, []);
  useEffect(() => {
    const fn=()=>{ if(document.visibilityState==='visible') load(true); };
    document.addEventListener('visibilitychange',fn);
    return ()=>document.removeEventListener('visibilitychange',fn);
  }, [load]);

  const add = useCallback(async (user, type) => {
    const tmp = { id:'tmp_'+Date.now(), code:user.code, name:user.name, squad:user.squad, type, ts:Date.now() };
    setRecords(p=>[...p,tmp]);
    await kvAdd(user, type);
    setTimeout(()=>load(true), 800);
  }, [load]);

  return { records, loading, error, countdown, lastUpdate, load, add };
}

// ─── TAB: LOGIN ───────────────────────────────────────────────────────────────
function TabLogin({ onLogin }) {
  const [q,setQ]     = useState('');
  const [sel,setSel] = useState(null);
  const [err,setErr] = useState('');

  const list = q.length>=2
    ? ASSESSORS.filter(a=>
        a.name.toLowerCase().includes(q.toLowerCase())||
        a.code.toLowerCase().includes(q.toLowerCase())
      ).slice(0,7)
    : [];

  const pick = a => { setSel(a); setQ(a.name); setErr(''); };
  const go   = () => { if(!sel){setErr('Selecione um nome da lista'); return;} onLogin(sel); };

  return (
    <div style={{ maxWidth:420, margin:'0 auto', padding:'40px 0' }}>
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <div style={{ fontSize:52 }}>🛡️</div>
        <h1 style={{ margin:'8px 0 4px', color:GOLD, fontSize:26, letterSpacing:2 }}>INSURANCE DAY</h1>
        <p style={{ color:'#555', fontSize:12, margin:0, letterSpacing:1 }}>CAMPANHA 4-4-2 · JUNHO & JULHO 2026</p>
      </div>

      <div style={CARD}>
        <label style={{ display:'block', color:'#777', fontSize:12, marginBottom:8, letterSpacing:1 }}>CÓDIGO XP OU NOME</label>
        <input
          autoFocus
          value={q}
          onChange={e=>{ setQ(e.target.value); setSel(null); }}
          onKeyDown={e=>e.key==='Enter'&&go()}
          placeholder="Ex: A98943 ou Israel Gusso"
          style={{
            width:'100%', padding:'12px 14px', borderRadius:8,
            border:'1px solid #1f1f2e', background:'#070710',
            color:'#e5e7eb', fontSize:14, outline:'none', boxSizing:'border-box',
          }}
        />

        {list.length>0 && (
          <div style={{ marginTop:4, borderRadius:8, border:'1px solid #1a1a2e', background:'#08080f', overflow:'hidden' }}>
            {list.map(a=>(
              <button
                key={a.code}
                onClick={()=>pick(a)}
                style={{
                  width:'100%', textAlign:'left', padding:'10px 12px',
                  border:'none', borderBottom:'1px solid #1a1a2e',
                  background:'transparent', cursor:'pointer',
                  display:'flex', alignItems:'center', gap:10,
                }}
              >
                <Av name={a.name} size={34} ring={a.color} />
                <div>
                  <div style={{ color:'#e5e7eb', fontSize:13, fontWeight:600 }}>{a.name}</div>
                  <div style={{ color:'#555', fontSize:11 }}>{a.code} · {a.squad}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {err && <div style={{ color:'#ef4444', fontSize:12, marginTop:8 }}>{err}</div>}

        <button
          onClick={go}
          style={{
            marginTop:16, width:'100%', padding:'13px',
            background:GOLD, border:'none', borderRadius:8,
            color:'#000', fontWeight:800, fontSize:15, cursor:'pointer', letterSpacing:1,
          }}
        >ENTRAR →</button>
      </div>
    </div>
  );
}

// ─── TAB: REGISTRAR ───────────────────────────────────────────────────────────
function TabRegistrar({ user, records, add, onLogout }) {
  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState(null);

  const mine  = records.filter(r=>r.code===user.code);
  const myR1  = mine.filter(r=>r.type==='R1').length;
  const myR2  = mine.filter(r=>r.type==='R2').length;
  const myV   = mine.filter(r=>r.type==='Venda').length;
  const myPts = myR1*30 + myR2*50 + myV*100;
  const pr    = premio({ R1:myR1, R2:myR2, Venda:myV });

  const showToast = (msg, ok) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3000); };

  const reg = async type => {
    setSaving(true);
    try {
      await add(user, type);
      showToast('✅ '+type+' registrado!', true);
    } catch(e) {
      showToast('❌ '+e.message, false);
    } finally {
      setSaving(false);
    }
  };

  const BTNS = [
    { type:'R1',    label:'R1',    sub:'Reunião Agendada',  pts:30,  color:'#3b82f6' },
    { type:'R2',    label:'R2',    sub:'Reunião Realizada', pts:50,  color:'#eab308' },
    { type:'Venda', label:'VENDA', sub:'Fechamento',        pts:100, color:'#10b981' },
  ];

  return (
    <div style={{ maxWidth:500, margin:'0 auto', padding:'24px 0' }}>
      {toast && <Toast msg={toast.msg} ok={toast.ok} />}

      <div style={{ ...CARD, marginBottom:16, display:'flex', alignItems:'center', gap:14, justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Av name={user.name} size={46} ring={user.color} />
          <div>
            <div style={{ color:'#e5e7eb', fontWeight:700, fontSize:16 }}>{user.name}</div>
            <div style={{ color:'#555', fontSize:12 }}>{user.squad} · {user.code}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ background:'#ef444420', border:'1px solid #ef444440', color:'#ef4444', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:600 }}>Sair</button>
      </div>

      <div style={{ ...CARD, marginBottom:16, textAlign:'center' }}>
        <div style={{ color:'#555', fontSize:12, letterSpacing:1, marginBottom:4 }}>SEUS PONTOS</div>
        <div style={{ color:GOLD, fontSize:48, fontWeight:800, lineHeight:1 }}>{myPts}</div>
        {pr && (
          <div style={{ marginTop:10 }}>
            <Badge label={pr.label+' · R$ '+pr.val} color={pr.hex} />
          </div>
        )}
      </div>

      <div style={{ ...CARD, marginBottom:16 }}>
        <div style={{ color:'#555', fontSize:12, letterSpacing:1, marginBottom:14 }}>PROGRESSO 4-4-2</div>
        {[{type:'R1',val:myR1,max:4,color:'#3b82f6'},{type:'R2',val:myR2,max:4,color:'#eab308'},{type:'Venda',val:myV,max:2,color:'#10b981'}].map(m=>(
          <div key={m.type} style={{ marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ color:'#aaa', fontSize:13 }}>{m.type}</span>
              <span style={{ color:m.color, fontWeight:700, fontSize:13 }}>{m.val} / {m.max}</span>
            </div>
            <Bar val={m.val} max={m.max} color={m.color} />
          </div>
        ))}
      </div>

      <div style={{ color:'#555', fontSize:12, letterSpacing:1, textAlign:'center', marginBottom:12 }}>REGISTRAR</div>
      <div style={{ display:'flex', gap:12, marginBottom:16 }}>
        {BTNS.map(b=>(
          <button
            key={b.type}
            disabled={saving}
            onClick={()=>reg(b.type)}
            style={{
              flex:1, padding:'18px 8px', borderRadius:12,
              background:b.color+'18', border:'2px solid '+b.color,
              color:'#fff', cursor:saving?'default':'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:6,
              opacity:saving?0.5:1, transition:'opacity .2s',
            }}
          >
            <span style={{ fontSize:22 }}>{saving?'⏳':b.type==='R1'?'📅':b.type==='R2'?'✅':'💰'}</span>
            <span style={{ fontWeight:800, fontSize:16, color:b.color }}>{b.label}</span>
            <span style={{ fontSize:11, color:'#555' }}>{b.sub}</span>
            <span style={{ fontSize:12, fontWeight:700, color:b.color }}>+{b.pts} pts</span>
          </button>
        ))}
      </div>

      {mine.length>0 && (
        <div style={CARD}>
          <div style={{ color:'#555', fontSize:12, letterSpacing:1, marginBottom:12 }}>SEUS REGISTROS</div>
          {[...mine].sort((a,b)=>b.ts-a.ts).slice(0,8).map((r,i)=>{
            const b = BTNS.find(x=>x.type===r.type);
            return (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid #1a1a2e', alignItems:'center' }}>
                <span style={{ color:b?b.color:'#aaa', fontSize:13 }}>{r.type}</span>
                <span style={{ color:'#444', fontSize:11 }}>{fmt(r.ts)}</span>
                <span style={{ color:GOLD, fontWeight:700, fontSize:12 }}>+{PTS[r.type]} pts</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TAB: RANKING ─────────────────────────────────────────────────────────────
function TabRanking({ records }) {
  const rank = buildRanking(records);

  const MEDAL = ['🥇','🥈','🥉'];

  return (
    <div style={{ maxWidth:640, margin:'0 auto', padding:'24px 0' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:20 }}>
        {[
          { label:'PONTOS',  val:rank.reduce((s,a)=>s+a.pts,0),   color:GOLD },
          { label:'R1',      val:rank.reduce((s,a)=>s+a.R1,0),    color:'#3b82f6' },
          { label:'R2',      val:rank.reduce((s,a)=>s+a.R2,0),    color:'#eab308' },
          { label:'VENDAS',  val:rank.reduce((s,a)=>s+a.Venda,0), color:'#10b981' },
        ].map(m=>(
          <div key={m.label} style={{ ...CARD, textAlign:'center', padding:'12px 8px' }}>
            <div style={{ color:'#444', fontSize:10, letterSpacing:1 }}>{m.label}</div>
            <div style={{ color:m.color, fontSize:28, fontWeight:800, lineHeight:1.2 }}>{m.val}</div>
          </div>
        ))}
      </div>

      {rank.map((a,i)=>{
        const pr = premio(a);
        return (
          <div
            key={a.code}
            style={{
              ...CARD,
              marginBottom:8,
              display:'flex',
              alignItems:'center',
              gap:12,
              border: i<3 ? '1px solid '+(i===0?GOLD:i===1?'#9ca3af':'#b45309')+'55' : '1px solid #1a1a2e',
            }}
          >
            <div style={{ minWidth:32, textAlign:'center', fontSize:i<3?20:14, color:i<3?GOLD:'#333', fontWeight:700 }}>
              {i<3 ? MEDAL[i] : (i+1)+'º'}
            </div>
            <Av name={a.name} size={40} ring={a.color} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ color:'#e5e7eb', fontWeight:600, fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.name}</div>
              <div style={{ color:'#555', fontSize:11 }}>{a.squad}</div>
              <div style={{ display:'flex', gap:10, marginTop:4, fontSize:11 }}>
                <span style={{ color:'#3b82f6' }}>R1·{a.R1}/{META.R1}</span>
                <span style={{ color:'#eab308' }}>R2·{a.R2}/{META.R2}</span>
                <span style={{ color:'#10b981' }}>V·{a.Venda}/{META.Venda}</span>
              </div>
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ color:GOLD, fontWeight:800, fontSize:20 }}>{a.pts}</div>
              <div style={{ color:'#333', fontSize:10 }}>pts</div>
              {pr && <div style={{ marginTop:4 }}><Badge label={pr.label} color={pr.hex} /></div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── TAB: AO VIVO ─────────────────────────────────────────────────────────────
function TabAoVivo({ records, countdown, lastUpdate, load, loading, error }) {
  const recent = [...records].sort((a,b)=>b.ts-a.ts).slice(0,30);
  const updStr = lastUpdate
    ? lastUpdate.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'})
    : '--';

  return (
    <div style={{ maxWidth:580, margin:'0 auto', padding:'24px 0' }}>
      <div style={{ ...CARD, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'livePulse 1.2s ease-in-out infinite' }} />
            <span style={{ color:'#10b981', fontWeight:700, fontSize:13, letterSpacing:1 }}>AO VIVO · VERCEL KV</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ color:'#555', fontSize:12 }}>Atualizado às {updStr}</span>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <div style={{ width:60, height:4, background:'#1f1f2e', borderRadius:4, overflow:'hidden' }}>
                <div style={{ width:((TICK-countdown)/TICK*100)+'%', height:'100%', background:GOLD, borderRadius:4, transition:'width 1s linear' }} />
              </div>
              <span style={{ color:GOLD, fontSize:12, fontWeight:700, minWidth:20 }}>{countdown}s</span>
            </div>
            <button
              onClick={()=>load(false)}
              disabled={loading}
              style={{ background:'#1f1f2e', border:'1px solid #2a2a3e', color:loading?'#333':'#888', borderRadius:8, padding:'5px 12px', cursor:loading?'default':'pointer', fontSize:13 }}
            >{loading?'⏳':'↻'}</button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ ...CARD, background:'#ef444410', border:'1px solid #ef444440', color:'#ef4444', fontSize:13, marginBottom:16 }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ color:'#555', fontSize:12, letterSpacing:1, marginBottom:12 }}>ÚLTIMOS REGISTROS</div>

      {recent.length===0 && !loading && (
        <div style={{ ...CARD, textAlign:'center', color:'#444', padding:40 }}>Nenhum registro ainda</div>
      )}

      {recent.map((r,i)=>{
        const a = ASSESSORS.find(x=>x.code===r.code);
        const typeColor = r.type==='R1'?'#3b82f6':r.type==='R2'?'#eab308':'#10b981';
        return (
          <div key={r.id||i} style={{ ...CARD, marginBottom:8, display:'flex', alignItems:'center', gap:12 }}>
            <Av name={r.name||'?'} size={36} ring={a?a.color:'#333'} />
            <div style={{ flex:1 }}>
              <div style={{ color:'#e5e7eb', fontWeight:600, fontSize:14 }}>{r.name}</div>
              <div style={{ color:'#555', fontSize:11 }}>{r.squad} · {fmt(r.ts)}</div>
            </div>
            <Badge label={r.type} color={typeColor} />
            <div style={{ color:GOLD, fontWeight:800, fontSize:15, minWidth:50, textAlign:'right' }}>+{PTS[r.type]||0} pts</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,  setTab]  = useState('ranking');
  const [user, setUser] = useState(null);
  const kv = useKV();

  const TABS = [
    { id:'ranking',   label:'🏆 Ranking'   },
    { id:'ao-vivo',   label:'🔴 Ao Vivo'   },
    { id:'registrar', label:'➕ Registrar' },
  ];

  const login  = a  => { setUser(a); setTab('registrar'); };
  const logout = () => { setUser(null); setTab('ranking'); };

  return (
    <>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:${BG}; color:#e5e7eb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
        button { font-family:inherit; }
        input  { font-family:inherit; }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.8)} }
      `}</style>

      <div style={{ padding:'0 16px', maxWidth:700, margin:'0 auto' }}>

        <div style={{ padding:'16px 0 0', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid #1a1a2e' }}>
          <span style={{ color:GOLD, fontWeight:800, fontSize:18, letterSpacing:2 }}>🛡️ INSURANCE DAY</span>
          {user && (
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Av name={user.name} size={28} ring={user.color} />
              <span style={{ color:'#888', fontSize:13 }}>{user.name.split(' ')[0]}</span>
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:4, padding:'8px 0', borderBottom:'1px solid #1a1a2e', marginBottom:4 }}>
          {TABS.map(t=>(
            <button
              key={t.id}
              onClick={()=>{
                if(t.id==='registrar' && !user) { setTab('login'); return; }
                setTab(t.id);
              }}
              style={{
                padding:'8px 16px', borderRadius:8, border:'none', cursor:'pointer',
                fontWeight:600, fontSize:13, transition:'all .15s',
                background: tab===t.id ? GOLD+'22' : 'transparent',
                color:       tab===t.id ? GOLD      : '#555',
                borderBottom: tab===t.id ? '2px solid '+GOLD : '2px solid transparent',
              }}
            >{t.label}</button>
          ))}
        </div>

        {tab==='login'    && <TabLogin onLogin={login} />}
        {tab==='ranking'  && <TabRanking records={kv.records} />}
        {tab==='ao-vivo'  && <TabAoVivo records={kv.records} countdown={kv.countdown} lastUpdate={kv.lastUpdate} load={kv.load} loading={kv.loading} error={kv.error} />}
        {tab==='registrar'&& user && <TabRegistrar user={user} records={kv.records} add={kv.add} onLogout={logout} />}
        {tab==='registrar'&& !user && <TabLogin onLogin={login} />}
      </div>
    </>
  );
}
