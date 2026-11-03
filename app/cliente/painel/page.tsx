"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ComprovativosCliente from "./comprovativos";

type Pedido = { id:number; nome:string; empresa:string|null; area_interesse:string|null; mensagem:string; estado:string; criado_em:string };
type Fatura = { id:number; referencia:string; valor:number; moeda:string; estado_pagamento:string; data_emissao:string; data_vencimento:string|null };
const estadoClasses: Record<string,string> = {
  Novo:"bg-blue-50 text-blue-700", "Em análise":"bg-amber-50 text-amber-700",
  "Em andamento":"bg-violet-50 text-violet-700", Concluído:"bg-emerald-50 text-emerald-700",
  Cancelado:"bg-slate-100 text-slate-600",
};
const pagamentoClasses: Record<string,string> = {
  Pendente:"bg-amber-50 text-amber-800", Pago:"bg-emerald-50 text-emerald-800",
  Atrasado:"bg-red-50 text-red-700", Cancelado:"bg-slate-100 text-slate-600",
};
export default function ClientePainelPage() {
  const router=useRouter();
  const [email,setEmail]=useState("");
  const [pedidos,setPedidos]=useState<Pedido[]>([]);
  const [faturas,setFaturas]=useState<Fatura[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [invoiceError,setInvoiceError]=useState("");
  const [signingOut,setSigningOut]=useState(false);

  const refreshData=useCallback(async (showLoading=false)=>{
    if(showLoading) setLoading(true);
    const supabase=createClient();
    const {data:{user},error:authError}=await supabase.auth.getUser();
    if(authError||!user){router.replace("/login");return;}
    setEmail(user.email??"");
    const [ordersResult,invoicesResult]=await Promise.all([
      supabase.from("contactos").select("id,nome,empresa,area_interesse,mensagem,estado,criado_em").eq("user_id",user.id).order("criado_em",{ascending:false}),
      supabase.from("faturas").select("id,referencia,valor,moeda,estado_pagamento,data_emissao,data_vencimento").eq("user_id",user.id).order("data_emissao",{ascending:false}),
    ]);
    if(ordersResult.error) setError("Não foi possível carregar os seus pedidos. Tente novamente.");
    else {setPedidos((ordersResult.data??[]) as Pedido[]);setError("");}
    if(invoicesResult.error) setInvoiceError("Não foi possível carregar as suas facturas.");
    else {setFaturas((invoicesResult.data??[]) as Fatura[]);setInvoiceError("");}
    setLoading(false);
  },[router]);

  useEffect(()=>{void refreshData(true);},[refreshData]);
  useEffect(()=>{const timer=window.setInterval(()=>{void refreshData();},30000);return()=>window.clearInterval(timer);},[refreshData]);
  async function handleSignOut(){setSigningOut(true);await createClient().auth.signOut();router.replace("/login");router.refresh();}
  const formatDate=(v:string)=>new Intl.DateTimeFormat("pt-PT",{dateStyle:"medium"}).format(new Date(v+"T00:00:00"));
  if(loading)return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4"><p className="text-sm text-slate-600">A carregar a sua área reservada...</p></main>;

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">MAIMA CALL CENTER</p><p className="mt-1 text-lg font-bold text-slate-900">Área do cliente</p></div><button onClick={handleSignOut} disabled={signingOut} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">{signingOut?"A sair...":"Terminar sessão"}</button></div></header>
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-emerald-700">Bem-vindo</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">O seu espaço</h1><p className="mt-2 text-slate-600">{email}</p></div><button onClick={()=>void refreshData()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Actualizar informação</button></div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Total de pedidos</p><p className="mt-2 text-3xl font-bold">{pedidos.length}</p></div><div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Em tratamento</p><p className="mt-2 text-3xl font-bold">{pedidos.filter(p=>!["Concluído","Cancelado"].includes(p.estado)).length}</p></div><div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Concluídos</p><p className="mt-2 text-3xl font-bold">{pedidos.filter(p=>p.estado==="Concluído").length}</p></div></div>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><div><h2 className="text-xl font-bold">Os meus pedidos</h2><p className="mt-1 text-sm text-slate-500">Consulte aqui o estado dos pedidos associados à sua conta.</p></div><Link href="/#contacto" className="text-sm font-semibold text-emerald-700">Fazer novo pedido</Link></div>
        {error&&<div role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {!error&&pedidos.length===0&&<div className="mt-6 rounded-xl bg-slate-50 px-5 py-10 text-center"><h3 className="font-semibold">Ainda não tem pedidos associados</h3><p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">Os novos pedidos enviados enquanto estiver com sessão iniciada aparecerão automaticamente nesta área.</p><Link href="/#contacto" className="mt-5 inline-flex rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white">Contactar a MAIMA</Link></div>}
        {pedidos.length>0&&<div className="mt-6 space-y-4">{pedidos.map(p=><article key={p.id} className="rounded-xl border border-slate-200 p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-xs text-slate-500">Pedido #{p.id} · {new Intl.DateTimeFormat("pt-PT",{dateStyle:"medium",timeStyle:"short"}).format(new Date(p.criado_em))}</p><h3 className="mt-2 font-semibold">{p.area_interesse||"Pedido de contacto"}</h3>{p.empresa&&<p className="mt-1 text-sm text-slate-600">{p.empresa}</p>}</div><span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${estadoClasses[p.estado]??"bg-slate-100 text-slate-700"}`}>{p.estado}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{p.mensagem}</p></article>)}</div>}
      </div>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><div><h2 className="text-xl font-bold">As minhas facturas</h2><p className="mt-1 text-sm text-slate-500">Consulte os valores, datas de vencimento e situação dos pagamentos.</p></div>
        {invoiceError&&<p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{invoiceError}</p>}
        {!invoiceError&&faturas.length===0&&<div className="mt-6 rounded-xl bg-slate-50 p-8 text-center"><h3 className="font-semibold">Ainda não existem facturas</h3><p className="mt-2 text-sm text-slate-600">Quando a MAIMA emitir uma factura associada à sua conta, ela aparecerá aqui.</p></div>}
        {faturas.length>0&&<div className="mt-6 space-y-3">{faturas.map(f=><article key={f.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-5"><div><p className="font-semibold">{f.referencia}</p><p className="mt-1 text-lg font-bold text-slate-900">{Number(f.valor).toLocaleString("pt-PT",{minimumFractionDigits:2,maximumFractionDigits:2})} {f.moeda}</p><p className="mt-1 text-xs text-slate-500">Emissão: {formatDate(f.data_emissao)} · Vencimento: {f.data_vencimento?formatDate(f.data_vencimento):"Não definido"}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${pagamentoClasses[f.estado_pagamento]??"bg-slate-100 text-slate-700"}`}>{f.estado_pagamento}</span></article>)}</div>}
      </section>
      <ComprovativosCliente />
    </section>
  </main>;
}
