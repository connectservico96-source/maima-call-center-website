"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegistarPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: new URL("/login", window.location.origin).toString(),
          data: { nome: nome.trim(), full_name: nome.trim(), empresa: empresa.trim(), telefone: telefone.trim() },
        },
      });
      if (signUpError) throw signUpError;
      if (data.session) {
        router.replace("/cliente/painel");
        router.refresh();
        return;
      }
      setMessage("Conta criada. Verifique o seu e-mail para confirmar o endereço e depois entre na Área de Cliente.");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">MAIMA CALL CENTER</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Criar conta de cliente</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Registe a sua empresa para acompanhar pedidos, campanhas, contratos, faturas e comprovativos disponibilizados pela MAIMA.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">Nome completo
            <input required maxLength={150} value={nome} onChange={e=>setNome(e.target.value)} autoComplete="name" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal"/>
          </label>
          <label className="block text-sm font-semibold text-slate-700">Empresa
            <input required maxLength={200} value={empresa} onChange={e=>setEmpresa(e.target.value)} autoComplete="organization" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal"/>
          </label>
          <label className="block text-sm font-semibold text-slate-700">Telefone
            <input value={telefone} onChange={e=>setTelefone(e.target.value)} autoComplete="tel" maxLength={40} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal"/>
          </label>
          <label className="block text-sm font-semibold text-slate-700">E-mail profissional
            <input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" maxLength={254} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal"/>
          </label>
          <label className="block text-sm font-semibold text-slate-700">Palavra-passe
            <input required type="password" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 font-normal"/>
            <span className="mt-1 block text-xs font-normal text-slate-500">Utilize pelo menos 8 caracteres.</span>
          </label>
          <label className="flex items-start gap-2 text-xs leading-5 text-slate-600">
            <input required type="checkbox" className="mt-1"/>
            <span>Confirmo que li a <Link href="/privacidade" className="font-semibold text-emerald-700 underline">informação de privacidade</Link> e aceito que os dados sejam utilizados para criar e gerir esta conta.</span>
          </label>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
          <button disabled={loading} className="w-full rounded-lg bg-[#103B70] px-4 py-3 font-semibold text-white disabled:opacity-60">{loading ? "A criar conta..." : "Criar conta"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">Já tem conta? <Link href="/login" className="font-semibold text-emerald-700 underline">Iniciar sessão</Link></p>
      </section>
    </main>
  );
}
