"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "connectservico96@gmail.com";
const ESTADOS = ["Novo", "Em análise", "Em andamento", "Concluído", "Cancelado"];

type Pedido = {
  id: number;
  nome: string;
  empresa: string | null;
  email: string | null;
  telefone: string | null;
  area_interesse: string | null;
  mensagem: string;
  estado: string;
  notas_internas: string | null;
  criado_em: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [saving, setSaving] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const [newOrderAlert, setNewOrderAlert] = useState("");
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const seenIds = useRef<Set<number> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      router.replace("/login");
      return;
    }
    if ((user.email ?? "").toLowerCase() !== ADMIN_EMAIL) {
      router.replace("/cliente/painel");
      return;
    }
    setEmail(user.email ?? "");
    const { data, error: queryError } = await supabase
      .from("contactos")
      .select("id,nome,empresa,email,telefone,area_interesse,mensagem,estado,notas_internas,criado_em")
      .order("criado_em", { ascending: false });
    if (queryError) setError("Não foi possível carregar os pedidos. Confirme a ligação e tente novamente.");
    else {
      const rows = (data ?? []) as Pedido[];
      setPedidos(rows);
      seenIds.current = new Set(rows.map((p) => p.id));
    }
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
      const { data, error: queryError } = await supabase
        .from("contactos")
        .select("id,nome,empresa,email,telefone,area_interesse,mensagem,estado,notas_internas,criado_em")
        .order("criado_em", { ascending: false });
      if (queryError || !data) return;
      const rows = data as Pedido[];
      const known = seenIds.current;
      if (known) {
        const fresh = rows.filter((p) => !known.has(p.id));
        if (fresh.length > 0) {
          const newest = fresh[0];
          setNewOrderAlert("Novo pedido recebido: #" + newest.id + " — " + newest.nome);
          if ("Notification" in window && window.Notification.permission === "granted") {
            new window.Notification("Novo pedido — MAIMA CALL CENTER", {
              body: "Pedido #" + newest.id + " recebido de " + newest.nome + ".",
            });
          }
        }
      }
      seenIds.current = new Set(rows.map((p) => p.id));
      setPedidos(rows);
    }, 30000);
    return () => window.clearInterval(timer);
  }, [loading]);

  async function enableNotifications() {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }
    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      setNewOrderAlert("Notificações activadas neste navegador.");
    }
  }

  async function save(pedido: Pedido) {
    setSaving(pedido.id);
    setNotice("");
    setError("");
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("contactos")
      .update({ estado: pedido.estado, notas_internas: pedido.notas_internas })
      .eq("id", pedido.id);
    if (updateError) setError("Não foi possível guardar as alterações. Tente novamente.");
    else setNotice("Pedido #" + pedido.id + " actualizado com sucesso.");
    setSaving(null);
  }

  const filtered = useMemo(() => pedidos.filter((p) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [p.nome, p.empresa, p.email, p.telefone, p.area_interesse]
      .some((v) => (v ?? "").toLowerCase().includes(term));
    return matchesSearch && (filter === "Todos" || p.estado === filter);
  }), [pedidos, search, filter]);

  const counts = useMemo(() => Object.fromEntries(ESTADOS.map((estado) => [
    estado, pedidos.filter((p) => p.estado === estado).length,
  ])) as Record<string, number>, [pedidos]);
  const maxCount = Math.max(1, ...ESTADOS.map((estado) => counts[estado] || 0));

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4"><p className="text-slate-600">A carregar a administração...</p></main>;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">MAIMA CALL CENTER</p><h1 className="mt-1 text-xl font-bold text-slate-900">Painel administrativo</h1></div>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-slate-500 sm:inline">{email}</span><button onClick={logout} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Terminar sessão</button></div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-2xl font-bold text-slate-900">Visão geral</h2><p className="mt-1 text-sm text-slate-600">Acompanhe os pedidos e a actividade comercial num só lugar.</p></div>
          <div className="flex flex-wrap gap-2">
            <button onClick={enableNotifications} disabled={notificationPermission === "granted" || notificationPermission === "unsupported"} className="rounded-lg border border-emerald-700 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 disabled:cursor-default disabled:opacity-60">
              {notificationPermission === "granted" ? "Notificações activadas" : notificationPermission === "denied" ? "Notificações bloqueadas" : notificationPermission === "unsupported" ? "Notificações indisponíveis" : "Activar notificações"}
            </button>
            <button onClick={() => void load()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Actualizar lista</button>
          </div>
        </div>
        {newOrderAlert && <div role="status" className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"><span>{newOrderAlert}</span><button onClick={() => setNewOrderAlert("")} className="font-semibold underline">Fechar</button></div>}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">Total de pedidos</p><p className="mt-1 text-3xl font-bold text-slate-900">{pedidos.length}</p></div>
          {ESTADOS.map((estado) => <div key={estado} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-500">{estado}</p><p className="mt-1 text-3xl font-bold text-slate-900">{counts[estado]}</p></div>)}
        </div>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-bold text-slate-900">Pedidos por estado</h3>
          <p className="mt-1 text-sm text-slate-500">Distribuição actual dos pedidos registados.</p>
          <div className="mt-4 space-y-3">
            {ESTADOS.map((estado) => <div key={estado} className="grid grid-cols-[105px_1fr_35px] items-center gap-3 text-sm">
              <span className="text-slate-600">{estado}</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-700" style={{ width: ((counts[estado] / maxCount) * 100) + "%" }} /></div>
              <span className="text-right font-semibold text-slate-700">{counts[estado]}</span>
            </div>)}
          </div>
        </div>
        <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-xl font-bold text-slate-900">Gestão de pedidos</h2><p className="mt-1 text-sm text-slate-600">Consulte, actualize estados e registe notas internas.</p></div>
        </div>
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar nome, empresa, e-mail..." className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600" />
          <select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option>Todos</option>{ESTADOS.map(s => <option key={s}>{s}</option>)}</select>
        </div>
        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
        <p className="mt-4 text-sm text-slate-500">{filtered.length} pedido(s) apresentado(s)</p>
        <div className="mt-3 space-y-4">
          {filtered.map(p => (
            <article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="text-xs text-slate-500">Pedido #{p.id} · {new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(p.criado_em))}</p><h3 className="mt-1 text-lg font-bold text-slate-900">{p.nome}</h3><p className="text-sm text-slate-600">{p.empresa || "Empresa não indicada"} · {p.area_interesse || "Área não indicada"}</p><p className="mt-1 text-sm text-slate-600">{p.email || "Sem e-mail"} {p.telefone ? "· " + p.telefone : ""}</p></div>
                <select aria-label={"Estado do pedido " + p.id} value={p.estado} onChange={e => setPedidos(old => old.map(x => x.id === p.id ? { ...x, estado: e.target.value } : x))} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold">{ESTADOS.map(s => <option key={s}>{s}</option>)}</select>
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mensagem do cliente</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{p.mensagem}</p></div>
              <label className="mt-4 block text-sm font-semibold text-slate-700">Notas internas (não visíveis ao cliente)</label>
              <textarea value={p.notas_internas ?? ""} onChange={e => setPedidos(old => old.map(x => x.id === p.id ? { ...x, notas_internas: e.target.value } : x))} rows={2} placeholder="Adicionar observações para a equipa..." className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600" />
              <div className="mt-3 flex justify-end"><button disabled={saving === p.id} onClick={() => void save(p)} className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">{saving === p.id ? "A guardar..." : "Guardar alterações"}</button></div>
            </article>
          ))}
          {filtered.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Não foram encontrados pedidos com estes critérios.</div>}
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">A lista verifica automaticamente novos pedidos a cada 30 segundos enquanto esta página estiver aberta.</p>
      </section>
    </main>
  );
}
