# 🛡️ Insurance Day Dashboard

Dashboard de performance comercial da Eurostock para R1, R2 e vendas, com ranking em tempo real, visão gerencial, fullscreen e Modo TV.

## Como rodar

```bash
npm install
npm run dev
```

O Vite informa a URL local no terminal, normalmente `http://localhost:5173`.

## Funcionalidades

- Ranking individual em tempo real
- Registro de R1, R2 e Venda
- Ranking por squads e pontos por assessor
- Funil R1 → R2 → Venda
- Conversão R1 → R2 e R2 → Venda
- Próximos da meta
- Alertas de baixa atividade e gargalos
- Filtro mensal no painel Intelligence
- Tela cheia real pelo navegador
- Modo TV
- Lista oficial de assessores sincronizada com Notion, com fallback local

## Pontuação atual

| Tipo | Pontos | Meta |
|------|--------|------|
| R1 — Reunião Agendada | 30 pts | 4 |
| R2 — Reunião Realizada | 50 pts | 4 |
| Venda | 100 pts | 2 |

## Premiação atual

- 🥉 4 R1 → **R$ 150**
- 🥈 4 R1 + 4 R2 → **R$ 300**
- 🥇 4 R1 + 4 R2 + 2 Vendas → **R$ 500**

## Base oficial de assessores

A fonte oficial é o banco **👥 Assessores — Eurostock** no Notion. O endpoint `/api/assessors` consulta essa base quando `NOTION_KEY` está configurada e usa uma lista de fallback com 32 cadastros caso o Notion esteja temporariamente indisponível.

Squads atuais:

- 🔵 Alavancados — 10
- 🟤 Los Hermanos — 7
- 🟣 Advisors — 3
- 🟠 Outliers — 4
- 🟢 Anywhere — 2
- ⚙️ Operacionais — 6

## Persistência e segurança

Os registros são persistidos via Vercel Functions em `/api/kv` usando Upstash. Novos lançamentos usam uma lista atômica para evitar perda de dados em gravações simultâneas. Código do assessor e tipo de evento são validados no servidor. A limpeza total exige `ADMIN_SECRET` enviado no header `X-Admin-Secret`.

Variáveis esperadas na Vercel:

```text
KV_REST_API_URL
KV_REST_API_TOKEN
NOTION_KEY
ADMIN_SECRET
APP_ORIGIN (opcional)
```

## Deploy

O projeto está conectado ao GitHub e à Vercel. Branches geram Preview Deployments automaticamente; `main` é a branch de produção.
