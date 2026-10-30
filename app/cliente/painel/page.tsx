"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Pedido = {
  id: number;
  nome: string;
  empresa: string | null;
  area_interesse: string | null;
  mensagem: string;
  estado: string;
  criado_em: string;
};

const estadoClasses: Record<string, string> = {
  Novo: "bg-blue-50 text-blue-700",
  "Em análise": "bg-amber-50 text-amber-700",
  "Em andamento": "bg-violet-50 text-violet-700",
  Concluído: "bg-emerald-50 text-emerald-700",
  Cancelado: "bg-slate-100 text-slate-600",
};

export default function ClientePainelPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      router.replace("/login");
      return;
    }

    setEmail(user.email ?? "");
    const { data, error: queryError } = await supabase
      .from("contactos")
      .select("id,nome,empresa,area_interesse,mensagem,estado,criado_em")
      .eq("user_id", user.id)
      .order("criado_em", { ascending: false });

    if (queryError) {
      setError("Não foi possível carregar os seus pedidos. Tente novamente.");
    } else {
      setPedidos((data ?? []) as Pedido[]);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4"><p className="text-sm text-slate-600">A carregar a sua área reservada...</p></main>;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">MAIMA CALL CENTER</p>
            <p className="mt-1 text-lg font-bold text-slate-900">Área do cliente</p>
          </div>
          <button type="button" onClick={handleSignOut} disabled={signingOut} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            {signingOut ? "A sair..." : "Terminar sessão"}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-emerald-700">Bem-vindo</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">O seu espaço</h1>
            <p className="mt-2 text-slate-600">{email}</p>
          </div>
          <button type="button" onClick={() => void loadDashboard()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Actualizar pedidos
          </button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total de pedidos</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{pedidos.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Em tratamento</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{pedidos.filter((p) => !["Concluído", "Cancelado"].includes(p.estado)).length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Concluídos</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{pedidos.filter((p) => p.estado === "Concluído").length}</p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Os meus pedidos</h2>
              <p className="mt-1 text-sm text-slate-500">Consulte aqui o estado dos pedidos associados à sua conta.</p>
            </div>
            <Link href="/#contacto" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">Fazer novo pedido</Link>
          </div>

          {error && <div role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}

          {!error && pedidos.length === 0 && (
            <div className="mt-6 rounded-xl bg-slate-50 px-5 py-10 text-center">
              <h3 className="font-semibold text-slate-900">Ainda não tem pedidos associados</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">Os novos pedidos enviados enquanto estiver com sessão iniciada aparecerão automaticamente nesta área.</p>
              <Link href="/#contacto" className="mt-5 inline-flex rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Contactar a MAIMA</Link>
            </div>
          )}

          {pedidos.length > 0 && (
            <div className="mt-6 space-y-4">
              {pedidos.map((pedido) => (
                <article key={pedido.id} className="rounded-xl border border-slate-200 p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs text-slate-500">Pedido #{pedido.id} · {formatDate(pedido.criado_em)}</p>
                      <h3 className="mt-2 font-semibold text-slate-900">{pedido.area_interesse || "Pedido de contacto"}</h3>
                      {pedido.empresa && <p className="mt-1 text-sm text-slate-600">{pedido.empresa}</p>}
                    </div>
                    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${estadoClasses[pedido.estado] ?? "bg-slate-100 text-slate-700"}`}>{pedido.estado}</span>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{pedido.mensagem}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
