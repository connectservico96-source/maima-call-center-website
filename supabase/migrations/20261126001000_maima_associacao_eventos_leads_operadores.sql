alter table public.maima_telefonia_eventos
  add column if not exists lead_id uuid references public.maima_leads(id) on delete set null,
  add column if not exists operador_id uuid references public.maima_perfis(user_id) on delete set null,
  add column if not exists associacao_estado text not null default 'pendente'
    check (associacao_estado in ('pendente','associada','ambigua','sem_correspondencia')),
  add column if not exists associado_em timestamptz;

create index if not exists maima_telefonia_eventos_lead_idx
  on public.maima_telefonia_eventos (lead_id, chamada_em desc);
create index if not exists maima_telefonia_eventos_operador_idx
  on public.maima_telefonia_eventos (operador_id, chamada_em desc);

create table if not exists public.maima_telefonia_operadores (
  id uuid primary key default gen_random_uuid(),
  fornecedor text not null check (fornecedor ~ '^[a-z0-9][a-z0-9_-]{1,49}$'),
  operador_externo_ref text not null,
  operador_id uuid not null references public.maima_perfis(user_id) on delete restrict,
  ativo boolean not null default true,
  criado_por uuid references public.maima_perfis(user_id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint maima_telefonia_operadores_fornecedor_ref_key unique (fornecedor, operador_externo_ref)
);

create index if not exists maima_telefonia_operadores_operador_idx
  on public.maima_telefonia_operadores (operador_id);

alter table public.maima_telefonia_operadores enable row level security;
revoke all on table public.maima_telefonia_operadores from anon, authenticated;
grant select, insert, update on table public.maima_telefonia_operadores to authenticated;

drop policy if exists "MAIMA coordenacao gere mapeamentos telefonia" on public.maima_telefonia_operadores;
create policy "MAIMA coordenacao gere mapeamentos telefonia"
  on public.maima_telefonia_operadores
  for all to authenticated
  using (public.maima_current_role() = any (array['admin','coordenador']::text[]))
  with check (public.maima_current_role() = any (array['admin','coordenador']::text[]));

create or replace function public.maima_associar_evento_telefonia(p_evento_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_evento public.maima_telefonia_eventos%rowtype;
  v_lead_id uuid;
  v_lead_operador_id uuid;
  v_match_count integer;
  v_mapped_operator uuid;
begin
  select * into v_evento
  from public.maima_telefonia_eventos
  where id = p_evento_id;

  if not found then return; end if;

  if v_evento.telefone is null or regexp_replace(v_evento.telefone, '[^0-9]', '', 'g') = '' then
    update public.maima_telefonia_eventos
      set associacao_estado = 'sem_correspondencia', atualizado_em = now()
      where id = p_evento_id;
    return;
  end if;

  select count(*), (array_agg(l.id))[1], (array_agg(l.operador_id))[1]
    into v_match_count, v_lead_id, v_lead_operador_id
  from public.maima_leads l
  where l.telefone is not null
    and regexp_replace(l.telefone, '[^0-9]', '', 'g') =
        regexp_replace(v_evento.telefone, '[^0-9]', '', 'g');

  select m.operador_id into v_mapped_operator
  from public.maima_telefonia_operadores m
  where m.fornecedor = v_evento.fornecedor
    and m.operador_externo_ref = v_evento.operador_externo_ref
    and m.ativo = true
  limit 1;

  if v_match_count = 1 then
    update public.maima_telefonia_eventos
      set lead_id = v_lead_id,
          operador_id = coalesce(v_mapped_operator, v_lead_operador_id),
          associacao_estado = 'associada',
          associado_em = now(),
          atualizado_em = now()
      where id = p_evento_id;
  elsif v_match_count > 1 then
    update public.maima_telefonia_eventos
      set lead_id = null, operador_id = v_mapped_operator,
          associacao_estado = 'ambigua', atualizado_em = now()
      where id = p_evento_id;
  else
    update public.maima_telefonia_eventos
      set lead_id = null, operador_id = v_mapped_operator,
          associacao_estado = 'sem_correspondencia', atualizado_em = now()
      where id = p_evento_id;
  end if;
end;
$$;

revoke all on function public.maima_associar_evento_telefonia(uuid) from public, anon, authenticated;
grant execute on function public.maima_associar_evento_telefonia(uuid) to service_role;

comment on table public.maima_telefonia_operadores is
  'Mapeamento explícito entre referências de agentes do fornecedor telefónico e operadores MAIMA.';
