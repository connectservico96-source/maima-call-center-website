
create table if not exists public.maima_despesas (
  id uuid primary key default gen_random_uuid(),
  campanha_id uuid references public.maima_campanhas(id) on delete set null,
  data_despesa date not null default current_date,
  categoria text not null check (char_length(btrim(categoria)) between 2 and 80),
  descricao text not null check (char_length(btrim(descricao)) between 2 and 500),
  valor numeric(14,2) not null check (valor > 0),
  moeda text not null default 'EUR' check (moeda ~ '^[A-Z]{3}$'),
  estado text not null default 'ativa' check (estado in ('ativa','anulada')),
  motivo_anulacao text,
  criado_por uuid not null references auth.users(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint maima_despesas_anulacao_check
    check (estado <> 'anulada' or char_length(btrim(coalesce(motivo_anulacao,''))) >= 3)
);

comment on table public.maima_despesas is
  'Registo interno de despesas operacionais MAIMA; acesso restrito a admin e coordenador.';
comment on column public.maima_despesas.campanha_id is
  'Campanha a que a despesa pode ser atribuída; NULL representa despesa geral não alocada.';
comment on column public.maima_despesas.estado is
  'Despesas anuladas permanecem no histórico e não entram nos relatórios de custo.';

create index if not exists maima_despesas_data_estado_idx
  on public.maima_despesas (data_despesa, estado);
create index if not exists maima_despesas_campanha_data_idx
  on public.maima_despesas (campanha_id, data_despesa)
  where campanha_id is not null;

alter table public.maima_despesas enable row level security;

revoke all privileges on table public.maima_despesas from anon, authenticated, public;
grant select, insert on table public.maima_despesas to authenticated;
grant update (estado, motivo_anulacao, atualizado_em)
  on table public.maima_despesas to authenticated;

drop policy if exists "MAIMA coordenacao consulta despesas" on public.maima_despesas;
drop policy if exists "MAIMA coordenacao regista despesas" on public.maima_despesas;
drop policy if exists "MAIMA coordenacao atualiza despesas" on public.maima_despesas;

create policy "MAIMA coordenacao consulta despesas"
  on public.maima_despesas for select to authenticated
  using (public.maima_current_role() = any (array['admin','coordenador']::text[]));

create policy "MAIMA coordenacao regista despesas"
  on public.maima_despesas for insert to authenticated
  with check (
    public.maima_current_role() = any (array['admin','coordenador']::text[])
    and criado_por = (select auth.uid())
  );

create policy "MAIMA coordenacao atualiza despesas"
  on public.maima_despesas for update to authenticated
  using (public.maima_current_role() = any (array['admin','coordenador']::text[]))
  with check (public.maima_current_role() = any (array['admin','coordenador']::text[]));

create or replace function public.maima_proteger_despesa()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if old.estado <> 'ativa' then
    raise exception 'Uma despesa anulada não pode ser alterada novamente.';
  end if;
  if new.id is distinct from old.id
    or new.campanha_id is distinct from old.campanha_id
    or new.data_despesa is distinct from old.data_despesa
    or new.categoria is distinct from old.categoria
    or new.descricao is distinct from old.descricao
    or new.valor is distinct from old.valor
    or new.moeda is distinct from old.moeda
    or new.criado_por is distinct from old.criado_por
    or new.criado_em is distinct from old.criado_em then
    raise exception 'Os dados originais da despesa são imutáveis. Para corrigir, anule o lançamento e registe outro.';
  end if;
  if new.estado <> 'anulada' then
    raise exception 'A única alteração permitida é anular o lançamento.';
  end if;
  if char_length(btrim(coalesce(new.motivo_anulacao,''))) < 3 then
    raise exception 'Indique o motivo da anulação.';
  end if;
  new.atualizado_em = now();
  return new;
end;
$function$;

drop trigger if exists maima_despesas_proteger_update on public.maima_despesas;
create trigger maima_despesas_proteger_update
  before update on public.maima_despesas
  for each row execute function public.maima_proteger_despesa();
