# VICTA — Gestão Orçamentária (v1)

Primeira versão navegável do sistema de gestão orçamentária da VICTA. Cobre:
orçamento executivo (árvore com composições/insumos), orçamento RM, DE-PARA
orçamentário, e o fluxo completo de criação de QQP com cabeças de
contratação. Todos os dados vistos na aplicação são **demonstrativos** —
veja `prisma/seed.ts`.

Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui (Base UI) +
TanStack Table + Prisma (Postgres) + Supabase Auth + Recharts.

## Pré-requisitos

- Node.js 20+ (este projeto foi criado com Node 24).
- **Docker Desktop** instalado e em execução — necessário para o Supabase
  CLI local (`supabase start` sobe Postgres + Auth + Studio em containers).

## Primeira configuração

1. Instale o Docker Desktop (https://www.docker.com/products/docker-desktop/)
   e confirme que está rodando (`docker info` não deve dar erro).

2. Instale as dependências (se ainda não tiver feito):

   ```bash
   npm install
   ```

3. Suba o Supabase local:

   ```bash
   npm run supabase:start
   ```

   Ao final, o comando imprime `API URL`, `anon key`, `service_role key` e a
   URL do Postgres. Copie o arquivo `.env` (já tem os valores padrão do
   Supabase local) e, se os valores impressos forem diferentes, atualize
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no `.env`.

4. Rode as migrations e o seed de demonstração:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. Suba o app:

   ```bash
   npm run dev
   ```

6. Abra http://localhost:3000, clique em **Criar conta** na tela de login
   (e-mail/senha — sem confirmação por e-mail no ambiente local) e navegue.

## Scripts úteis

| Script | O que faz |
|---|---|
| `npm run dev` | Sobe o Next.js em modo desenvolvimento |
| `npm run supabase:start` / `supabase:stop` | Sobe/derruba Postgres + Auth + Studio locais |
| `npm run db:migrate` | Aplica as migrations do Prisma |
| `npm run db:seed` | Repopula os dados de demonstração (apaga e recria) |
| `npm run db:studio` | Abre o Prisma Studio para inspecionar o banco |

O Supabase Studio local (inspecionar usuários de Auth, tabelas, etc.) abre em
http://127.0.0.1:54323 depois do `supabase start`.

## O que esta v1 cobre

- Seleção de obra (contexto global) e cadastro de obras (Administração).
- Orçamento Executivo: árvore Obra → Grupo → Tarefa → Composição → Insumo,
  com busca, totalizadores e indicação de tarefas sem DE-PARA.
- Orçamento RM: consulta hierárquica somente leitura.
- DE-PARA Orçamentário: duas tabelas ligadas com destaque cruzado e
  indicadores de conciliação (diferença absoluta/percentual, % conciliado).
- Registros / QQP: criação de QQP (rascunho persistido imediatamente),
  seleção de tarefas completas ou insumos individuais (com regra de
  exclusividade), ajuste de quantidades solicitadas, criação de cabeças de
  contratação (agregadores financeiros — sem quantidade/preço próprios),
  movimentação de itens entre cabeças, e tela de revisão com alertas e
  avanço de status.
- Login/cadastro via Supabase Auth; cada obra é visível a qualquer usuário
  autenticado nesta v1 (papéis/permissões por obra ficam para uma fase
  futura — já previsto no modelo de dados).

Fora do escopo desta v1 (fases futuras, ver `C:\Users\Luiz\.claude\plans\starry-sniffing-eagle.md`):
os 47 modelos de contratação e exportação para XLSX, memoriais de aditivo,
contratos/apropriação real no RM, importador de Excel, auditoria completa e
permissões granulares.
