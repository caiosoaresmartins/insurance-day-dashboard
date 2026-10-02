import React from 'react';

const BRL=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});

const demoDays=[
  {label:'18',card:0,insurance:0},
  {label:'19',card:0,insurance:0},
  {label:'20',card:0,insurance:0},
  {label:'21',card:0,insurance:0},
  {label:'22',card:0,insurance:0},
  {label:'23',card:0,insurance:0},
  {label:'24',card:0,insurance:0},
  {label:'25',card:0,insurance:0},
  {label:'26',card:0,insurance:0},
  {label:'27',card:0,insurance:0},
  {label:'28',card:0,insurance:0},
  {label:'29',card:0,insurance:0},
  {label:'30',card:0,insurance:0},
  {label:'01',card:0,insurance:0}
];

const acceleratorLevels=[
  {level:'01',name:'Base',detail:'Aguardando primeiros lançamentos',state:'current'},
  {level:'02',name:'Ritmo',detail:'Produção consistente',state:''},
  {level:'03',name:'Escala',detail:'Crescimento acelerado',state:'current'},
  {level:'04',name:'Máximo',detail:'Maior patamar da campanha',state:''}
];

function Metric({label,value,detail,tone='gold'}) {
  return <article className={'cgc-presentation-metric '+tone}>
    <span>{label}</span>
    <strong>{value}</strong>
    <small>{detail}</small>
  </article>;
}

function ValueChart() {
  const width=820;
  const height=270;
  const left=34;
  const right=20;
  const top=24;
  const bottom=34;
  const max=250;
  const innerWidth=width-left-right;
  const innerHeight=height-top-bottom;
  const line=key=>demoDays.map((day,index)=>{
    const x=left+(index*innerWidth/(demoDays.length-1));
    const y=height-bottom-(day[key]/max)*innerHeight;
    return x+','+y;
  }).join(' ');
  return <div className="cgc-presentation-chart">
    <svg viewBox={'0 0 '+width+' '+height} role="img" aria-label="Exemplo de evolução do valor das cartas e do seguro">
      <line x1={left} x2={width-right} y1={height-bottom} y2={height-bottom} className="cgc-presentation-axis"/>
      <line x1={left} x2={width-right} y1={top+55} y2={top+55} className="cgc-presentation-gridline"/>
      <line x1={left} x2={width-right} y1={top+110} y2={top+110} className="cgc-presentation-gridline"/>
      <line x1={left} x2={width-right} y1={top+165} y2={top+165} className="cgc-presentation-gridline"/>
      <polyline points={line('card')} className="cgc-presentation-line gold"/>
      <polyline points={line('insurance')} className="cgc-presentation-line violet"/>
      {demoDays.map((day,index)=><text key={day.label+'-'+index} x={left+(index*innerWidth/(demoDays.length-1))} y={height-10} textAnchor="middle" className="cgc-presentation-label">{day.label}</text>)}
    </svg>
    <div className="cgc-presentation-legend"><span><i className="gold"/>Valor das cartas</span><span><i className="violet"/>Valor do seguro</span></div>
  </div>;
}

function Accelerator() {
  return <article className="cgc-presentation-card cgc-presentation-accelerator">
    <div className="cgc-presentation-card-head"><div><span className="cgc-presentation-kicker">ACELERADOR</span><h2>Leitura do momento</h2></div><span className="cgc-presentation-chip">INÍCIO</span></div>
    <p className="cgc-presentation-muted">A campanha evolui por marcos. O gestor visualiza o patamar atual e o próximo avanço em uma única leitura.</p>
    <div className="cgc-presentation-steps">{acceleratorLevels.map(item=><div key={item.level} className={'cgc-presentation-step '+item.state}><b>{item.level}</b><span><strong>{item.name}</strong><small>{item.detail}</small></span>{item.state==='current'&&<em>ATUAL</em>}</div>)}</div>
    <div className="cgc-presentation-progress"><span><b>Base</b><small>Aguardando lançamentos</small></span><strong>0%</strong></div>
    <div className="cgc-presentation-progress-track"><i/></div>
  </article>;
}

export default function PresentationPage() {
  return <div className="mseg-app cgc-presentation-app">
    <div className="mseg-bg"/>
    <header className="mseg-header cgc-presentation-header">
      <div className="mseg-brand"><span className="mseg-brand-mark">E</span><div><b>EUROSTOCK</b><small>CGC CROSS SELL · APRESENTAÇÃO</small></div></div>
      <div className="cgc-presentation-header-actions"><span className="cgc-presentation-public">VISÃO PÚBLICA · DEMONSTRAÇÃO</span><a href="/gestor" className="cgc-presentation-login">Acessar painel →</a></div>
    </header>
    <main className="cgc-presentation-shell">
      <section className="cgc-presentation-hero">
        <div className="cgc-presentation-hero-copy"><span className="cgc-presentation-kicker">CAMPANHA CROSS SELL · EUROSTOCK</span><h1>Uma visão clara<br/>do que está <em>avançando.</em></h1><p>Apresentação executiva para acompanhar produção, valores e evolução da campanha em uma leitura simples, visual e sofisticada.</p><div className="cgc-presentation-hero-meta"><span><i/>Campanha em andamento</span><span>Atualização gerencial</span></div></div>
        <div className="cgc-presentation-hero-card"><span className="cgc-presentation-kicker">MOMENTO DA CAMPANHA</span><strong>Início</strong><small>Aguardando primeiros lançamentos</small><div className="cgc-presentation-orbit"><i/><i/><i/></div></div>
      </section>
      <section className="cgc-presentation-metrics">
        <Metric label="VENDAS VÁLIDAS" value="0" detail="produção acumulada" tone="gold"/>
        <Metric label="VALOR DAS CARTAS" value={BRL.format(0)} detail="somatório demonstrativo" tone="gold"/>
        <Metric label="VALOR DOS SEGUROS" value={BRL.format(0)} detail="prêmios registrados" tone="violet"/>
        <Metric label="ASSESSORES ATIVOS" value="0" detail="com produção registrada" tone="violet"/>
      </section>
      <section className="cgc-presentation-grid cgc-presentation-main-grid">
        <article className="cgc-presentation-card cgc-presentation-evolution"><div className="cgc-presentation-card-head"><div><span className="cgc-presentation-kicker">EVOLUÇÃO</span><h2>Valores ao longo da campanha</h2></div><span className="cgc-presentation-chip">14 DIAS</span></div><ValueChart/><div className="cgc-presentation-callout"><strong>0%</strong><span>Aguardando os primeiros registros para mostrar a evolução da campanha</span></div></article>
        <Accelerator/>
      </section>
      <section className="cgc-presentation-grid cgc-presentation-effects-grid">
        <article className="cgc-presentation-card cgc-presentation-effect"><span className="cgc-presentation-effect-number">01</span><span className="cgc-presentation-kicker">EFEITO · VISIBILIDADE</span><h2>Todos entendem o momento da campanha.</h2><p>Os marcos do acelerador deixam de ser uma informação dispersa e passam a orientar a leitura da gestão.</p></article>
        <article className="cgc-presentation-card cgc-presentation-effect"><span className="cgc-presentation-effect-number">02</span><span className="cgc-presentation-kicker">EFEITO · FOCO</span><h2>O valor certo aparece no lugar certo.</h2><p>Carta e seguro são apresentados separadamente para facilitar comparação, acompanhamento e decisão.</p></article>
        <article className="cgc-presentation-card cgc-presentation-effect"><span className="cgc-presentation-effect-number">03</span><span className="cgc-presentation-kicker">EFEITO · RITMO</span><h2>A evolução vira conversa de resultado.</h2><p>Gráficos simples mostram o movimento da campanha sem excesso de informação ou etapas desnecessárias.</p></article>
      </section>
      <footer className="cgc-presentation-footer"><div><span className="cgc-presentation-kicker">APRESENTAÇÃO EXECUTIVA</span><p>Esta página usa dados demonstrativos. Os números reais ficam protegidos no painel do gestor.</p></div><a href="/gestor" className="cgc-presentation-login">Abrir painel do gestor →</a></footer>
    </main>
  </div>;
}
