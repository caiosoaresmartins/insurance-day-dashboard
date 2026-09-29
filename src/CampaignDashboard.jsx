import React,{useCallback,useEffect,useMemo,useState} from 'react';

const EVENT_META={
  R1:{label:'REUNIÕES AGENDADAS',short:'AGENDADAS',goal:3,reward:'R$ 100',icon:'⚡',color:'#4f8cff',action:'add_agendada'},
  R2:{label:'REUNIÕES REALIZADAS',short:'REALIZADAS',goal:1,reward:'R$ 200',icon:'◆',color:'#d4af37',action:'add_realizada'},
  Venda:{label:'VENDAS',short:'VENDAS',goal:1,reward:'COMISSÃO',icon:'♛',color:'#16c784',action:'add_venda'},
};
const SESSION_KEY='mesSeguroSessionV1';
const TICK=15;
const DAY_FORMATTER=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'});

function initials(name=''){return name.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'EU';}
function fmt(ts){try{return new Date(ts).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});}catch{return''}}
function fmtDay(ts){try{return new Date(ts).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});}catch{return''}}
function csvCell(v){const s=String(v??'');return '"' + s.replaceAll('"','""') + '"';}
function dayKey(ts){const p=DAY_FORMATTER.formatToParts(new Date(ts));const get=t=>(p.find(x=>x.type===t)||{}).value||'';return get('year')+'-'+get('month')+'-'+get('day');}
function dateFromKey(key){const parts=key.split('-').map(Number);return new Date(parts[0],parts[1]-1,parts[2]);}
function addDays(date,amount){const next=new Date(date);next.setDate(next.getDate()+amount);return next;}
function percent(value,total){return total?Math.round((value/total)*100):0;}
function deltaLabel(value){if(!Number.isFinite(value)||value===0)return 'estável';return (value>0?'+':'')+value+'% vs. período anterior';}

function useSession(){
  const[state,setState]=useState(()=>{try{return JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null')}catch{return null}});
  const save=s=>{setState(s);if(s)sessionStorage.setItem(SESSION_KEY,JSON.stringify(s));else sessionStorage.removeItem(SESSION_KEY)};
  return[state,save];
}

async function loginRequest(body){
  const r=await fetch('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(d.error||'Falha no login');
  return d;
}

function authHeaders(session,extra={}){
  const headers={Authorization:'Bearer '+session.token,...extra};
  if(session.user.role==='admin'&&session.auditorPin)headers['X-Auditor-Pin']=session.auditorPin;
  return headers;
}

function useCampaignData(session){
  const[records,setRecords]=useState([]);const[loading,setLoading]=useState(false);const[error,setError]=useState('');const[countdown,setCountdown]=useState(TICK);
  const load=useCallback(async()=>{
    if(!session?.token){setRecords([]);return;}
    setLoading(true);
    try{
      const query=session.user.role==='admin'?'/api/kv?scope=all&audit=1':'/api/kv?scope=all';
      const r=await fetch(query,{cache:'no-store',headers:authHeaders(session)});
      const d=await r.json().catch(()=>({}));
      if(r.status===401)throw new Error(d.error||'Sessão expirada. Entre novamente.');
      if(!r.ok)throw new Error(d.error||'Falha ao buscar histórico');
      setRecords(Array.isArray(d.records)?d.records:[]);setError('');setCountdown(TICK);
    }catch(e){setError(e.message||'Falha ao atualizar');}finally{setLoading(false)}
  },[session]);
  useEffect(()=>{load();if(!session?.token)return;const id=setInterval(load,TICK*1000);return()=>clearInterval(id)},[load,session]);
  useEffect(()=>{const id=setInterval(()=>setCountdown(v=>v<=1?TICK:v-1),1000);return()=>clearInterval(id)},[]);
  const api=useCallback(async body=>{
    const r=await fetch('/api/kv',{method:'POST',headers:authHeaders(session,{'Content-Type':'application/json'}),body:JSON.stringify(body)});
    const d=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(d.error||'Operação não concluída');
    await load();return d;
  },[session,load]);
  return{records,loading,error,countdown,api};
}

function useRoster(session){
  const[roster,setRoster]=useState([]);
  useEffect(()=>{
    if(session?.user.role!=='admin'){setRoster([]);return;}
    fetch('/api/assessors',{cache:'no-store'}).then(r=>r.json()).then(d=>setRoster(Array.isArray(d.assessors)?d.assessors:[])).catch(()=>setRoster([]));
  },[session]);
  return roster;
}

function ProgressCard({type,value}){
  const m=EVENT_META[type];const pct=Math.min(100,(value/m.goal)*100);const done=value>=m.goal;
  return <article className={'mseg-progress-card '+(done?'done':'')}><div className="mseg-progress-top"><span className="mseg-progress-icon" style={{color:m.color}}>{m.icon}</span><div><small>{m.label}</small><strong>{m.reward}</strong></div><b style={{color:done?m.color:'#7a7a7a'}}>{Math.min(value,m.goal)}/{m.goal}</b></div><div className="mseg-track"><span style={{width:pct+'%',background:m.color}}/></div><p>{done?'PRÊMIO DESBLOQUEADO':type==='R1'?'Faltam '+Math.max(0,m.goal-value)+' agendamento(s)':'Faça o registro para desbloquear'}</p></article>;
}

function AccessGate({onLogin}){
  const[mode,setMode]=useState('advisor');const[code,setCode]=useState('');const[secret,setSecret]=useState('');const[busy,setBusy]=useState(false);const[error,setError]=useState('');
  async function submit(e){
    e.preventDefault();setBusy(true);setError('');
    try{
      const isAdmin=mode==='admin';
      const d=await loginRequest(isAdmin?{mode:'admin',secret}:{mode:'advisor',code:code.trim().toUpperCase()});
      onLogin({token:d.token,user:d.user,...(isAdmin?{auditorPin:secret}:{})});
    }catch(err){setError(err.message)}finally{setBusy(false)}
  }
  return <main className="mseg-access-shell"><section className="mseg-access-card"><span className="mseg-kicker">EUROSTOCK · GESTÃO COMERCIAL</span><h1>Campanha em uma visão</h1><p>Assessores registram sua produção. Gestores acompanham o time, a evolução e os efeitos no resultado.</p><div className="mseg-access-tabs"><button type="button" className={mode==='advisor'?'active':''} onClick={()=>setMode('advisor')}>ASSESSOR</button><button type="button" className={mode==='admin'?'active':''} onClick={()=>setMode('admin')}>GESTOR</button></div><form onSubmit={submit}>{mode==='advisor'?<><label>CÓDIGO XP</label><input autoFocus value={code} onChange={e=>setCode(e.target.value)} placeholder="Ex.: A26305" autoComplete="off"/><small>Digite somente o seu código de assessor.</small></>:<><label>PIN DO GESTOR</label><input type="password" inputMode="numeric" value={secret} onChange={e=>setSecret(e.target.value.replace(/\D/g,'').slice(0,12))} placeholder="Digite seu PIN" autoComplete="current-password"/><small>Acesso reservado para gestão, métricas e auditoria.</small></>}{error&&<div className="mseg-error">{error}</div>}<button className="mseg-access-submit" disabled={busy||(!code&&mode==='advisor')||(!secret&&mode==='admin')}>{busy?'VALIDANDO...':mode==='admin'?'ENTRAR NO PAINEL →':'ACESSAR MEU HISTÓRICO →'}</button></form></section></main>;
}

function MetricCard({label,value,detail,accent,icon,delta}){
  return <article className="insight-kpi" style={{'--accent':accent}}><div className="insight-kpi-top"><span>{icon}</span><small>{label}</small>{delta!==undefined&&<b>{delta}</b>}</div><strong>{value}</strong><p>{detail}</p></article>;
}

function TrendChart({series}){
  const max=Math.max.apply(null,series.map(x=>x.total).concat([1]));const width=760;const height=230;const padX=28;const padY=24;const innerW=width-padX*2;const innerH=height-padY*2;
  const points=series.map((item,index)=>{const x=padX+(series.length===1?innerW/2:index*innerW/(series.length-1));const y=height-padY-(item.total/max)*innerH;return {x,y,item};});
  const line=points.map(p=>p.x+','+p.y).join(' ');
  const area=line+' '+(width-padX)+','+(height-padY)+' '+padX+','+(height-padY);
  return <div className="insight-chart-wrap"><svg className="insight-trend-chart" viewBox={'0 0 '+width+' '+height} role="img" aria-label="Evolução diária de registros"><defs><linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#d4af37" stopOpacity=".34"/><stop offset="100%" stopColor="#d4af37" stopOpacity="0"/></linearGradient><linearGradient id="trendStroke" x1="0" x2="1"><stop offset="0%" stopColor="#4f8cff"/><stop offset="55%" stopColor="#d4af37"/><stop offset="100%" stopColor="#16c784"/></linearGradient></defs><line x1={padX} x2={width-padX} y1={height-padY} y2={height-padY} className="chart-axis"/><polygon points={area} fill="url(#trendFill)"/><polyline points={line} fill="none" stroke="url(#trendStroke)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>{points.map((p,i)=><g key={p.item.key}><circle cx={p.x} cy={p.y} r="5" className="chart-dot"/><text x={p.x} y={height-7} textAnchor="middle" className="chart-label">{p.item.label}</text>{(i===0||i===points.length-1||p.item.total===max)&&<text x={p.x} y={Math.max(15,p.y-12)} textAnchor="middle" className="chart-value">{p.item.total}</text>}</g>)}</svg></div>;
}

function Funnel({totals}){
  const max=Math.max(totals.R1,1);
  return <div className="insight-funnel">{Object.entries(EVENT_META).map(([type,m],index)=>{const value=totals[type];const width=Math.max(18,Math.round(value/max*100));return <div className="funnel-row" key={type}><div><span style={{color:m.color}}>{m.icon}</span><b>{m.short}</b><small>{index===0?'entrada':index===1?'avanço':'resultado'}</small></div><strong>{value}</strong><i style={{width:width+'%',background:m.color}}/></div>})}</div>;
}

function buildLeaderboard(records){
  const map={};
  records.forEach(r=>{if(!r?.code)return;const item=map[r.code]||{code:r.code,name:r.name||r.code,squad:r.squad||'',R1:0,R2:0,Venda:0,total:0};if(item[r.type]!==undefined)item[r.type]+=1;item.total+=1;map[r.code]=item;});
  return Object.values(map).sort((a,b)=>b.Venda-a.Venda||b.R2-a.R2||b.R1-a.R1||a.name.localeCompare(b.name));
}

function ManagerView({session,records,roster,api,onLogout,countdown}){
  const[code,setCode]=useState('');const[type,setType]=useState('R1');const[reason,setReason]=useState('Ajuste de auditoria');const[msg,setMsg]=useState('');const[filter,setFilter]=useState('');
  const active=records.filter(r=>r.status!=='deleted');const leaderboard=useMemo(()=>buildLeaderboard(active),[active]);
  const rosterCount=roster.length||leaderboard.length;const totals=useMemo(()=>({R1:active.filter(r=>r.type==='R1').length,R2:active.filter(r=>r.type==='R2').length,Venda:active.filter(r=>r.type==='Venda').length}),[active]);
  const teamGoals={R1:Math.max(rosterCount,1)*EVENT_META.R1.goal,R2:Math.max(rosterCount,1)*EVENT_META.R2.goal,Venda:Math.max(rosterCount,1)*EVENT_META.Venda.goal};
  const activeDays=useMemo(()=>{const today=new Date();return Array.from({length:14},(_,index)=>{const d=addDays(today,index-13);const key=dayKey(d.getTime());const dayRecords=active.filter(r=>dayKey(r.ts)===key);return{key,label:d.toLocaleDateString('pt-BR',{day:'2-digit'}),total:dayRecords.length,R1:dayRecords.filter(r=>r.type==='R1').length,R2:dayRecords.filter(r=>r.type==='R2').length,Venda:dayRecords.filter(r=>r.type==='Venda').length};});},[active]);
  const currentHalf=activeDays.slice(7).reduce((sum,x)=>sum+x.total,0);const previousHalf=activeDays.slice(0,7).reduce((sum,x)=>sum+x.total,0);const change=previousHalf?Math.round((currentHalf-previousHalf)/previousHalf*100):(currentHalf?100:0);
  const conversionR1R2=percent(totals.R2,totals.R1);const conversionR2Venda=percent(totals.Venda,totals.R2);const completion=percent(totals.Venda,teamGoals.Venda);
  const filtered=records.filter(r=>!filter||String(r.code).toUpperCase().includes(filter.toUpperCase())||String(r.name).toLowerCase().includes(filter.toLowerCase()));
  const managerName=session.user.managerName||session.user.name||'Gestor';
  const lowest=Object.keys(teamGoals).sort((a,b)=>percent(totals[a],teamGoals[a])-percent(totals[b],teamGoals[b]))[0];
  async function add(){setMsg('');try{const m=EVENT_META[type];const d=await api({action:m.action,record:{code:code.trim().toUpperCase()}});if(d?.record?.type!==type)throw new Error('Tipo devolvido pelo servidor não corresponde ao selecionado.');setMsg(m.label+' incluída e salva no ledger.');setCode('');}catch(e){setMsg(e.message)}}
  async function remove(id){if(!window.confirm('Excluir este registro da contabilização? A evidência continuará no histórico de auditoria.'))return;try{await api({action:'delete',recordId:id,reason});setMsg('Registro excluído da contabilização, com trilha preservada.')}catch(e){setMsg(e.message)}}
  function exportCsv(){const rows=[['ID','Código','Assessor','Squad','Tipo','Data','Status','Origem','Criado por','Excluído em','Motivo']];records.forEach(r=>rows.push([r.id,r.code,r.name,r.squad,r.type,new Date(r.ts).toISOString(),r.status,r.source||'',r.createdBy||'',r.deletedAt?new Date(r.deletedAt).toISOString():'',r.deleteReason||'']));const csv='\ufeff'+rows.map(row=>row.map(csvCell).join(';')).join('\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='mes-do-seguro-auditoria-'+new Date().toISOString().slice(0,10)+'.csv';a.click();URL.revokeObjectURL(url)}
  return <div className="insight-dashboard"><section className="insight-hero"><div><span className="mseg-kicker">PAINEL EXECUTIVO · {managerName.toUpperCase()}</span><h1>O que está<br/><em>movendo o time.</em></h1><p>Uma leitura simples da campanha: volume, conversão, evolução e efeito no resultado.</p></div><div className="insight-live"><span>●</span><div><b>DADOS AO VIVO</b><small>Atualiza em {countdown}s · {rosterCount||0} assessores mapeados</small></div></div></section>
    <section className="insight-kpi-grid"><MetricCard label="AGENDADAS" value={totals.R1} detail={'de '+teamGoals.R1+' no ritmo da equipe'} accent="#4f8cff" icon="⚡" delta={percent(totals.R1,teamGoals.R1)+'%'}/><MetricCard label="REALIZADAS" value={totals.R2} detail={'de '+teamGoals.R2+' no ritmo da equipe'} accent="#d4af37" icon="◆" delta={percent(totals.R2,teamGoals.R2)+'%'}/><MetricCard label="VENDAS" value={totals.Venda} detail={'de '+teamGoals.Venda+' no ritmo da equipe'} accent="#16c784" icon="♛" delta={completion+'%'}/><MetricCard label="ATIVIDADE" value={active.length} detail={leaderboard.length+' assessores com produção'} accent="#b98cff" icon="◌" delta={deltaLabel(change)}/></section>
    <section className="insight-grid insight-main-grid"><article className="insight-panel insight-evolution"><div className="insight-panel-head"><div><span className="mseg-kicker">EVOLUÇÃO</span><h2>Ritmo dos últimos 14 dias</h2></div><span className="insight-chip">{change>=0?'↗':'↘'} {Math.abs(change)}%</span></div><TrendChart series={activeDays}/><div className="insight-legend"><span><i className="legend-dot blue"/>Agendadas</span><span><i className="legend-dot gold"/>Realizadas</span><span><i className="legend-dot green"/>Vendas</span><b>{currentHalf} registros na semana atual</b></div></article><article className="insight-panel"><div className="insight-panel-head"><div><span className="mseg-kicker">FUNIL</span><h2>Onde o resultado acontece</h2></div></div><Funnel totals={totals}/><div className="insight-conversion-grid"><div><small>R1 → R2</small><strong>{conversionR1R2}%</strong><span>avanço</span></div><div><small>R2 → VENDA</small><strong>{conversionR2Venda}%</strong><span>fechamento</span></div></div></article></section>
    <section className="insight-grid insight-effect-grid"><article className="insight-panel effect-highlight"><span className="mseg-kicker">EFEITOS NO RESULTADO</span><h2>O próximo movimento está claro.</h2><p>A maior oportunidade agora está em <strong>{EVENT_META[lowest].short.toLowerCase()}</strong>. A equipe alcançou {percent(totals[lowest],teamGoals[lowest])}% do ritmo esperado nesta etapa.</p><div className="effect-action"><span>{EVENT_META[lowest].icon}</span><div><b>Alavanca prioritária</b><small>Fechar o próximo degrau do funil aumenta a conversão e aproxima o time da meta de vendas.</small></div></div></article><article className="insight-panel effect-stack"><div><small>ASSESSORES ATIVOS</small><strong>{leaderboard.length}</strong><span>com pelo menos um registro</span></div><div><small>CONVERSÃO TOTAL</small><strong>{conversionR1R2&&conversionR2Venda?Math.round(conversionR1R2*conversionR2Venda/100):0}%</strong><span>de R1 até venda</span></div><div><small>LEDGER AUDITÁVEL</small><strong>{records.length}</strong><span>inclui histórico de ajustes</span></div></article></section>
    <section className="insight-panel insight-ranking"><div className="insight-panel-head"><div><span className="mseg-kicker">PERFORMANCE</span><h2>Quem está puxando o resultado</h2></div><span className="insight-caption">prioridade por vendas, avanço e volume</span></div><div className="insight-ranking-table"><header><span>#</span><span>ASSESSOR</span><span>R1</span><span>R2</span><span>VENDA</span><span>ATIVIDADE</span></header>{leaderboard.slice(0,8).map((item,index)=><div key={item.code}><b className="rank-number">{String(index+1).padStart(2,'0')}</b><span><strong>{item.name}</strong><small>{item.squad||item.code}</small></span><b>{item.R1}</b><b>{item.R2}</b><b className="rank-sale">{item.Venda}</b><span className="rank-bar"><i style={{width:Math.min(100,item.total*12)+'%'}}/><small>{item.total} registros</small></span></div>)}</div>{leaderboard.length===0&&<div className="mseg-empty">Aguardando os primeiros registros da campanha.</div>}</section>
    <details className="insight-audit"><summary><span><b>Auditoria e ajustes</b><small>Histórico completo, exportação e manutenção manual</small></span><em>ABRIR ÁREA OPERACIONAL →</em></summary><div className="insight-audit-body"><div className="insight-panel-head"><div><span className="mseg-kicker">AJUSTE MANUAL</span><h2>Adicionar registro</h2></div><button className="mseg-link" onClick={exportCsv}>EXPORTAR CSV ↓</button></div><div className="mseg-admin-form"><input value={code} onChange={e=>setCode(e.target.value)} placeholder="Código XP (ex.: A26305)"/><select value={type} onChange={e=>setType(e.target.value)}>{Object.entries(EVENT_META).map(([key,m])=><option key={key} value={key}>{m.label}</option>)}</select><button onClick={add} disabled={!code}>ADICIONAR REGISTRO</button></div>{msg&&<div className="mseg-toast">{msg}</div>}<div className="insight-audit-tools"><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filtrar por código ou nome"/><input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Motivo padrão da exclusão"/></div><div className="mseg-audit-table"><header><span>DATA</span><span>ASSESSOR</span><span>TIPO</span><span>STATUS</span><span>ORIGEM</span><span>AÇÃO</span></header>{[...filtered].reverse().map(r=>{const m=EVENT_META[r.type]||EVENT_META.R1;return <div key={r.id} className={r.status==='deleted'?'deleted':''}><span>{fmt(r.ts)}</span><span><b>{r.name}</b><small>{r.code} · {r.squad}</small></span><strong style={{color:m.color}}>{m.label}</strong><span>{r.status==='deleted'?<em>EXCLUÍDO</em>:<b>ATIVO</b>}</span><small>{r.source==='auditor'?'GESTOR':'ASSESSOR'}</small><span>{r.status==='deleted'?<small>{r.deleteReason||'Ajuste de auditoria'}</small>:<button onClick={()=>remove(r.id)}>EXCLUIR</button>}</span></div>})}</div></div></details><button className="mseg-ghost insight-logout" onClick={onLogout}>SAIR DO PAINEL</button></div>;
}

function ActionButton({type,saving,onAdd}){
  const m=EVENT_META[type];
  return <button type="button" className="mseg-action" style={{'--accent':m.color}} disabled={!!saving} onClick={()=>onAdd(type)}><span>{m.icon}</span><b>{m.short}</b><small>{m.label}</small><em>{m.reward}</em>{saving===type&&<i>SALVANDO {m.short}...</i>}</button>;
}

function AdvisorView({session,records,api,onLogout,countdown}){
  const user=session.user;const active=records.filter(r=>r.status!=='deleted');const counts={R1:active.filter(r=>r.type==='R1').length,R2:active.filter(r=>r.type==='R2').length,Venda:active.filter(r=>r.type==='Venda').length};const[saving,setSaving]=useState('');const[msg,setMsg]=useState('');
  async function add(type){const m=EVENT_META[type];if(!m)return;setSaving(type);setMsg('');try{const d=await api({action:m.action});if(d?.record?.type!==type)throw new Error('Tipo de registro divergente. Lançamento não confirmado.');setMsg(m.label+' registrada e salva no histórico.')}catch(e){setMsg(e.message)}finally{setSaving('');setTimeout(()=>setMsg(''),3500)}}
  return <div className="mseg-advisor-wrap"><section className="mseg-user-card"><div className="mseg-avatar">{initials(user.name)}</div><div className="mseg-user-copy"><small>ASSESSOR AUTENTICADO</small><h2>{user.name}</h2><p>{user.squad} · {user.code}</p></div><div className="mseg-user-actions"><span>ATUALIZA EM {countdown}s</span><button className="mseg-ghost" onClick={onLogout}>SAIR</button></div></section><section className="mseg-section"><div className="mseg-section-title"><div><span className="mseg-kicker">SEU PROGRESSO</span><h3>Mês do Seguro</h3></div><span className="mseg-live">● HISTÓRICO SALVO</span></div><div className="mseg-progress-grid"><ProgressCard type="R1" value={counts.R1}/><ProgressCard type="R2" value={counts.R2}/><ProgressCard type="Venda" value={counts.Venda}/></div></section><section className="mseg-section"><div className="mseg-section-title"><div><span className="mseg-kicker">REGISTRAR PRODUÇÃO</span><h3>Seu lançamento entra no histórico imediatamente</h3></div></section><div className="mseg-action-grid"><ActionButton type="R1" saving={saving} onAdd={add}/><ActionButton type="R2" saving={saving} onAdd={add}/><ActionButton type="Venda" saving={saving} onAdd={add}/></div>{msg&&<div className="mseg-toast">{msg}</div></section><section className="mseg-section"><div className="mseg-section-title"><div><span className="mseg-kicker">HISTÓRICO DA CAMPANHA</span><h3>Todos os seus registros</h3><p>Os dados permanecem disponíveis para o fechamento e auditoria.</p></div></div>{active.length?<div className="mseg-history-table"><header><span>DATA</span><span>REGISTRO</span><span>BENEFÍCIO</span><span>ORIGEM</span></header>{[...active].reverse().map(r=>{const m=EVENT_META[r.type]||EVENT_META.R1;return <div key={r.id}><span>{fmt(r.ts)}</span><b style={{color:m.color}}>{m.icon} {m.label}</b><strong>{m.reward}</strong><small>{r.source==='auditor'?'GESTOR':'VOCÊ'}</small></div>})}</div>:<div className="mseg-empty">Você ainda não possui registros nesta campanha.</div>}</section></div>;
}

export default function CampaignDashboard(){
  const[session,setSession]=useSession();const{records,loading,error,countdown,api}=useCampaignData(session);const roster=useRoster(session);
  if(!session)return <div className="mseg-app"><div className="mseg-bg"/><AccessGate onLogin={setSession}/></div>;
  const isManager=session.user.role==='admin';
  return <div className="mseg-app"><div className="mseg-bg"/><header className="mseg-header"><div className="mseg-brand"><span className="mseg-brand-mark">E</span><div><b>EUROSTOCK</b><small>PAINEL DE PERFORMANCE · SETEMBRO 2026</small></div></div><div className="mseg-private-badge">🔒 {isManager?(session.user.managerName||'GESTÃO'):'ACESSO INDIVIDUAL'}</div></header><main className="mseg-main">{error&&<div className="mseg-error">{error}</div>}{isManager?<ManagerView session={session} records={records} roster={roster} api={api} onLogout={()=>setSession(null)} countdown={countdown}/>:<AdvisorView session={session} records={records} api={api} onLogout={()=>setSession(null)} countdown={countdown}/>} {loading&&<div className="mseg-loading">SINCRONIZANDO HISTÓRICO...</div>}</main></div>;
}
