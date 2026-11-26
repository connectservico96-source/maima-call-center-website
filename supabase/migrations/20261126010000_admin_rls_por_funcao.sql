-- Alinha as permissões administrativas das áreas financeiras e de ficheiros
-- com o papel MAIMA, em vez de depender do e-mail de uma única conta.
-- A função public.maima_current_role() continua a aplicar a regra de bootstrap
-- do administrador principal e reconhece também perfis ativos com role='admin'.

-- Pedidos: permitir que qualquer administrador MAIMA autorizado os atualize.
drop policy if exists "MAIMA admin update contactos" on public.contactos;
create policy "MAIMA admin update contactos"
on public.contactos
for update
to authenticated
using ((select public.maima_current_role()) = 'admin')
with check ((select public.maima_current_role()) = 'admin');

-- Faturas: gestão administrativa por papel, mantendo os clientes apenas
-- com acesso de leitura às próprias faturas através da política existente.
drop policy if exists "MAIMA admin insert faturas" on public.faturas;
create policy "MAIMA admin insert faturas"
on public.faturas
for insert
to authenticated
with check ((select public.maima_current_role()) = 'admin');

drop policy if exists "MAIMA admin update faturas" on public.faturas;
create policy "MAIMA admin update faturas"
on public.faturas
for update
to authenticated
using ((select public.maima_current_role()) = 'admin')
with check ((select public.maima_current_role()) = 'admin');

-- Comprovativos: todos os administradores ativos podem consultar e rever.
-- A política de INSERT dos clientes permanece inalterada e limitada
-- à própria fatura pendente.
drop policy if exists "Cliente consulta os seus comprovativos ou admin consulta todos"
on public.comprovativos_pagamento;
create policy "Cliente consulta os seus comprovativos ou admin consulta todos"
on public.comprovativos_pagamento
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.maima_current_role()) = 'admin'
);

drop policy if exists "Admin actualiza revisão dos comprovativos"
on public.comprovativos_pagamento;
create policy "Admin actualiza revisão dos comprovativos"
on public.comprovativos_pagamento
for update
to authenticated
using ((select public.maima_current_role()) = 'admin')
with check ((select public.maima_current_role()) = 'admin');

-- Storage privado: o titular continua a consultar apenas a sua pasta;
-- qualquer administrador MAIMA ativo pode consultar os comprovativos
-- para executar a revisão administrativa.
drop policy if exists "Cliente ou admin consulta comprovativos"
on storage.objects;
create policy "Cliente ou admin consulta comprovativos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'comprovativos-pagamento'
  and (
    (storage.foldername(name))[1] = (select (auth.uid())::text)
    or (select public.maima_current_role()) = 'admin'
  )
);
