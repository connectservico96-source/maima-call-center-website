
"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RecuperarPasswordPage() {
  const router = useRouter();
  const started = useRef(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function prepareRecovery() {
      try {
        const url = new URL(window.location.href);
        const params = url.searchParams;
        const hash = new URLSearchParams(url.hash.slice(1));

        if (params.has("error") || hash.has("error")) {
          setError(
            "O link de recuperação expirou ou é inválido. Solicita um novo e-mail e abre o link mais recente."
          );
          return;
        }

        const supabase = createClient();
        const code = params.get("code");

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            setError(
              "Não foi possível validar o link. Solicita um novo e-mail de recuperação."
            );
            return;
          }

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          setRecoveryReady(true);
          return;
        }

        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setError(
              "O link de recuperação expirou ou é inválido. Solicita um novo e-mail."
            );
            return;
          }

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          setRecoveryReady(true);
          return;
        }

        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (!sessionError && data.session) {
          setRecoveryReady(true);
        } else {
          setError(
            "Abre o link mais recente que recebeste por e-mail para alterar a palavra-passe."
          );
        }
      } catch {
        setError("Ocorreu um erro ao validar o link. Tenta novamente.");
      } finally {
        setCheckingSession(false);
      }
    }

    void prepareRecovery();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!recoveryReady) {
      setError("Valida primeiro o link de recuperação recebido por e-mail.");
      return;
    }

    if (password.length < 8) {
      setError("A palavra-passe deve ter pelo menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(
          "Não foi possível alterar a palavra-passe. Solicita um novo link de recuperação."
        );
        return;
      }

      setMessage(
        "Palavra-passe alterada com sucesso. Já podes iniciar sessão."
      );
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch {
      setError("Ocorreu um erro. Solicita um novo link e tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gray-500">
          MAIMA CALL CENTER
        </p>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Nova palavra-passe
        </h1>

        <p className="mb-8 text-sm text-gray-600">
          Define uma nova palavra-passe para a tua conta.
        </p>

        {checkingSession && (
          <p role="status" className="mb-5 text-sm text-gray-600">
            A validar o link de recuperação...
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Nova palavra-passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={!recoveryReady || checkingSession || loading}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-blue-600 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Confirmar palavra-passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              disabled={!recoveryReady || checkingSession || loading}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-blue-600 disabled:bg-gray-100"
            />
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
            disabled={!recoveryReady || checkingSession || loading}
            className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "A guardar..." : "Alterar palavra-passe"}
          </button>
        </form>
      </section>
    </main>
  );
}
