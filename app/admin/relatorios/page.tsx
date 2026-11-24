"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Profile = { user_id: string; nome: string | null; email: string; role: string; ativo: boolean };
type Campaign = { id: string; codigo: string; nome: string; estado: string };
type Lead = { id: string; campanha_id: string; operador_id: string | null; criado_em: string; autorizacao_utilizacao: string; nao_contactar: boolean };
type Call = { id: string; campanha_id: string; operador_id: string; lead_id: string; chamada_em: string; resultado: string; duracao_segundos: number | null };
type Contract = { id: string; campanha_id: string; operador_id: string; estado: string; submetido_em: string; validado_em: string | null; ativado_em: string | null; cancelado_em: string | null; atualizado_em: string };
type Quality = { id: string; campanha_id: string; operador_id: string; pontuacao: number; avaliado_em: string };
type Commission = { id: string; campanha_id: string; operador_id: string; valor: number | null; moeda: string; estado: string; atualizado_em: string };

function dateInput(value: Date) {
  return value.getFullYear() + "-" + String(value.getMonth() + 1).padStart(2, "0") + "-" + String(value.getDate()).padStart(2, "0");
}
function inRange(value: string | null | undefined, from: string, to: string) {
  if (!value) return false;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return false;
  const start = from ? new Date(from + "T00:00:00").getTime() : Number.NEGATIVE_INFINITY;
  const end = to ? new Date(to + "T23:59:59.999").getTime() : Number.POSITIVE_INFINITY;
  return timestamp >= start && timestamp <= end;
}
function pct(value: number, total: number) {
  return total > 0 ? (value / total * 100).toFixed(1) + "%" : "—";
}
function currency(value: number, code: string) {
  try {
    return new Intl.NumberFormat("pt-PT", { style: "currency", currency: code }).format(value);
  } catch {
    return value.toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + " " + code;
  }
}
async function fetchAll(query: any): Promise<any[]> {
  const pageSize = 1000;
  const rows: any[] = [];
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await query.range(start, start + pageSize - 1);
    if (error) throw error;
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) break;
  }
  return rows;
}

export default function RelatoriosPage() {
  const router = useRouter();
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [from, setFrom] = useState(dateInput(firstDay));
  const [to, setTo] = useState(dateInput(today));
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [operatorFilter, setOperatorFilter] = useState("all");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [team, setTeam] = useState<Profile[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [quality, setQuality] = useState<Quality[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const db = createClient();
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError || !user) {
      router.replace("/login");
      return;
    }
    const { data: me, error: profileError } = await db
      .from("maima_perfis")
      .select("user_id,nome,email,role,ativo")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileError || !me || !me.ativo) {
      setError("Não foi possível confirmar o seu perfil de acesso.");
      setLoading(false);
      return;
    }
    if (me.role === "operador") {
      router.replace("/admin/operacao");
      return;
    }
    if (me.role === "cliente") {
      router.replace("/cliente/painel");
      return;
    }
    if (!["admin", "coordenador"].includes(me.role)) {
      router.replace("/login");
      return;
    }
    setProfile(me as Profile);
    try {
      const [campaignRows, teamRows, leadRows, callRows, contractRows, qualityRows, commissionRows] = await Promise.all([
        fetchAll(db.from("maima_campanhas").select("id,codigo,nome,estado").order("criado_em", { ascending: false })),
        fetchAll(db.from("maima_perfis").select("user_id,nome,email,role,ativo").eq("role", "operador").order("nome")),
        fetchAll(db.from("maima_leads").select("id,campanha_id,operador_id,criado_em,autorizacao_utilizacao,nao_contactar").order("criado_em", { ascending: false })),
        fetchAll(db.from("maima_chamadas").select("id,campanha_id,operador_id,lead_id,chamada_em,resultado,duracao_segundos").order("chamada_em", { ascending: false })),
        fetchAll(db.from("maima_contratos").select("id,campanha_id,operador_id,estado,submetido_em,validado_em,ativado_em,cancelado_em,atualizado_em").order("submetido_em", { ascending: false })),
        fetchAll(db.from("maima_qualidade").select("id,campanha_id,operador_id,pontuacao,avaliado_em").order("avaliado_em", { ascending: false })),
        fetchAll(db.from("maima_comissoes_contratos").select("id,campanha_id,operador_id,valor,moeda,estado,atualizado_em").order("atualizado_em", { ascending: false })),
      ]);
      setCampaigns(campaignRows as Campaign[]);
      setTeam(teamRows as Profile[]);
      setLeads(leadRows as Lead[]);
      setCalls(callRows as Call[]);
      setContracts(contractRows as Contract[]);
      setQuality(qualityRows as Quality[]);
      setCommissions(commissionRows as Commission[]);
    } catch (err) {
      setError("Não foi possível carregar todos os dados dos relatórios: " + (err instanceof Error ? err.message : "erro desconhecido"));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const invalidRange = Boolean(from && to && from > to);

  const filteredLeads = useMemo(() => leads.filter(x =>
    inRange(x.criado_em, from, to) &&
    (campaignFilter === "all" || x.campanha_id === campaignFilter) &&
    (operatorFilter === "all" || x.operador_id === operatorFilter)
  ), [leads, from, to, campaignFilter, operatorFilter]);

  const filteredCalls = useMemo(() => calls.filter(x =>
    inRange(x.chamada_em, from, to) &&
    (campaignFilter === "all" || x.campanha_id === campaignFilter) &&
    (operatorFilter === "all" || x.operador_id === operatorFilter)
  ), [calls, from, to, campaignFilter, operatorFilter]);

  const filteredContracts = useMemo(() => contracts.filter(x =>
    inRange(x.submetido_em, from, to) &&
    (campaignFilter === "all" || x.campanha_id === campaignFilter) &&
    (operatorFilter === "all" || x.operador_id === operatorFilter)
  ), [contracts, from, to, campaignFilter, operatorFilter]);

  const filteredValidations = useMemo(() => contracts.filter(x =>
    (inRange(x.validado_em, from, to) || inRange(x.ativado_em, from, to)) &&
    (campaignFilter === "all" || x.campanha_id === campaignFilter) &&
    (operatorFilter === "all" || x.operador_id === operatorFilter)
  ), [contracts, from, to, campaignFilter, operatorFilter]);

  const filteredQuality = useMemo(() => quality.filter(x =>
    inRange(x.avaliado_em, from, to) &&
    (campaignFilter === "all" || x.campanha_id === campaignFilter) &&
    (operatorFilter === "all" || x.operador_id === operatorFilter)
  ), [quality, from, to, campaignFilter, operatorFilter]);

  const filteredCommissions = useMemo(() => commissions.filter(x =>
    x.estado === "ativa" && inRange(x.atualizado_em, from, to) &&
    (campaignFilter === "all" || x.campanha_id === campaignFilter) &&
    (operatorFilter === "all" || x.operador_id === operatorFilter)
  ), [commissions, from, to, campaignFilter, operatorFilter]);

  const contactedCalls = filteredCalls.filter(x => !["nao_atendida", "ocupado", "numero_invalido"].includes(x.resultado));
  const interestedCalls = filteredCalls.filter(x => x.resultado === "interessado");
  const validatedCohort = filteredContracts.filter(x => ["validado", "ativado"].includes(x.estado));
  const avgQuality = filteredQuality.length
    ? filteredQuality.reduce((sum, x) => sum + Number(x.pontuacao), 0) / filteredQuality.length
    : null;
  const activeCommissionTotals = filteredCommissions.reduce((acc, item) => {
    if (item.valor !== null) acc[item.moeda] = (acc[item.moeda] || 0) + Number(item.valor);
    return acc;
  }, {} as Record<string, number>);
  const activeCommissionText = Object.entries(activeCommissionTotals)
    .map(([code, amount]) => currency(amount, code)).join(" · ");

  const campaignReport = useMemo(() => campaigns
    .filter(c => campaignFilter === "all" || c.id === campaignFilter)
    .map(c => {
      const campaignLeads = filteredLeads.filter(x => x.campanha_id === c.id);
      const campaignCalls = filteredCalls.filter(x => x.campanha_id === c.id);
      const submitted = filteredContracts.filter(x => x.campanha_id === c.id);
      const validated = submitted.filter(x => ["validado", "ativado"].includes(x.estado));
      const interested = campaignCalls.filter(x => x.resultado === "interessado").length;
      return {
        ...c, leads: campaignLeads.length, calls: campaignCalls.length,
        interested, submitted: submitted.length, validated: validated.length,
        conversion: pct(validated.length, submitted.length),
      };
    }), [campaigns, campaignFilter, filteredLeads, filteredCalls, filteredContracts]);

  const operatorReport = useMemo(() => team
    .filter(o => operatorFilter === "all" || o.user_id === operatorFilter)
    .map(o => {
      const opCalls = filteredCalls.filter(x => x.operador_id === o.user_id);
      const opSubmitted = filteredContracts.filter(x => x.operador_id === o.user_id);
      const opValidated = opSubmitted.filter(x => ["validado", "ativado"].includes(x.estado));
      const opQuality = filteredQuality.filter(x => x.operador_id === o.user_id);
      const score = opQuality.length ? opQuality.reduce((sum, x) => sum + Number(x.pontuacao), 0) / opQuality.length : null;
      return {
        ...o, calls: opCalls.length,
        contactRate: pct(opCalls.filter(x => !["nao_atendida", "ocupado", "numero_invalido"].includes(x.resultado)).length, opCalls.length),
        interested: opCalls.filter(x => x.resultado === "interessado").length,
        submitted: opSubmitted.length, validated: opValidated.length,
        quality: score,
      };
    }), [team, operatorFilter, filteredCalls, filteredContracts, filteredQuality]);

  function csvDownload(filename: string, rows: (string | number | null)[][]) {
    const escaped = (value: string | number | null) => '"' + String(value ?? "").replace(/"/g, '""') + '"';
    const content = String.fromCharCode(65279) + rows.map(row => row.map(escaped).join(";")).join("\r\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportReport() {
    const rows: (string | number | null)[][] = [
      ["Tipo", "Nome", "Leads", "Chamadas", "Interessados", "Contratos submetidos", "Contratos validados", "Taxa de validação"],
      ...campaignReport.map(x => ["Campanha", x.codigo + " - " + x.nome, x.leads, x.calls, x.interested, x.submitted, x.validated, x.conversion]),
      ...operatorReport.map(x => ["Operador", x.nome || x.email, "", x.calls, x.interested, x.submitted, x.validated, pct(x.validated, x.submitted)]),
    ];
    csvDownload("maima-relatorio-operacional-" + from + "-a-" + to + ".csv", rows);
  }

  function setPreset(days: number | null) {
    const end = new Date();
    const start = days === null ? new Date(end.getFullYear(), end.getMonth(), 1) : new Date(end.getFullYear(), end.getMonth(), end.getDate() - days + 1);
    setFrom(dateInput(start));
    setTo(dateInput(end));
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p className="text-sm text-slate-600">A carregar relatórios...</p></main>;
  if (!profile) return <main className="mx-auto max-w-xl p-8"><p role="alert">{error || "Perfil indisponível."}</p></main>;

  const card = (title: string, value: string | number, detail: string) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">MAIMA CALL CENTER</p>
            <h1 className="mt-1 text-xl font-bold text-slate-900">Relatórios operacionais</h1>
            <p className="mt-1 text-xs text-slate-500">{profile.nome || profile.email} · {profile.role}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/operacao" className="rounded-lg border px-3 py-2 text-sm font-semibold">CRM operacional</Link>
            {profile.role === "admin" && <Link href="/admin/equipa" className="rounded-lg border px-3 py-2 text-sm font-semibold">Equipa e acessos</Link>}
            {profile.role === "admin" && <Link href="/admin" className="rounded-lg border px-3 py-2 text-sm font-semibold">Painel administrativo</Link>}
            <button onClick={() => void load()} className="rounded-lg bg-[#103B70] px-3 py-2 text-sm font-semibold text-white">Atualizar dados</button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Período do relatório</h2>
              <p className="mt-1 text-sm text-slate-500">Os indicadores respeitam o intervalo e os filtros selecionados.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setPreset(1)} className="rounded-lg border px-3 py-2 text-xs font-semibold">Hoje</button>
              <button onClick={() => setPreset(7)} className="rounded-lg border px-3 py-2 text-xs font-semibold">7 dias</button>
              <button onClick={() => setPreset(null)} className="rounded-lg border px-3 py-2 text-xs font-semibold">Este mês</button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-semibold text-slate-700">De<input type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"/></label>
            <label className="text-sm font-semibold text-slate-700">Até<input type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"/></label>
            <label className="text-sm font-semibold text-slate-700">Campanha<select value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"><option value="all">Todas as campanhas</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-700">Operador<select value={operatorFilter} onChange={e => setOperatorFilter(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"><option value="all">Toda a equipa</option>{team.map(o => <option key={o.user_id} value={o.user_id}>{o.nome || o.email}</option>)}</select></label>
          </div>
          {invalidRange && <p role="alert" className="mt-3 text-sm text-red-700">A data inicial não pode ser posterior à data final.</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button disabled={invalidRange} onClick={exportReport} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Exportar relatório CSV</button>
            <button onClick={() => window.print()} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Imprimir / Guardar PDF</button>
          </div>
        </section>

        {!invalidRange && (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {card("Leads registadas", filteredLeads.length, filteredLeads.filter(x => x.autorizacao_utilizacao === "autorizada" && !x.nao_contactar).length + " autorizadas e contactáveis")}
              {card("Chamadas realizadas", filteredCalls.length, new Set(filteredCalls.map(x => x.lead_id)).size + " leads contactadas")}
              {card("Taxa de contacto", pct(contactedCalls.length, filteredCalls.length), contactedCalls.length + " chamadas com contacto")}
              {card("Taxa de interesse", pct(interestedCalls.length, filteredCalls.length), interestedCalls.length + " resultados «Interessado»")}
              {card("Contratos submetidos", filteredContracts.length, validatedCohort.length + " já validados/ativados nesta coorte")}
              {card("Validações no período", filteredValidations.length, "Data de validação ou ativação registada")}
              {card("Qualidade média", avgQuality === null ? "—" : avgQuality.toFixed(1) + " / 100", filteredQuality.length + " chamadas avaliadas")}
              {card("Comissões ativas", activeCommissionText || "—", filteredCommissions.length + " registos atualizados no período")}
            </section>

            <section className="mt-8 grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-bold">Resultados das chamadas</h2>
                <p className="mt-1 text-sm text-slate-500">Distribuição dos resultados registados no intervalo selecionado.</p>
                <div className="mt-4 space-y-3">
                  {[
                    ["Interessado", "interessado"], ["Atendida", "atendida"], ["Retorno agendado", "retorno_agendado"],
                    ["Sem interesse", "sem_interesse"], ["Não atendeu", "nao_atendida"], ["Ocupado", "ocupado"],
                    ["Número inválido", "numero_invalido"], ["Não contactar", "nao_contactar"],
                  ].map(([name, result]) => {
                    const amount = filteredCalls.filter(x => x.resultado === result).length;
                    const width = filteredCalls.length ? amount / filteredCalls.length * 100 : 0;
                    return <div key={result}>
                      <div className="flex items-center justify-between gap-3 text-sm"><span className="text-slate-700">{name}</span><strong className="tabular-nums">{amount} · {pct(amount, filteredCalls.length)}</strong></div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: width + "%" }}/></div>
                    </div>;
                  })}
                  {filteredCalls.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Ainda não existem chamadas neste período.</p>}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-bold">Desempenho por campanha</h2>
                <p className="mt-1 text-sm text-slate-500">Leads, atividade, submissões e validação por campanha.</p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead><tr className="border-b text-xs text-slate-500"><th className="py-2 pr-3">Campanha</th><th className="py-2 pr-3">Leads</th><th className="py-2 pr-3">Chamadas</th><th className="py-2 pr-3">Interessados</th><th className="py-2 pr-3">Contratos</th><th className="py-2">Validados</th></tr></thead>
                    <tbody>{campaignReport.map(c => <tr key={c.id} className="border-b last:border-0"><td className="py-3 pr-3"><strong>{c.codigo}</strong><p className="text-xs text-slate-500">{c.nome}</p></td><td className="py-3 pr-3">{c.leads}</td><td className="py-3 pr-3">{c.calls}</td><td className="py-3 pr-3">{c.interested}</td><td className="py-3 pr-3">{c.submitted}</td><td className="py-3">{c.validated} <span className="text-xs text-slate-500">({c.conversion})</span></td></tr>)}</tbody>
                  </table>
                  {campaignReport.length === 0 && <p className="py-5 text-sm text-slate-500">Não existem campanhas para este filtro.</p>}
                </div>
              </div>
            </section>

            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-bold">Desempenho por operador</h2>
              <p className="mt-1 text-sm text-slate-500">Métricas individuais calculadas apenas com os registos que o seu perfil pode consultar.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead><tr className="border-b text-xs text-slate-500"><th className="py-2 pr-3">Operador</th><th className="py-2 pr-3">Chamadas</th><th className="py-2 pr-3">Contacto</th><th className="py-2 pr-3">Interessados</th><th className="py-2 pr-3">Contratos</th><th className="py-2 pr-3">Validados</th><th className="py-2">Qualidade média</th></tr></thead>
                  <tbody>{operatorReport.map(o => <tr key={o.user_id} className="border-b last:border-0"><td className="py-3 pr-3"><strong>{o.nome || o.email}</strong><p className="text-xs text-slate-500">{o.ativo ? "Ativo" : "Inativo"}</p></td><td className="py-3 pr-3">{o.calls}</td><td className="py-3 pr-3">{o.contactRate}</td><td className="py-3 pr-3">{o.interested}</td><td className="py-3 pr-3">{o.submitted}</td><td className="py-3 pr-3">{o.validated}</td><td className="py-3">{o.quality === null ? "—" : o.quality.toFixed(1) + " / 100"}</td></tr>)}</tbody>
                </table>
                {operatorReport.length === 0 && <p className="py-5 text-sm text-slate-500">Ainda não existem operadores registados.</p>}
              </div>
            </section>
          </>
        )}

        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
          Nota de leitura: os indicadores são calculados a partir dos registos existentes e dos campos de data guardados. A taxa de validação compara os contratos submetidos no período com o estado atual desses contratos. Comissões ativas não são custos operacionais nem pagamentos confirmados. O sistema ainda não regista despesas, pelo que não calcula custo por contrato. Para histórico fiável, as transições de estado devem ser registadas no momento em que acontecem.
        </p>
      </section>
    </main>
  );
}
