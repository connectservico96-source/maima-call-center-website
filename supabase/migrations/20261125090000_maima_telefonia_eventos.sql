create table if not exists public.maima_telefonia_eventos (
  id uuid primary key default gen_random_uuid(),
  fornecedor text not null check (fornecedor ~ '^[a-z0-9][a-z0-9_-]{1,49}$'),
  evento_externo_id text not null,
  chamada_externa_id text not null,
  telefone text,
  direcao text not null check (direcao in ('entrada','saida')),
  chamada_em timestamptz not null,
  duracao_segundos integer check (duracao_segundos is null or duracao_segundos >= 0),
  resultado text,
  operador_externo_ref text,
  estado_integracao text not null default 'recebida'
    check (estado_integracao in ('recebida','em_analise','associada','ignorada','erro')),
  erro_processamento text,
  recebido_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint maima_telefonia_eventos_fornecedor_evento_key unique (fornecedor, evento_externo_id)
);

create index if not exists maima_telefonia_eventos_recebido_idx
  on public.maima_telefonia_eventos (recebido_em desc);
create index if not exists maima_telefonia_eventos_chamada_idx
  on public.maima_telefonia_eventos (chamada_em desc);
create index if not exists maima_telefonia_eventos_estado_idx
  on public.maima_telefonia_eventos (estado_integracao, recebido_em desc);

alter table public.maima_telefonia_eventos enable row level security;

revoke all on table public.maima_telefonia_eventos from anon, authenticated;
grant select, update on table public.maima_telefonia_eventos to authenticated;

drop policy if exists "MAIMA coordenacao consulta eventos telefonia" on public.maima_telefonia_eventos;
create policy "MAIMA coordenacao consulta eventos telefonia"
  on public.maima_telefonia_eventos
  for select to authenticated
  using (public.maima_current_role() = any (array['admin','coordenador']::text[]));

drop policy if exists "MAIMA coordenacao atualiza eventos telefonia" on public.maima_telefonia_eventos;
create policy "MAIMA coordenacao atualiza eventos telefonia"
  on public.maima_telefonia_eventos
  for update to authenticated
  using (public.maima_current_role() = any (array['admin','coordenador']::text[]))
  with check (public.maima_current_role() = any (array['admin','coordenador']::text[]));

comment on table public.maima_telefonia_eventos is
  'Caixa de entrada normalizada de eventos de telefonia externa; sem gravações ou payload bruto.';
