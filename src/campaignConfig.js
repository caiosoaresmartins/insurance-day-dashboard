export const SEPTEMBER_CAMPAIGN = {
  id: '2026-09-ceo-endoidou',
  name: 'Mês do Seguro',
  slogan: 'O CEO Endoidou',
  eyebrow: 'SETEMBRO · MÊS DO SEGURO',
  start: '2026-09-01T00:00:00-03:00',
  end: '2026-09-30T23:59:59-03:00',
  timezone: 'America/Sao_Paulo',
  commissionLabel: '50% DE COMISSÃO',
  rewards: [
    { id:'agenda', type:'R1', goal:3, title:'META 01', rule:'3 reuniões agendadas', reward:'R$ 100', icon:'⚡' },
    { id:'realizada', type:'R2', goal:1, title:'META 02', rule:'1 reunião realizada', reward:'R$ 200', icon:'◆' },
    { id:'venda', type:'Venda', goal:1, title:'META 03', rule:'1 venda', reward:'50% DE COMISSÃO', icon:'♛' },
  ],
};
