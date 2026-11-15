"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ComprovativosCliente from "./comprovativos";
import { jsPDF } from "jspdf";

type Pedido = { id:number; nome:string; empresa:string|null; area_interesse:string|null; mensagem:string; estado:string; criado_em:string };
type Fatura = { id:number; referencia:string; valor:number; moeda:string; estado_pagamento:string; data_emissao:string; data_vencimento:string|null };
type Campanha = { id:string; codigo:string; nome:string; setor:string; mercado:string; estado:string; data_inicio:string|null; data_fim:string|null };
type Contrato = { id:string; campanha_id:string; referencia_externa:string|null; estado:string; submetido_em:string; validado_em:string|null };
type ContaForm = { clienteId:string; nome:string; nome_empresa:string; nif:string; contacto_nome:string; telefone:string; endereco:string };
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
  const [campanhas,setCampanhas]=useState<Campanha[]>([]);
  const [contratos,setContratos]=useState<Contrato[]>([]);
  const [conta,setConta]=useState<ContaForm>({clienteId:"",nome:"",nome_empresa:"",nif:"",contacto_nome:"",telefone:"",endereco:""});
  const [contaSaving,setContaSaving]=useState(false);
  const [contaError,setContaError]=useState("");
  const [contaNotice,setContaNotice]=useState("");
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
    if(showLoading){
      const {data:profile}=await supabase.from("maima_perfis").select("nome,cliente_id").eq("user_id",user.id).maybeSingle();
      if(profile?.cliente_id){
        const {data:company}=await supabase.from("maima_clientes").select("id,nome_empresa,nif,contacto_nome,telefone,endereco").eq("id",profile.cliente_id).maybeSingle();
        setConta({
          clienteId:profile.cliente_id,
          nome:profile.nome||"",
          nome_empresa:company?.nome_empresa||"",
          nif:company?.nif||"",
          contacto_nome:company?.contacto_nome||profile.nome||"",
          telefone:company?.telefone||"",
          endereco:company?.endereco||"",
        });
      }
    }
    const [ordersResult,invoicesResult,campaignsResult,contractsResult]=await Promise.all([
      supabase.from("contactos").select("id,nome,empresa,area_interesse,mensagem,estado,criado_em").eq("user_id",user.id).order("criado_em",{ascending:false}),
      supabase.from("faturas").select("id,referencia,valor,moeda,estado_pagamento,data_emissao,data_vencimento").eq("user_id",user.id).order("data_emissao",{ascending:false}),
      supabase.rpc("maima_portal_get_campanhas"),
      supabase.rpc("maima_portal_get_contratos"),
    ]);
    if(ordersResult.error) setError("Não foi possível carregar os seus pedidos. Tente novamente.");
    else {setPedidos((ordersResult.data??[]) as Pedido[]);setError("");}
    if(invoicesResult.error) setInvoiceError("Não foi possível carregar as suas facturas.");
    else {setFaturas((invoicesResult.data??[]) as Fatura[]);setInvoiceError("");}
    if(campaignsResult.error) setError((v)=>v||"Não foi possível carregar as campanhas.");
    else setCampanhas((campaignsResult.data??[]) as Campanha[]);
    if(contractsResult.error) setError((v)=>v||"Não foi possível carregar os contratos.");
    else setContratos((contractsResult.data??[]) as Contrato[]);
    setLoading(false);
  },[router]);

  useEffect(()=>{void refreshData(true);},[refreshData]);
  useEffect(()=>{const timer=window.setInterval(()=>{void refreshData();},30000);return()=>window.clearInterval(timer);},[refreshData]);
  async function saveAccount(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setContaSaving(true);setContaError("");setContaNotice("");
    try{
      const db=createClient();
      const {data:{user},error:authError}=await db.auth.getUser();
      if(authError||!user||!conta.clienteId)throw new Error("Não foi possível confirmar a sua conta empresarial. Volte a iniciar sessão ou contacte a MAIMA.");
      const profileUpdate=await db.from("maima_perfis").update({nome:conta.nome.trim()}).eq("user_id",user.id);
      if(profileUpdate.error)throw profileUpdate.error;
      const companyUpdate=await db.from("maima_clientes").update({
        nome_empresa:conta.nome_empresa.trim(),
        nif:conta.nif.trim()||null,
        contacto_nome:conta.contacto_nome.trim()||conta.nome.trim(),
        telefone:conta.telefone.trim()||null,
        endereco:conta.endereco.trim()||null,
      }).eq("id",conta.clienteId);
      if(companyUpdate.error)throw companyUpdate.error;
      setContaNotice("Dados da conta atualizados com sucesso.");
    }catch(err){setContaError(err instanceof Error?err.message:"Não foi possível guardar os dados da conta.");}
    finally{setContaSaving(false);}
  }

  async function handleSignOut(){setSigningOut(true);await createClient().auth.signOut();router.replace("/login");router.refresh();}
  const formatDate=(v:string)=>new Intl.DateTimeFormat("pt-PT",{dateStyle:"medium"}).format(new Date(v+"T00:00:00"));
  function downloadInvoice(f:Fatura){
    const pdf=new jsPDF();
    pdf.setFontSize(18); pdf.text("MAIMA CALL CENTER",20,22);
    pdf.setFontSize(14); pdf.text("FACTURA",20,38);
    pdf.setFontSize(11); pdf.text("Referência: "+f.referencia,20,52);
    pdf.text("Data de emissão: "+formatDate(f.data_emissao),20,62);
    pdf.text("Data de vencimento: "+(f.data_vencimento?formatDate(f.data_vencimento):"Não definido"),20,72);
    pdf.text("Estado: "+f.estado_pagamento,20,82);
    pdf.text("Descrição: Serviços MAIMA CALL CENTER",20,102);
    pdf.text("Valor total: "+Number(f.valor).toLocaleString("pt-PT",{minimumFractionDigits:2,maximumFractionDigits:2})+" "+f.moeda,20,120);
    pdf.setFontSize(9); pdf.text("Documento gerado pela Área de Cliente MAIMA CALL CENTER.",20,270);
    pdf.save("Factura-"+f.referencia.replace(/[^a-zA-Z0-9_-]/g,"-")+".pdf");
  }
  if(loading)return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4"><p className="text-sm text-slate-600">A carregar a sua área reservada...</p></main>;

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">MAIMA CALL CENTER</p><p className="mt-1 text-lg font-bold text-slate-900">Área do cliente</p></div><button onClick={handleSignOut} disabled={signingOut} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">{signingOut?"A sair...":"Terminar sessão"}</button></div></header>
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-medium text-emerald-700">Bem-vindo</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">O seu espaço</h1><p className="mt-2 text-slate-600">{email}</p></div><button onClick={()=>void refreshData()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Actualizar informação</button></div>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div><h2 className="text-xl font-bold">Dados da conta e da empresa</h2><p className="mt-1 text-sm text-slate-500">Mantenha atualizados os dados de contacto da sua empresa. O e-mail de acesso é gerido separadamente.</p></div>
        <form onSubmit={saveAccount} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">O seu nome
            <input required maxLength={150} value={conta.nome} onChange={e=>setConta(v=>({...v,nome:e.target.value}))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"/>
          </label>
          <label className="text-sm font-semibold text-slate-700">Nome da empresa
            <input required maxLength={200} value={conta.nome_empresa} onChange={e=>setConta(v=>({...v,nome_empresa:e.target.value}))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"/>
          </label>
          <label className="text-sm font-semibold text-slate-700">NIF (opcional)
            <input maxLength={60} value={conta.nif} onChange={e=>setConta(v=>({...v,nif:e.target.value}))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"/>
          </label>
          <label className="text-sm font-semibold text-slate-700">Pessoa de contacto
            <input maxLength={150} value={conta.contacto_nome} onChange={e=>setConta(v=>({...v,contacto_nome:e.target.value}))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"/>
          </label>
          <label className="text-sm font-semibold text-slate-700">Telefone
            <input maxLength={40} value={conta.telefone} onChange={e=>setConta(v=>({...v,telefone:e.target.value}))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"/>
          </label>
          <label className="text-sm font-semibold text-slate-700">Morada
            <input maxLength={250} value={conta.endereco} onChange={e=>setConta(v=>({...v,endereco:e.target.value}))} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal"/>
          </label>
          {contaError&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{contaError}</p>}
          {contaNotice&&<p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 sm:col-span-2">{contaNotice}</p>}
          <div className="sm:col-span-2"><button disabled={contaSaving||!conta.clienteId} className="rounded-lg bg-[#103B70] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{contaSaving?"A guardar...":"Guardar dados da conta"}</button></div>
        </form>
      </section>
      <div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Total de pedidos</p><p className="mt-2 text-3xl font-bold">{pedidos.length}</p></div><div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Em tratamento</p><p className="mt-2 text-3xl font-bold">{pedidos.filter(p=>!["Concluído","Cancelado"].includes(p.estado)).length}</p></div><div className="rounded-xl border border-slate-200 bg-white p-5"><p className="text-sm text-slate-500">Concluídos</p><p className="mt-2 text-3xl font-bold">{pedidos.filter(p=>p.estado==="Concluído").length}</p></div></div>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><div><h2 className="text-xl font-bold">Os meus pedidos</h2><p className="mt-1 text-sm text-slate-500">Consulte aqui o estado dos pedidos associados à sua conta.</p></div><Link href="/#contacto" className="text-sm font-semibold text-emerald-700">Fazer novo pedido</Link></div>
        {error&&<div role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {!error&&pedidos.length===0&&<div className="mt-6 rounded-xl bg-slate-50 px-5 py-10 text-center"><h3 className="font-semibold">Ainda não tem pedidos associados</h3><p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">Os novos pedidos enviados enquanto estiver com sessão iniciada aparecerão automaticamente nesta área.</p><Link href="/#contacto" className="mt-5 inline-flex rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white">Contactar a MAIMA</Link></div>}
        {pedidos.length>0&&<div className="mt-6 space-y-4">{pedidos.map(p=><article key={p.id} className="rounded-xl border border-slate-200 p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-xs text-slate-500">Pedido #{p.id} · {new Intl.DateTimeFormat("pt-PT",{dateStyle:"medium",timeStyle:"short"}).format(new Date(p.criado_em))}</p><h3 className="mt-2 font-semibold">{p.area_interesse||"Pedido de contacto"}</h3>{p.empresa&&<p className="mt-1 text-sm text-slate-600">{p.empresa}</p>}</div><span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${estadoClasses[p.estado]??"bg-slate-100 text-slate-700"}`}>{p.estado}</span></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{p.mensagem}</p></article>)}</div>}
      </div>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"><div><h2 className="text-xl font-bold">As minhas facturas</h2><p className="mt-1 text-sm text-slate-500">Consulte os valores, datas de vencimento e situação dos pagamentos.</p></div>
        {invoiceError&&<p role="alert" className="mt-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{invoiceError}</p>}
        {!invoiceError&&faturas.length===0&&<div className="mt-6 rounded-xl bg-slate-50 p-8 text-center"><h3 className="font-semibold">Ainda não existem facturas</h3><p className="mt-2 text-sm text-slate-600">Quando a MAIMA emitir uma factura associada à sua conta, ela aparecerá aqui.</p></div>}
        {faturas.length>0&&<div className="mt-6 space-y-3">{faturas.map(f=><article key={f.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-5"><div><p className="font-semibold">{f.referencia}</p><p className="mt-1 text-lg font-bold text-slate-900">{Number(f.valor).toLocaleString("pt-PT",{minimumFractionDigits:2,maximumFractionDigits:2})} {f.moeda}</p><p className="mt-1 text-xs text-slate-500">Emissão: {formatDate(f.data_emissao)} · Vencimento: {f.data_vencimento?formatDate(f.data_vencimento):"Não definido"}</p></div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${pagamentoClasses[f.estado_pagamento]??"bg-slate-100 text-slate-700"}`}>{f.estado_pagamento}</span><button onClick={()=>downloadInvoice(f)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">Descarregar factura PDF</button></div></article>)}</div>}
      </section>
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-bold">As minhas campanhas e contratos</h2>
        <p className="mt-1 text-sm text-slate-500">Acompanhe as campanhas e os contratos que a MAIMA disponibilizar para a sua empresa.</p>
        <div className="mt-5 space-y-3">
          {campanhas.map(c=><article key={c.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-slate-500">{c.codigo} · {c.setor} · {c.mercado}</p><h3 className="mt-1 font-semibold">{c.nome}</h3><p className="mt-1 text-xs text-slate-500">{c.data_inicio||"Início não definido"} {c.data_fim?"— "+c.data_fim:""}</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{c.estado}</span></div>
          </article>)}
          {campanhas.length===0&&<p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">Ainda não existem campanhas associadas à sua empresa.</p>}
        </div>
        <h3 className="mt-7 font-bold">Contratos da empresa</h3>
        <div className="mt-3 space-y-3">
          {contratos.map(c=><article key={c.id} className="rounded-xl border border-slate-200 p-4">
            <p className="font-semibold">{c.referencia_externa||"Contrato sem referência externa"}</p>
            <p className="mt-1 text-sm text-slate-600">{campanhas.find(x=>x.id===c.campanha_id)?.nome||"Campanha"} · {new Intl.DateTimeFormat("pt-PT",{dateStyle:"medium",timeStyle:"short"}).format(new Date(c.submetido_em))}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{c.estado}</span>{c.validado_em&&<span className="text-xs text-slate-500">Validado: {new Intl.DateTimeFormat("pt-PT",{dateStyle:"medium"}).format(new Date(c.validado_em))}</span>}</div>
          </article>)}
          {contratos.length===0&&<p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">Ainda não existem contratos disponibilizados para consulta.</p>}
        </div>
      </section>
      <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5"><h2 className="font-bold text-emerald-950">Como enviar o comprovativo?</h2><ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-emerald-900"><li>Descarregue a factura em PDF.</li><li>Faça o pagamento pelos dados indicados pela MAIMA.</li><li>Na secção abaixo, escolha a factura correspondente e seleccione o ficheiro do comprovativo.</li><li>Carregue em “Enviar comprovativo”.</li></ol></div><ComprovativosCliente />
    </section>
  </main>;
}
