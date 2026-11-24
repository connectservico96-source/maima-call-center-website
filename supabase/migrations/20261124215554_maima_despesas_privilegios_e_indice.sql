
create index if not exists maima_despesas_criado_por_idx
  on public.maima_despesas (criado_por);

revoke insert on table public.maima_despesas from authenticated;
grant insert (campanha_id, data_despesa, categoria, descricao, valor, moeda, criado_por)
  on table public.maima_despesas to authenticated;

drop policy if exists "MAIMA coordenacao regista despesas" on public.maima_despesas;
create policy "MAIMA coordenacao regista despesas"
  on public.maima_despesas for insert to authenticated
  with check (
    public.maima_current_role() = any (array['admin','coordenador']::text[])
    and criado_por = (select auth.uid())
    and estado = 'ativa'
  );
