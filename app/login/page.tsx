
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError("Não foi possível entrar. Verifica o e-mail e a palavra-passe.");
        return;
      }

      router.replace("/cliente/painel");
      router.refresh();
    } catch {
      setError("Ocorreu um erro. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordRecovery() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Introduz primeiro o teu e-mail no campo acima.");
      return;
    }

    setRecovering(true);

    try {
      const supabase = createClient();
      const { error: recoveryError } =
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/recuperar-password`,
        });

      if (recoveryError) {
        setError(
          "Não foi possível enviar o e-mail. Verifica o endereço ou tenta novamente mais tarde."
        );
        return;
      }

      setMessage(
        "Se o endereço estiver registado, receberás um e-mail com instruções para alterar a palavra-passe."
      );
    } catch {
      setError("Ocorreu um erro ao pedir a recuperação. Tenta novamente mais tarde.");
    } finally {
      setRecovering(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gray-500">
          MAIMA CALL CENTER
        </p>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">Iniciar sessão</h1>
        <p className="mb-8 text-sm text-gray-600">
          Acede à tua conta para consultar a área reservada.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
              Palavra-passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-blue-600"
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={handlePasswordRecovery}
              disabled={recovering}
              className="text-sm font-medium text-blue-700 underline hover:text-blue-900 disabled:opacity-60"
            >
              {recovering ? "A enviar..." : "Esqueci-me da palavra-passe"}
            </button>
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {message && (
            <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
