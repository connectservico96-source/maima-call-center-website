```tsx
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
            console.error(
              "Erro ao validar recuperação:",
              exchangeError.message
            );

            setError(
              `Não foi possível validar o link: ${exchangeError.message}`
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
          const { error: sessionError } =
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

          if (sessionError) {
            console.error(
              "Erro ao validar sessão de recuperação:",
              sessionError.message
            );

            setError(
              `O link de recuperação não pôde ser validado: ${sessionError.message}`
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
      } catch (err) {
        console.error("Erro inesperado na recuperação:", err);

        setError(
          "Ocorreu um erro ao validar o link. Tenta novamente."
        );
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
      setError(
        "Valida primeiro o link de recuperação recebido por e-mail."
      );
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

      const { error: updateError } =
        await supabase.auth.updateUser({ password });

      if (updateError) {
        console.error(
          "Erro ao alterar palavra-passe:",
          updateError.message
        );

        setError(
          `Não foi possível alterar a palavra-passe: ${updateError.message}`
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
    } catch (err) {
      console.error("Erro inesperado ao guardar palavra-passe:", err);

      setError(
        "Ocorreu um erro inesperado. Tenta novamente."
      );
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

        <h1 className="mb-2 text-3
