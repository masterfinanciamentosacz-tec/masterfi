-- Master Financiamentos ERP - migration 006
-- Upload de nota fiscal (PDF): guarda o arquivo, os dados lidos da nota e o vinculo
-- com a conta a receber criada a partir dela.
-- Pode rodar o script inteiro de uma vez e e seguro rodar mais de uma vez.

alter table public.nfes
  add column if not exists chave_acesso text,
  add column if not exists descricao text,
  add column if not exists arquivo_path text,
  add column if not exists lancamento_id uuid references public.lancamentos(id) on delete set null;

-- A chave de acesso e unica por nota: impede subir a mesma NFS-e duas vezes
create unique index if not exists idx_nfes_chave_acesso
  on public.nfes(chave_acesso) where chave_acesso is not null;

-- Armazenamento privado dos PDFs
insert into storage.buckets (id, name, public)
values ('notas-fiscais', 'notas-fiscais', false)
on conflict (id) do nothing;

drop policy if exists "notas_fiscais_select" on storage.objects;
drop policy if exists "notas_fiscais_insert" on storage.objects;
drop policy if exists "notas_fiscais_update" on storage.objects;
drop policy if exists "notas_fiscais_delete" on storage.objects;

create policy "notas_fiscais_select" on storage.objects
  for select using (bucket_id = 'notas-fiscais' and auth.role() = 'authenticated');
create policy "notas_fiscais_insert" on storage.objects
  for insert with check (bucket_id = 'notas-fiscais' and auth.role() = 'authenticated');
create policy "notas_fiscais_update" on storage.objects
  for update using (bucket_id = 'notas-fiscais' and auth.role() = 'authenticated');
create policy "notas_fiscais_delete" on storage.objects
  for delete using (bucket_id = 'notas-fiscais' and auth.role() = 'authenticated');
