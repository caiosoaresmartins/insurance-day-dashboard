# 🛡️ Insurance Day Dashboard

Dashboard de ranking da **Campanha 4-4-2** da Eurostock.
Reuneões agendadas (R1), realizadas (R2) e vendas pontuadas em tempo real.

## Como rodar

```bash
npm install
npm start
```

Abre em `http://localhost:3000`

## Como usar

1. **Login** — o assessor digita seu código XP ou nome
2. **Registrar** — clica em R1, R2 ou Venda (um clique só)
3. **Ranking** — veja o pódio atualizado na hora

## Pontuação

| Tipo | Pontos | Meta |
|------|--------|------|
| R1 — Reunião Agendada | 30 pts | 4 |
| R2 — Reunião Realizada | 50 pts | 4 |
| Venda | 100 pts | 2 |

## Premiação

- 🥉 4 R1 → **R$ 150**
- 🥈 4 R1 + 4 R2 → **R$ 300**
- 🥇 4 R1 + 4 R2 + 2 Vendas → **R$ 500**

## Squads

- 🔵 Alavancados (10)
- 🟤 Los Hermanos (4)
- 🟣 Advisors (3)
- 🟠 Outliers (4)
- 🟢 Anywhere (2)
- ⚙️ Áreas Operacionais (6)

## Dados

Todos os registros ficam em `localStorage` do navegador.
Sem backend, sem Notion, sem login externo.
