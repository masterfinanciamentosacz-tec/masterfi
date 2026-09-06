# Master Financiamentos — ERP financeiro

## Stack
- Next.js (App Router, TypeScript, Tailwind) — em `app/`
- Supabase (Auth + Postgres) — schema em `supabase/schema.sql`
- Deploy: Vercel + GitHub

## Paleta (do anexo)
- `#C5F163` verde-limão
- `#F2CB05` amarelo
- `#F2B705` âmbar
- `#D98E04` laranja
- `#581E0D` marrom escuro (fundo/acento)
- Fundo principal do app: `#0B1220` (dark navy, como na logo) com dourado (`#F2CB05`/`#D98E04`) como cor de destaque.

## Logo
Coloque o arquivo da logo em `app/public/logo.png` (o anexo enviado no chat não é acessível pelo sistema de arquivos — precisa ser salvo manualmente pelo usuário ou enviado como arquivo).

## Próximos passos após o scaffold
1. Instalar `@supabase/supabase-js` e `@supabase/ssr`
2. Criar `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Rodar `supabase/schema.sql` no SQL editor do projeto Supabase
4. Criar telas: `/login`, `/dashboard`, `/lancamentos`
5. Configurar Tailwind theme com a paleta
6. `git init`, criar repo no GitHub, conectar à Vercel
