"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ClientePainelPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();

      if (!active) return;

      if (error || !data.user) {
        router.replace("/login");
        return;
      }

      setEmail(data.user.email ?? "");
      setLoading(false);
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-sm text-slate-600">A carregar a sua área reservada...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-emerald-700">
              MAIMA CALL CENTER
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">Área reservada</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {signingOut ? "A sair..." : "Terminar sessão"}
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">Sessão iniciada com sucesso</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Bem-vindo à sua área reservada.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            A sua conta está autenticada. Esta área será o ponto de acesso aos serviços e
            informações disponibilizados pela MAIMA CALL CENTER.
          </p>
          {email && (
            <div className="mt-8 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Conta ligada
              </p>
              <p className="mt-1 font-medium text-slate-900">{email}</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
