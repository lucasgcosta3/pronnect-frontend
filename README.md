# Pronnect — frontend (Next.js)

Interface web do MVP **Pronnect**, consumindo a API Spring em `pronnect-api`.

## Pré-requisitos

- Node.js 20+
- API rodando (PostgreSQL + Flyway conforme o backend)

## Configuração

```bash
cp .env.example .env.local
# Ajuste NEXT_PUBLIC_API_URL se a API não estiver em http://localhost:8080
```

No backend, `application.yaml` deve permitir a origem do Next (padrão: `http://localhost:3000` em `app.cors.allowed-origins`).

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Rotas principais

| Rota | Descrição |
|------|-----------|
| `/` | Landing pública |
| `/login`, `/register` | Autenticação (JWT em `localStorage`) |
| `/app` | Painel |
| `/app/professional/onboarding` | Perfil + habilidades (profissional) |
| `/app/company/onboarding` | Empresa |
| `/app/professionals` | Busca (conta empresa) |
| `/app/proposals/inbox` | Propostas recebidas (profissional) |
| `/app/proposals/sent` | Propostas enviadas (empresa) |
| `/app/messages` | Lista de conversas |
| `/app/messages/{id}` | Thread |
| `/app/contracts/{id}` | Contrato, hold/release de pagamento |

## Smoke test manual (fluxo feliz)

1. Suba a API e o banco; confira CORS para `http://localhost:3000`.
2. **Profissional**: registre com papel Profissional → login → onboarding (dados + ao menos uma skill) até o perfil ficar completo.
3. **Empresa**: outro navegador (ou aba anônima) → registre Empresa → onboarding com todos os campos obrigatórios.
4. Empresa: **Profissionais** → abra o perfil → envie proposta pendente.
5. Profissional: **Propostas recebidas** → aceite.
6. Ambos: **Mensagens** / abrir conversa a partir da proposta aceita → enviar mensagens.
7. Qualquer um com acesso ao contrato: abra **Contrato** pelo link na proposta.
8. Empresa (contrato `IN_PROGRESS`): registre **hold** de pagamento.
9. Profissional: **Marcar como concluído** → Empresa: **Validar** → **Liberar pagamento**.

## Segurança (MVP)

O token JWT fica no `localStorage` (adequado para MVP; em produção avalie cookies httpOnly).

O JWT inclui claims `role` e `accountId` gerados pela API para o painel e o chat.
