"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Fatura = {
  id: number;
  referencia: string;
  valor: number;
  moeda: string;
  estado_pagamento: string;
};
type Registo = {
  id: number;
  fatura_id: number;
  nome_arquivo: string;
  estado: string;
  nota_admin: string | null;
};

function tipoDoFicheiro(file: File) {
  const nome = file.name.toLowerCase();
  if (file.type === "application/pdf" || nome.endsWith(".pdf")) return "application/pdf";
  if (file.type === "image/jpeg" || nome.endsWith(".jpg") || nome.endsWith(".jpeg")) return "image/jpeg";
  if (file.type === "image/png" || nome.endsWith(".png")) return "image/png";
  return "";
}

export default function ComprovativosCliente() {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [registos, setRegistos] = useState<Registo[]>([]);
  const [ficheiros, setFicheiros] = useState<Record<number, File | null>>({});
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [aCarregar, setACarregar] = useState(true);
  const [aEnviar, setAEnviar] = useState<number | null>(null);

  async function carregar() {
    setACarregar(true);
    setErro("");
    const db = createClient();
    const [faturasResult, registosResult] = await Promise.all([
      db.from("faturas")
        .select("id,referencia,valor,moeda,estado_pagamento")
        .in("estado_pagamento", ["Pendente", "Atrasado"])
        .order("data_emissao", { ascending: false }),
      db.from("comprovativos_pagamento")
        .select("id,fatura_id,nome_arquivo,estado,nota_admin")
        .order("enviado_em", { ascending: false }),
    ]);

    if (faturasResult.error) {
      setErro("Não foi possível carregar as facturas: " + faturasResult.error.message);
    } else {
      setFaturas((faturasResult.data ?? []) as Fatura[]);
    }
    if (registosResult.error) {
      setErro((anterior) => anterior ? anterior + " | " : "" + "Não foi possível carregar o histórico: " + registosResult.error.message);
    } else {
      setRegistos((registosResult.data ?? []) as Registo[]);
    }
    setACarregar(false);
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function enviar(fatura: Fatura) {
    const ficheiro = ficheiros[fatura.id];
    if (!ficheiro) {
      setErro("Primeiro escolha o ficheiro do comprovativo.");
      return;
    }

    const tipo = tipoDoFicheiro(ficheiro);
    if (!tipo) {
      setErro("Formato não aceite. Escolha um ficheiro PDF, JPG ou PNG.");
      return;
    }
    if (ficheiro.size > 10 * 1024 * 1024) {
      setErro("O ficheiro ultrapassa 10 MB. Escolha um ficheiro mais pequeno.");
      return;
    }

    setAEnviar(fatura.id);
    setErro("");
    setMensagem("");

    try {
      const db = createClient();
      const { data: { user }, error: authError } = await db.auth.getUser();
      if (authError || !user) {
        throw new Error("A sua sessão terminou. Entre novamente na Área de Cliente.");
      }

      const nomeSeguro = ficheiro.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const caminho = user.id + "/" + fatura.id + "/" + Date.now() + "-" + nomeSeguro;
      const upload = await db.storage
        .from("comprovativos-pagamento")
        .upload(caminho, ficheiro, { contentType: tipo, upsert: false });

      if (upload.error) {
        throw new Error("Não foi possível carregar o ficheiro: " + upload.error.message);
      }

      const insercao = await db.from("comprovativos_pagamento").insert({
        fatura_id: fatura.id,
        user_id: user.id,
        caminho_arquivo: caminho,
        nome_arquivo: ficheiro.name,
        tipo_arquivo: tipo,
        tamanho_bytes: ficheiro.size,
      });

      if (insercao.error) {
        await db.storage.from("comprovativos-pagamento").remove([caminho]);
        throw new Error("O ficheiro foi carregado, mas não foi possível registar o comprovativo: " + insercao.error.message);
      }

      setMensagem("Comprovativo enviado com sucesso. A MAIMA irá analisá-lo.");
      setFicheiros((actual) => ({ ...actual, [fatura.id]: null }));
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Ocorreu um erro inesperado ao enviar o comprovativo.");
    } finally {
      setAEnviar(null);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold text-slate-900">Enviar comprovativo de pagamento</h2>
      <p className="mt-1 text-sm text-slate-600">Escolha a factura que pagou, anexe o comprovativo e envie para validação.</p>
      <p className="mt-2 text-xs text-slate-500">Formatos aceites: PDF, JPG ou PNG. Tamanho máximo: 10 MB.</p>

      {mensagem && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{mensagem}</p>}
      {erro && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}

      {aCarregar ? (
        <p className="mt-5 text-sm text-slate-500">A verificar as facturas disponíveis...</p>
      ) : faturas.length === 0 ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">Não existem facturas pendentes para enviar comprovativo.</p>
          <p className="mt-1 text-sm text-amber-800">Só é possível enviar comprovativos de facturas com estado “Pendente” ou “Atrasado”. Se já fez o pagamento e a factura continua como pendente, pode enviar o comprovativo assim que a MAIMA confirmar que a factura está disponível para pagamento.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {faturas.map((fatura) => (
            <div key={fatura.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{fatura.referencia}</p>
                  <p className="mt-1 text-sm text-slate-600">{Number(fatura.valor).toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {fatura.moeda}</p>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{fatura.estado_pagamento}</span>
              </div>
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Seleccionar comprovativo
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={(event) => setFicheiros((actual) => ({ ...actual, [fatura.id]: event.target.files?.[0] ?? null }))}
                  className="mt-2 block w-full rounded-lg border border-slate-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-semibold"
                />
              </label>
              {ficheiros[fatura.id] && <p className="mt-2 text-xs text-slate-600">Ficheiro seleccionado: {ficheiros[fatura.id]?.name}</p>}
              <button
                type="button"
                disabled={aEnviar !== null || !ficheiros[fatura.id]}
                onClick={() => void enviar(fatura)}
                className="mt-3 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aEnviar === fatura.id ? "A enviar comprovativo..." : "Enviar comprovativo"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-7 border-t border-slate-200 pt-5">
        <h3 className="font-bold text-slate-900">Histórico de comprovativos</h3>
        {registos.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Ainda não enviou nenhum comprovativo.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {registos.map((registo) => (
              <div key={registo.id} className="rounded-lg bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-800">{registo.nome_arquivo}</p>
                <p className="mt-1 text-slate-600">Estado: {registo.estado}{registo.nota_admin ? " · " + registo.nota_admin : ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
