 "use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Deliberately no fake send: connect a real form endpoint before production.
    setSubmitted(true);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-xl shadow-slate-950/10 sm:p-8">
      {submitted ? (
        <div role="status" className="py-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 text-emerald-600" size={42} />
          <h3 className="text-xl font-bold text-[#103B70]">Demonstração concluída</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            O formulário está validado visualmente, mas ainda não envia os dados. Antes de publicar, é necessário ligar um email empresarial ou endpoint seguro.
          </p>
          <button type="button" onClick={() => setSubmitted(false)} className="mt-5 text-sm font-bold text-[#103B70] underline underline-offset-4">Voltar ao formulário</button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <span className="eyebrow">Vamos conversar</span>
            <h3 className="mt-3 text-2xl font-bold tracking-tight text-[#103B70]">Fale-nos do seu projeto</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">Partilhe algumas informações para iniciarmos a conversa.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">Nome
              <input required name="name" autoComplete="name" placeholder="O seu nome" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 font-normal outline-none transition focus:border-[#16834A] focus:ring-2 focus:ring-[#16834A]/20" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">Empresa
              <input required name="company" autoComplete="organization" placeholder="Nome da empresa" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 font-normal outline-none transition focus:border-[#16834A] focus:ring-2 focus:ring-[#16834A]/20" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">Email profissional
              <input required type="email" name="email" autoComplete="email" placeholder="nome@empresa.pt" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-3 font-normal outline-none transition focus:border-[#16834A] focus:ring-2 focus:ring-[#16834A]/20" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">Área de interesse
              <select required name="interest" defaultValue="" className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-[#16834A]">
                <option value="" disabled>Selecione uma opção</option>
                <option>Angariação comercial</option>
                <option>Campanha de energia</option>
                <option>Apoio a operações de contacto</option>
                <option>Outra necessidade</option>
              </select>
            </label>
          </div>
          <label className="mt-4 block text-sm font-semibold text-slate-700">Como podemos ajudar?
            <textarea name="message" rows={4} placeholder="Descreva brevemente a sua necessidade (opcional)" className="mt-2 w-full resize-y rounded-lg border border-slate-200 px-3 py-3 font-normal outline-none focus:border-[#16834A]" />
          </label>
          <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-slate-500">
            <input required type="checkbox" name="privacy" className="mt-1 accent-[#103B70]" />
            <span>Confirmo que li a informação de privacidade e autorizo o contacto para resposta a este pedido. O texto legal definitivo deve ser validado antes da publicação.</span>
          </label>
          <button type="submit" className="btn btn-primary mt-6 w-full">Preparar pedido <ArrowRight size={17} /></button>
          <p className="mt-3 text-center text-[11px] leading-4 text-slate-400">Versão de demonstração: o envio real será ativado após configuração do destino do formulário.</p>
        </>
      )}
    </form>
  );
}
