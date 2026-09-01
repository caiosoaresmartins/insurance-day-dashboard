import React,{useCallback,useEffect,useMemo,useState} from 'react';
import {SEPTEMBER_CAMPAIGN as CAMPAIGN} from './campaignConfig.js';

const EVENT_META={
  R1:{label:'REUNIÃO AGENDADA',short:'AGENDADA',goal:3,reward:'R$ 100',icon:'⚡',color:'#4f8cff',action:'add_agendada'},
  R2:{label:'REUNIÃO REALIZADA',short:'REALIZADA',goal:1,reward:'R$ 200',icon:'◆',color:'#d4af37',action:'add_realizada'},
  Venda:{label:'VENDA',short:'VENDA',goal:1,reward:'50% DE COMISSÃO',icon:'♛',color:'#16c784',action:'add_venda'},
};
const SESSION_KEY='mesSeguroSessionV1';
const TICK=15;

function initials(name=''){return name.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'EU';}
function fmt(ts){try{return new Date(ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});}catch{return''}}
function csvCell(v){const s=String(v??'');return `"${s.replaceAll('"','""')}"`;}

function useSession(){
  const[state,setState]=useState(()=>{try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null')}catch{return null}});
  const save=s=>{setState(s);if(s)sessionStorage.setItem(SESSION_KEY,JSON.stringify(s));else sessionStorage.removeItem(SESSION_KEY)};
  return[state,save];
}

async function loginRequest(body){
  const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Falha no login');return d;
}

function useCampaignData(session){
  const[records,setRecords]=useState([]);const[loading,setLoading]=useState(false);const[error,setError]=useState('');const[countdown,setCountdown]=useState(TICK);
  const load=useCallback(async()=>{
    if(!session?.token){setRecords([]);return;}
    setLoading(true);
    try{
      const query=session.user.role==='admin'?'/api/kv?scope=all&audit=1':'/api/kv?scope=all';
      const r=await fetch(query,{cache:'no-store',headers:{Authorization:`Bearer ${session.token}`}});const d=await r.json().catch(()=>({}));
      if(r.status===401)throw new Error('Sessão expirada. Entre novamente.');if(!r.ok)throw new Error(d.error||'Falha ao buscar histórico');
      setRecords(Array.isArray(d.records)?d.records:[]);setError('');setCountdown(TICK);
    }catch(e){setError(e.message||'Falha ao atualizar');}finally{setLoading(false)}
  },[session]);
  useEffect(()=>{load();if(!session?.token)return;const id=setInterval(load,TICK*1000);return()=>clearInterval(id)},[load,session]);
  useEffect(()=>{const id=setInterval(()=>setCountdown(v=>v<=1?TICK:v-1),1000);return()=>clearInterval(id)},[]);
  const api=useCallback(async body=>{const r=await fetch('/api/kv',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.token}`},body:JSON.stringify(body)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Operação não concluída');await load();return d},[session,load]);
  return{records,loading,error,countdown,load,api};
}

function ProgressCard({type,value}){const m=EVENT_META[type];const pct=Math.min(100,(value/m.goal)*100);const done=value>=m.goal;return <article className={`mseg-progress-card ${done?'done':''}`}><div className="mseg-progress-top"><span className="mseg-progress-icon" style={{color:m.color}}>{m.icon}</span><div><small>{m.label}</small><strong>{m.reward}</strong></div><b style={{color:done?m.color:'#7a7a7a'}}>{Math.min(value,m.goal)}/{m.goal}</b></div><div className="mseg-track"><span style={{width:`${pct}%`,background:m.color}}/></div><p>{done?'PRÊMIO DESBLOQUEADO':type==='R1'?`Faltam ${Math.max(0,m.goal-value)} agendamento(s)`:'Faça o registro para desbloquear'}</p></article>}

function AccessGate({onLogin}){
  const[mode,setMode]=useState('advisor');const[code,setCode]=useState('');const[secret,setSecret]=useState('');const[busy,setBusy]=useState(false);const[error,setError]=useState('');
  async function submit(e){e.preventDefault();setBusy(true);setError('');try{const d=await loginRequest(mode==='admin'?{mode:'admin',secret}:{mode:'advisor',code:code.trim().toUpperCase()});onLogin({token:d.token,user:d.user});}catch(err){setError(err.message)}finally{setBusy(false)}}
  return <main className="mseg-access-shell"><section className="mseg-access-card"><span className="mseg-kicker">SETEMBRO · MÊS DO SEGURO</span><h1>Acesse sua campanha</h1><p>Cada assessor visualiza apenas a própria produção e o próprio histórico.</p><div className="mseg-access-tabs"><button type="button" className={mode==='advisor'?'active':''} onClick={()=>setMode('advisor')}>ASSESSOR</button><button type="button" className={mode==='admin'?'active':''} onClick={()=>setMode('admin')}>AUDITOR</button></div><form onSubmit={submit}>{mode==='advisor'?<><label>CÓDIGO XP</label><input autoFocus value={code} onChange={e=>setCode(e.target.value)} placeholder="Ex.: A26305" autoComplete="off"/><small>Digite somente o seu código de assessor.</small></>:<><label>PIN DO AUDITOR</label><input type="password" inputMode="numeric" value={secret} onChange={e=>setSecret(e.target.value)} placeholder="6 dígitos" autoComplete="current-password"/><small>Acesso exclusivo para conferência e ajustes da campanha.</small></>}{error&&<div className="mseg-error">{error}</div>}<button className="mseg-access-submit" disabled={busy||(!code&&mode==='advisor')||(!secret&&mode==='admin')}>{busy?'VALIDANDO...':mode==='admin'?'ENTRAR NA AUDITORIA →':'ACESSAR MEU HISTÓRICO →'}</button></form></section></main>
}

function ActionButton({type,saving,onAdd}){
  const m=EVENT_META[type];
  return <button type="button" className="mseg-action" style={{'--accent':m.color}} disabled={!!saving} onClick={()=>onAdd(type)}><span>{m.icon}</span><b>{m.short}</b><small>{m.label}</small><em>{m.reward}</em>{saving===type&&<i>SALVANDO {m.short}...</i>}</button>;
}

function AdvisorView({session,records,api,onLogout,countdown}){
  const user=session.user;const active=records.filter(r=>r.status!=='deleted');const counts={R1:active.filter(r=>r.type==='R1').length,R2:active.filter(r=>r.type==='R2').length,Venda:active.filter(r=>r.type==='Venda').length};const[saving,setSaving]=useState('');const[msg,setMsg]=useState('');
  async function add(type){
    const m=EVENT_META[type];if(!m)return;
    setSaving(type);setMsg('');
    try{
      const d=await api({action:m.action});
      if(d?.record?.type!==type)throw new Error(`O servidor devolveu ${d?.record?.type||'tipo inválido'} em vez de ${type}. Registro não confirmado.`);
      setMsg(`${m.label} registrada e salva no histórico.`);
    }catch(e){setMsg(e.message)}finally{setSaving('');setTimeout(()=>setMsg(''),3500)}
  }
  return <div className="mseg-advisor-wrap"><section className="mseg-user-card"><div className="mseg-avatar">{initials(user.name)}</div><div className="mseg-user-copy"><small>ASSESSOR AUTENTICADO</small><h2>{user.name}</h2><p>{user.squad} · {user.code}</p></div><div className="mseg-user-actions"><span>ATUALIZA EM {countdown}s</span><button className="mseg-ghost" onClick={onLogout}>SAIR</button></div></section><section className="mseg-section"><div className="mseg-section-title"><div><span className="mseg-kicker">SEU PROGRESSO</span><h3>Mês do Seguro</h3></div><span className="mseg-live">● HISTÓRICO SALVO</span></div><div className="mseg-progress-grid"><ProgressCard type="R1" value={counts.R1}/><ProgressCard type="R2" value={counts.R2}/><ProgressCard type="Venda" value={counts.Venda}/></div></section><section className="mseg-section"><div className="mseg-section-title"><div><span className="mseg-kicker">REGISTRAR PRODUÇÃO</span><h3>Seu lançamento entra no histórico imediatamente</h3></div></div><div className="mseg-action-grid"><ActionButton type="R1" saving={saving} onAdd={add}/><ActionButton type="R2" saving={saving} onAdd={add}/><ActionButton type="Venda" saving={saving} onAdd={add}/></div>{msg&&<div className="mseg-toast">{msg}</div>}</section><section className="mseg-section"><div className="mseg-section-title"><div><span className="mseg-kicker">HISTÓRICO DA CAMPANHA</span><h3>Todos os seus registros</h3><p>Os dados permanecem disponíveis para o fechamento e auditoria.</p></div></div>{active.length?<div className="mseg-history-table"><header><span>DATA</span><span>REGISTRO</span><span>BENEFÍCIO</span><span>ORIGEM</span></header>{[...active].reverse().map(r=>{const m=EVENT_META[r.type]||EVENT_META.R1;return <div key={r.id}><span>{fmt(r.ts)}</span><b style={{color:m.color}}>{m.icon} {m.label}</b><strong>{m.reward}</strong><small>{r.source==='auditor'?'AUDITOR':'VOCÊ'}</small></div>})}</div>:<div className="mseg-empty">Você ainda não possui registros nesta campanha.</div>}</section></div>
}

function AuditorView({session,records,api,onLogout,countdown}){
  const[code,setCode]=useState('');const[type,setType]=useState('R1');const[reason,setReason]=useState('Ajuste de auditoria');const[msg,setMsg]=useState('');const[filter,setFilter]=useState('');
  const active=records.filter(r=>r.status!=='deleted');const filtered=records.filter(r=>!filter||String(r.code).toUpperCase().includes(filter.toUpperCase())||String(r.name).toLowerCase().includes(filter.toLowerCase()));
  const totals={R1:active.filter(r=>r.type==='R1').length,R2:active.filter(r=>r.type==='R2').length,Venda:active.filter(r=>r.type==='Venda').length};
  async function add(){setMsg('');try{const m=EVENT_META[type];const d=await api({action:m.action,record:{code:code.trim().toUpperCase()}});if(d?.record?.type!==type)throw new Error('Tipo devolvido pelo servidor não corresponde ao selecionado.');setMsg(`${m.label} incluída pelo auditor e salva no ledger.`);}catch(e){setMsg(e.message)}}
  async function remove(id){if(!window.confirm('Excluir este registro da contabilização? A evidência continuará no histórico de auditoria.'))return;try{await api({action:'delete',recordId:id,reason});setMsg('Registro excluído da contabilização, com trilha de auditoria preservada.');}catch(e){setMsg(e.message)}}
  function exportCsv(){const rows=[['ID','Código','Assessor','Squad','Tipo','Data','Status','Origem','Criado por','Excluído em','Motivo']];records.forEach(r=>rows.push([r.id,r.code,r.name,r.squad,r.type,new Date(r.ts).toISOString(),r.status,r.source||'legado',r.createdBy||'',r.deletedAt?new Date(r.deletedAt).toISOString():'',r.deleteReason||'']));const csv='\ufeff'+rows.map(row=>row.map(csvCell).join(';')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`mes-do-seguro-auditoria-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(url)}
  return <div className="mseg-advisor-wrap"><section className="mseg-user-card"><div className="mseg-avatar auditor">AU</div><div className="mseg-user-copy"><small>PAINEL PRIVADO</small><h2>Auditoria da campanha</h2><p>Mês do Seguro · histórico completo e rastreável</p></div><div className="mseg-user-actions"><span>ATUALIZA EM {countdown}s</span><button className="mseg-ghost" onClick={onLogout}>SAIR</button></div></section><section className="mseg-kpis"><article><small>AGENDADAS VÁLIDAS</small><strong>{totals.R1}</strong><span>registros ativos</span></article><article><small>REALIZADAS VÁLIDAS</small><strong>{totals.R2}</strong><span>registros ativos</span></article><article><small>VENDAS VÁLIDAS</small><strong>{totals.Venda}</strong><span>registros ativos</span></article><article><small>LEDGER</small><strong>{records.length}</strong><span>inclui excluídos auditáveis</span></article></section><section className="mseg-section"><div className="mseg-section-title"><div><span className="mseg-kicker">AJUSTE MANUAL</span><h3>Adicionar registro</h3></div><button className="mseg-link" onClick={exportCsv}>EXPORTAR CSV ↓</button></div><div className="mseg-admin-form"><input value={code} onChange={e=>setCode(e.target.value)} placeholder="Código XP (ex.: A26305)"/><select value={type} onChange={e=>setType(e.target.value)}>{Object.entries(EVENT_META).map(([k,m])=><option key={k} value={k}>{m.label}</option>)}</select><button onClick={add} disabled={!code}>ADICIONAR REGISTRO</button></div>{msg&&<div className="mseg-toast">{msg}</div>}</section><section className="mseg-section"><div className="mseg-section-title"><div><span className="mseg-kicker">LEDGER DE AUDITORIA</span><h3>Histórico completo</h3><p>Excluir retira da contabilização, mas não apaga a evidência.</p></div></div><div className="mseg-audit-tools"><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filtrar por código ou nome"/><input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Motivo padrão da exclusão"/></div><div className="mseg-audit-table"><header><span>DATA</span><span>ASSESSOR</span><span>TIPO</span><span>STATUS</span><span>ORIGEM</span><span>AÇÃO</span></header>{[...filtered].reverse().map(r=>{const m=EVENT_META[r.type]||EVENT_META.R1;return <div key={r.id} className={r.status==='deleted'?'deleted':''}><span>{fmt(r.ts)}</span><span><b>{r.name}</b><small>{r.code} · {r.squad}</small></span><strong style={{color:m.color}}>{m.label}</strong><span>{r.status==='deleted'?<em>EXCLUÍDO</em>:<b>ATIVO</b>}</span><small>{r.source==='auditor'?'AUDITOR':r.source==='assessor'?'ASSESSOR':'LEGADO'}</small><span>{r.status==='deleted'?<small>{r.deleteReason||'Ajuste de auditoria'}</small>:<button onClick={()=>remove(r.id)}>EXCLUIR</button>}</span></div>})}</div></section></div>
}

export default function CampaignDashboard(){
  const[session,setSession]=useSession();const{records,loading,error,countdown,api}=useCampaignData(session);
  if(!session)return <div className="mseg-app"><div className="mseg-bg"/><AccessGate onLogin={setSession}/></div>;
  return <div className="mseg-app"><div className="mseg-bg"/><header className="mseg-header"><div className="mseg-brand"><span className="mseg-brand-mark">E</span><div><b>EUROSTOCK</b><small>MÊS DO SEGURO · SETEMBRO 2026</small></div></div><div className="mseg-private-badge">🔒 {session.user.role==='admin'?'AUDITORIA':'ACESSO INDIVIDUAL'}</div></header><main className="mseg-main">{error&&<div className="mseg-error">{error}</div>}{session.user.role==='admin'?<AuditorView session={session} records={records} api={api} onLogout={()=>setSession(null)} countdown={countdown}/>:<AdvisorView session={session} records={records} api={api} onLogout={()=>setSession(null)} countdown={countdown}/>} {loading&&<div className="mseg-loading">SINCRONIZANDO HISTÓRICO...</div>}</main></div>;
}
