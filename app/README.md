# Master Financiamentos — ERP Financeiro

Sistema interno para controlar tudo que gera entrada ou saída de dinheiro: notas fiscais emitidas/recebidas, valores a pagar/receber, despesas, vencimentos, pagamentos e o resultado financeiro mensal.

## Stack
- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Supabase** (Auth + Postgres) para login e banco de dados
- **Vercel** para deploy
- **GitHub** para versionamento

## Configuração

### 1. Criar o projeto no Supabase
1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode o script `supabase/schema.sql` (na raiz do repositório, um nível acima desta pasta).
3. Em **Authentication → Providers**, deixe **Email** habilitado (login por e-mail/senha).
4. Em **Authentication → Users**, crie o primeiro usuário (o cliente) manualmente, ou habilite signup e crie por lá.
5. Copie a **Project URL** e a **anon public key** em **Settings → API**.

### 2. Variáveis de ambiente
Copie `.env.local.example` para `.env.local` e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 3. Rodar localmente
```bash
npm install
npm run dev
```
Acesse `http://localhost:3000` — você será redirecionado para `/login`.

### 4. Deploy
1. Suba o repositório para o GitHub.
2. Importe o repositório na [Vercel](https://vercel.com/new).
3. Configure as mesmas variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) no projeto da Vercel.
4. Deploy.

## Estrutura
- `/login` — autenticação (e-mail e senha via Supabase Auth)
- `/dashboard` — visão geral com filtros por período, KPIs (recebido, pago, a receber, a pagar), gráfico mensal e próximos vencimentos
- `/lancamentos` — tela única de lançamentos: cadastro, edição, exclusão, marcação de pago/recebido e filtros (tipo, categoria, status, período, busca)

Todo lançamento tem: tipo (receita/despesa), categoria (nota fiscal emitida/recebida, valor a receber/pagar, gasto/despesa, outro), valor, datas de emissão/vencimento/pagamento e status (calculado automaticamente: pendente, vencido, pago/recebido).

## Logo e paleta
- Substitua `public/logo.png` pela logo oficial (dourado sobre fundo azul-marinho) se quiser usar a imagem em vez do logotipo em SVG usado no header (`src/components/logo.tsx`).
- Paleta aplicada em `src/app/globals.css`: `#C5F163`, `#F2CB05`, `#F2B705`, `#D98E04`, `#581E0D` sobre fundo escuro `#0B1220`.
