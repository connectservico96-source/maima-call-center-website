
"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get("name") ?? ""),
      company: String(data.get("company") ?? ""),
      email: String(data.get("email") ?? ""),
      interest: String(data.get("interest") ?? ""),
      message: String(data.get("message") ?? ""),
    };

    try {
      const response = await fetch("/api/contactos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Não foi possível enviar o pedido."
        );
      }

      setSubmitted(true);
      form.reset();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 shadow-xl shadow-slate-950/10 sm:p-8"
    >
      {submitted ? (
        <div role="status" className="py-8 text-center">
          <CheckCircle2
            className="mx-auto mb-4 text-emerald-600"
            size={42}
          />
          <h3 className="text-xl font-bold text-[#103B70]">
            Pedido enviado com sucesso!
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Obrigado pelo contacto. Recebemos o seu pedido.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="mt-5 text-sm font-bold text-[#103B70] underline underline-offset-4"
          >
            Voltar ao formulário
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <span className="eyebrow">Vamos conversar</span>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-[#103B70]">
              Fale-nos do seu projeto
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Partilhe algumas informações para iniciarmos a conversa.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Nome
              <input
                required
                name="name"
                autoComplete="name"
                maxLength={150}
                placeholder="O seu nome"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 font-normal outline-none transition focus:border-[#16834A] focus:ring-2 focus:ring-[#16834A]/20"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Empresa
              <input
                required
                name="company"
                autoComplete="organization"
                maxLength={200}
                placeholder="Nome da empresa"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 font-normal outline-none transition focus:border-[#16834A] focus:ring-2 focus:ring-[#16834A]/20"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Email profissional
              <input
                required
                type="email"
                name="email"
                autoComplete="email"
                maxLength={254}
                placeholder="nome@empresa.pt"
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 font-normal outline-none transition focus:border-[#16834A] focus:ring-2 focus:ring-[#16834A]/20"
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Área de interesse
              <select
                required
                name="interest"
                defaultValue=""
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-[#16834A]"
              >
                <option value="" disabled>
                  Selecione uma opção
                </option>
                <option>Angariação comercial</option>
                <option>Campanha de energia</option>
                <option>Apoio a operações de contacto</option>
                <option>Outra necessidade</option>
              </select>
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Como podemos ajudar?
            <textarea
              name="message"
              rows={4}
              maxLength={5000}
              placeholder="Descreva brevemente a sua necessidade (opcional)"
              className="mt-2 w-full resize-y rounded-lg border border-slate-200 px-3 py-3 font-normal outline-none focus:border-[#16834A]"
            />
          </label>

          <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-slate-500">
            <input
              required
              type="checkbox"
              name="privacy"
              className="mt-1 accent-[#103B70]"
            />
            <span>
              Confirmo que li a informação de privacidade e autorizo o
              contacto para resposta a este pedido. O texto legal definitivo
              deve ser validado antes da publicação.
            </span>
          </label>

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "A enviar..." : "Enviar pedido"}
            {!loading && <ArrowRight size={17} />}
          </button>

          <p className="mt-3 text-center text-[11px] leading-4 text-slate-400">
            Os seus dados serão utilizados para responder ao seu pedido.
          </p>
        </>
      )}
    </form>
  );
}
