# 🛡️ Insurance Day Dashboard

Dashboard gerencial da Eurostock para a campanha CGC Cross Sell, com lançamentos manuais, valores de cartas, valores de seguros, evolução e aceleradores.

## Como rodar

```bash
npm install
npm run dev
```

O Vite informa a URL local no terminal, normalmente `http://localhost:5173`.

## Fluxo da campanha

- Entrada única com login de gestor.
- Todos os registros são lançados manualmente pela gestão.
- Cada lançamento separa valor da carta e valor do seguro.
- A periodicidade do seguro fica registrada.
- O acelerador é recalculado no servidor.
- O painel mostra evolução de valores, ranking, efeitos comerciais e auditoria.
- Reuniões, R1, R2 e comissão não fazem parte desta campanha.

## Acessos

A campanha aceita somente acesso de gestor. O gestor principal permanece compatível com a credencial existente; o segundo gestor pode ser habilitado com `MANAGER_2_PIN` ou `MANAGER_2_PIN_SHA256` nas variáveis da Vercel.

## Persistência e segurança

Os registros são persistidos via Vercel Functions em `/api/kv`, usando a base Supabase existente e uma campanha própria. Cada lançamento mantém assessor, squad, valores, acelerador, origem e trilha de auditoria.

Variáveis esperadas na Vercel:

```text
NOTION_KEY
ADMIN_SECRET
MANAGER_2_PIN (opcional)
MANAGER_2_PIN_SHA256 (opcional)
APP_ORIGIN (opcional)
SESSION_SECRET (recomendável)
```

## Deploy

O projeto existente está conectado ao GitHub e à Vercel. Branches geram previews automaticamente; `main` é a branch de produção.
