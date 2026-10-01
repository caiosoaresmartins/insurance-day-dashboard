# 🛡️ Insurance Day Dashboard

Dashboard comercial da Eurostock para a campanha vigente, com acesso de assessor e gestor, evolução, metas, ranking e efeitos no resultado.

## Como rodar

```bash
npm install
npm run dev
```

O Vite informa a URL local no terminal, normalmente `http://localhost:5173`.

## Experiência da campanha

- Entrada única no endereço principal do projeto.
- Assessor registra vendas e acompanha a própria evolução.
- Gestor acompanha KPIs, evolução, meta de referência, ritmo, ranking e efeitos comerciais.
- Área operacional com auditoria, ajustes manuais e exportação CSV.
- Não há métricas de reuniões, R1 ou R2 nesta campanha.
- Tela cheia e Modo TV continuam disponíveis.

## Acessos

O acesso do assessor continua sendo feito pelo código XP. O gestor usa o PIN já existente; um segundo gestor pode ser habilitado com `MANAGER_2_PIN` ou `MANAGER_2_PIN_SHA256` nas variáveis da Vercel.

## Persistência e segurança

Os registros são persistidos via Vercel Functions em `/api/kv`. O servidor valida o código do assessor, o tipo de evento e as permissões do gestor. Exclusões administrativas mantêm a trilha de auditoria.

Variáveis esperadas na Vercel:

```text
KV_REST_API_URL
KV_REST_API_TOKEN
NOTION_KEY
ADMIN_SECRET
MANAGER_2_PIN (opcional)
MANAGER_2_PIN_SHA256 (opcional)
APP_ORIGIN (opcional)
```

## Deploy

O projeto existente está conectado ao GitHub e à Vercel. Branches geram previews automaticamente; `main` é a branch de produção.
