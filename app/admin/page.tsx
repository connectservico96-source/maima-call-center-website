"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ComprovativosAdmin from "./comprovativos";

const ADMIN_EMAIL = "connectservico96@gmail.com";
const ESTADOS = ["Novo", "Em análise", "Em andamento", "Concluído", "Cancelado"];
const PAGAMENTOS = ["Pendente", "Pago", "Atrasado", "Cancelado"];

type Pedido = {
  id: number; nome: string; empresa: string | null; email: string | null;
  telefone: string | null; area_interesse: string | null; mensagem: string;
  estado: string; notas_internas: string | null; criado_em: string; user_id: string | null;
};
type Fatura = {
  id: number; user_id: string; referencia: string; valor: number;
  moeda: string; estado_pagamento: string; data_emissao: string; data_vencimento: string | null;
};
type Cliente = { user_id: string; nome: string; email: string };

export default function AdminPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [saving, setSaving] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [newOrderAlert, setNewOrderAlert] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const [invoiceClient, setInvoiceClient] = useState("");
  const [invoiceReference, setInvoiceReference] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceCurrency, setInvoiceCurrency] = useState("AOA");
  const [invoiceDue, setInvoiceDue] = useState("");
  const [invoiceSaving, setInvoiceSaving] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  const [invoiceNotice, setInvoiceNotice] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("Todas");
  const seenIds = useRef<Set<number> | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { router.replace("/login"); return; }
    if ((user.email ?? "").toLowerCase() !== ADMIN_EMAIL) { router.replace("/cliente/painel"); return; }
    setEmail(user.email ?? "");
    const [ordersResult, invoicesResult] = await Promise.all([
      supabase.from("contactos").select("id,nome,empresa,email,telefone,area_interesse,mensagem,estado,notas_internas,criado_em,user_id").order("criado_em", { ascending: false }),
      supabase.from("faturas").select("id,user_id,referencia,valor,moeda,estado_pagamento,data_emissao,data_vencimento").order("data_emissao", { ascending: false }),
    ]);
    if (ordersResult.error) setError("Não foi possível carregar os pedidos. " + ordersResult.error.message);
    else {
      const rows = (ordersResult.data ?? []) as Pedido[];
      setPedidos(rows); seenIds.current = new Set(rows.map(p => p.id));
      const unique = new Map<string, Cliente>();
      rows.forEach(p => { if (p.user_id && p.email) unique.set(p.user_id, { user_id: p.user_id, nome: p.nome, email: p.email }); });
      setClientes(Array.from(unique.values()));
    }
    if (invoicesResult.error) setInvoiceError("Não foi possível carregar as facturas. " + invoicesResult.error.message);
    else setFaturas((invoicesResult.data ?? []) as Fatura[]);
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setNotificationPermission("Notification" in window ? window.Notification.permission : "unsupported");
  }, []);
  useEffect(() => {
    if (loading) return;
    const timer = window.setInterval(async () => {
      const supabase = createClient();
      const { data, error: queryError } = await supabase.from("contactos")
        .select("id,nome,empresa,email,telefone,area_interesse,mensagem,estado,notas_internas,criado_em,user_id")
        .order("criado_em", { ascending: false });
      if (queryError || !data) return;
      const rows = data as Pedido[];
      const fresh = seenIds.current ? rows.filter(p => !seenIds.current!.has(p.id)) : [];
      if (fresh.length) {
        const newest = fresh[0];
        setNewOrderAlert("Novo pedido recebido: #" + newest.id + " — " + newest.nome);
        if ("Notification" in window && window.Notification.permission === "granted")
          new window.Notification("Novo pedido — MAIMA CALL CENTER", { body: "Pedido #" + newest.id + " recebido de " + newest.nome + "." });
      }
      seenIds.current = new Set(rows.map(p => p.id)); setPedidos(rows);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [loading]);

  async function enableNotifications() {
    if (!("Notification" in window)) { setNotificationPermission("unsupported"); return; }
    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") setNewOrderAlert("Notificações activadas neste navegador.");
  }
  async function save(pedido: Pedido) {
    setSaving(pedido.id); setNotice(""); setError("");
    const { error: updateError } = await createClient().from("contactos")
      .update({ estado: pedido.estado, notas_internas: pedido.notas_internas }).eq("id", pedido.id);
    if (updateError) setError("Não foi possível guardar as alterações: " + updateError.message);
    else setNotice("Pedido #" + pedido.id + " actualizado com sucesso.");
    setSaving(null);
  }
  async function createInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setInvoiceSaving(true); setInvoiceError(""); setInvoiceNotice("");
    if (!invoiceClient) { setInvoiceError("Seleccione um cliente com conta registada."); setInvoiceSaving(false); return; }
    const amount = Number(invoiceAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) { setInvoiceError("Indique um valor superior a zero."); setInvoiceSaving(false); return; }
    const { data, error: insertError } = await createClient().from("faturas").insert({
      user_id: invoiceClient, referencia: invoiceReference.trim(), valor: amount,
      moeda: invoiceCurrency, estado_pagamento: "Pendente",
      data_vencimento: invoiceDue || null,
    }).select("id,user_id,referencia,valor,moeda,estado_pagamento,data_emissao,data_vencimento").single();
    if (insertError) setInvoiceError("Não foi possível criar a factura: " + insertError.message);
    else {
      setFaturas(old => [data as Fatura, ...old]);
      setInvoiceNotice("Factura " + data.referencia + " criada com sucesso.");
      setInvoiceReference(""); setInvoiceAmount(""); setInvoiceDue("");
    }
    setInvoiceSaving(false);
  }
  async function updateInvoiceStatus(id: number, status: string) {
    setInvoiceError(""); setInvoiceNotice("");
    const { error: updateError } = await createClient().from("faturas").update({ estado_pagamento: status }).eq("id", id);
    if (updateError) setInvoiceError("Não foi possível actualizar a factura: " + updateError.message);
    else { setFaturas(old => old.map(f => f.id === id ? { ...f, estado_pagamento: status } : f)); setInvoiceNotice("Estado da factura actualizado."); }
  }
  const filtered = useMemo(() => pedidos.filter(p => {
    const term = search.trim().toLowerCase();
    const matches = !term || [p.nome,p.empresa,p.email,p.telefone,p.area_interesse].some(v => (v ?? "").toLowerCase().includes(term));
    return matches && (filter === "Todos" || p.estado === filter);
  }), [pedidos,search,filter]);
  const counts = useMemo(() => Object.fromEntries(ESTADOS.map(s => [s,pedidos.filter(p => p.estado === s).length])) as Record<string,number>, [pedidos]);
  const maxCount = Math.max(1,...ESTADOS.map(s => counts[s] || 0));
  const filteredInvoices = faturas.filter(f => invoiceFilter === "Todas" || f.estado_pagamento === invoiceFilter);
  async function logout() { await createClient().auth.signOut(); router.replace("/login"); router.refresh(); }
  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4"><p className="text-slate-600">A carregar a administração...</p></main>;

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">MAIMA CALL CENTER</p><h1 className="mt-1 text-xl font-bold text-slate-900">Painel administrativo</h1></div>
      <div className="flex items-center gap-3"><span className="hidden text-sm text-slate-500 sm:inline">{email}</span><button onClick={logout} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Terminar sessão</button></div>
    </div></header>
    <section className="mx-auto max-w-7xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-bold text-slate-900">Visão geral</h2><p className="mt-1 text-sm text-slate-600">Acompanhe os pedidos e a actividade comercial num só lugar.</p></div>
        <div className="flex flex-wrap gap-2"><button onClick={enableNotifications} disabled={notificationPermission === "granted" || notificationPermission === "unsupported"} className="rounded-lg border border-emerald-700 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 disabled:opacity-60">{notificationPermission === "granted" ? "Notificações activadas" : notificationPermission === "denied" ? "Notificações bloqueadas" : notificationPermission === "unsupported" ? "Notificações indisponíveis" : "Activar notificações"}</button><button onClick={() => void load()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Actualizar lista</button></div>
      </div>
      {newOrderAlert && <div role="status" className="mt-5 flex justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><span>{newOrderAlert}</span><button onClick={() => setNewOrderAlert("")} className="font-semibold underline">Fechar</button></div>}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">Total de pedidos</p><p className="mt-1 text-3xl font-bold">{pedidos.length}</p></div>{ESTADOS.map(s => <div key={s} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{s}</p><p className="mt-1 text-3xl font-bold">{counts[s]}</p></div>)}</div>
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-bold">Pedidos por estado</h3><p className="mt-1 text-sm text-slate-500">Distribuição actual dos pedidos registados.</p><div className="mt-4 space-y-3">{ESTADOS.map(s => <div key={s} className="grid grid-cols-[105px_1fr_35px] items-center gap-3 text-sm"><span className="text-slate-600">{s}</span><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700" style={{width:(counts[s]/maxCount*100)+"%"}} /></div><span className="text-right font-semibold">{counts[s]}</span></div>)}</div></div>
      <div className="mt-8"><h2 className="text-xl font-bold">Gestão de pedidos</h2><p className="mt-1 text-sm text-slate-600">Consulte, actualize estados e registe notas internas.</p></div>
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar nome, empresa, e-mail..." className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"/><select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>Todos</option>{ESTADOS.map(s=><option key={s}>{s}</option>)}</select></div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <p className="mt-4 text-sm text-slate-500">{filtered.length} pedido(s) apresentado(s)</p>
      <div className="mt-3 space-y-4">{filtered.map(p=><article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-slate-500">Pedido #{p.id} · {new Intl.DateTimeFormat("pt-PT",{dateStyle:"medium",timeStyle:"short"}).format(new Date(p.criado_em))}</p><h3 className="mt-1 text-lg font-bold">{p.nome}</h3><p className="text-sm text-slate-600">{p.empresa || "Empresa não indicada"} · {p.area_interesse || "Área não indicada"}</p><p className="mt-1 text-sm text-slate-600">{p.email || "Sem e-mail"} {p.telefone ? "· "+p.telefone : ""}</p></div><select aria-label={"Estado do pedido "+p.id} value={p.estado} onChange={e=>setPedidos(old=>old.map(x=>x.id===p.id?{...x,estado:e.target.value}:x))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">{ESTADOS.map(s=><option key={s}>{s}</option>)}</select></div><div className="mt-4 rounded-lg bg-slate-50 p-4"><p className="text-xs font-semibold uppercase text-slate-500">Mensagem do cliente</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{p.mensagem}</p></div><label className="mt-4 block text-sm font-semibold">Notas internas (não visíveis ao cliente)</label><textarea value={p.notas_internas ?? ""} onChange={e=>setPedidos(old=>old.map(x=>x.id===p.id?{...x,notas_internas:e.target.value}:x))} rows={2} placeholder="Adicionar observações para a equipa..." className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"/><div className="mt-3 flex justify-end"><button disabled={saving===p.id} onClick={()=>void save(p)} className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving===p.id?"A guardar...":"Guardar alterações"}</button></div></article>)}{filtered.length===0&&<div className="rounded-xl border border-dashed bg-white p-10 text-center text-sm text-slate-500">Não foram encontrados pedidos com estes critérios.</div>}</div>

      <section id="facturacao" className="mt-12 border-t border-slate-200 pt-8">
        <h2 className="text-2xl font-bold text-slate-900">Facturação</h2><p className="mt-1 text-sm text-slate-600">Crie facturas para clientes com conta registada e acompanhe os pagamentos.</p>
        <form onSubmit={createInvoice} className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-semibold">Cliente<select required value={invoiceClient} onChange={e=>setInvoiceClient(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"><option value="">Seleccionar cliente</option>{clientes.map(c=><option key={c.user_id} value={c.user_id}>{c.nome} — {c.email}</option>)}</select></label>
          <label className="text-sm font-semibold">Referência<input required value={invoiceReference} onChange={e=>setInvoiceReference(e.target.value)} placeholder="Ex.: MAIMA-2026-001" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"/></label>
          <label className="text-sm font-semibold">Valor<input required type="number" min="0.01" step="0.01" value={invoiceAmount} onChange={e=>setInvoiceAmount(e.target.value)} placeholder="0,00" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"/></label>
          <label className="text-sm font-semibold">Moeda<select value={invoiceCurrency} onChange={e=>setInvoiceCurrency(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"><option value="AOA">AOA — Kwanza</option><option value="USD">USD — Dólar</option><option value="EUR">EUR — Euro</option></select></label>
          <label className="text-sm font-semibold">Data de vencimento<input type="date" value={invoiceDue} onChange={e=>setInvoiceDue(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"/></label>
          <div className="flex items-end"><button disabled={invoiceSaving || clientes.length===0} className="w-full rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{invoiceSaving?"A criar factura...":"Criar factura"}</button></div>
          {clientes.length===0&&<p className="text-sm text-amber-700 sm:col-span-2 lg:col-span-3">Ainda não há clientes com pedidos associados a uma conta. O cliente precisa de ter iniciado sessão ao enviar o pedido.</p>}
          {invoiceError&&<p role="alert" className="text-sm text-red-700 sm:col-span-2 lg:col-span-3">{invoiceError}</p>}{invoiceNotice&&<p role="status" className="text-sm text-emerald-700 sm:col-span-2 lg:col-span-3">{invoiceNotice}</p>}
        </form>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold">Facturas emitidas ({faturas.length})</h3><select value={invoiceFilter} onChange={e=>setInvoiceFilter(e.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option>Todas</option>{PAGAMENTOS.map(s=><option key={s}>{s}</option>)}</select></div>
        <div className="mt-3 space-y-3">{filteredInvoices.map(f=><article key={f.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"><div><p className="font-semibold">{f.referencia}</p><p className="mt-1 text-sm text-slate-600">{clientes.find(c=>c.user_id===f.user_id)?.nome || "Cliente"} · {Number(f.valor).toLocaleString("pt-PT",{minimumFractionDigits:2,maximumFractionDigits:2})} {f.moeda}</p><p className="mt-1 text-xs text-slate-500">Emitida: {f.data_emissao} · Vencimento: {f.data_vencimento || "Não definido"}</p></div><select aria-label={"Estado da factura "+f.referencia} value={f.estado_pagamento} onChange={e=>void updateInvoiceStatus(f.id,e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">{PAGAMENTOS.map(s=><option key={s}>{s}</option>)}</select></article>)}{filteredInvoices.length===0&&<p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Ainda não existem facturas neste filtro.</p>}</div>
      </section>
      <ComprovativosAdmin />
      <p className="mt-8 text-center text-xs text-slate-400">A lista verifica automaticamente novos pedidos a cada 30 segundos enquanto esta página estiver aberta.</p>
    </section>
  </main>;
}
