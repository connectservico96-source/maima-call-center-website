"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Profile={user_id:string;nome:string|null;email:string;role:string;ativo:boolean};
type Campaign={id:string;codigo:string;nome:string;moeda:string};
type Expense={id:string;campanha_id:string|null;data_despesa:string;categoria:string;descricao:string;valor:number;moeda:string;estado:"ativa"|"anulada";motivo_anulacao:string|null;criado_em:string};

function todayInput(){
  const d=new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
async function fetchAll(query:any):Promise<any[]>{
  const rows:any[]=[];const size=1000;
  for(let start=0;;start+=size){
    const {data,error}=await query.range(start,start+size-1);
    if(error)throw error;
    const part=data??[];rows.push(...part);
    if(part.length<size)break;
  }
  return rows;
}
function money(value:number,code:string){
  try{return new Intl.NumberFormat("pt-PT",{style:"currency",currency:code}).format(value);}
  catch{return value.toLocaleString("pt-PT",{maximumFractionDigits:2})+" "+code;}
}

export default function CustosPage(){
  const router=useRouter();
  const [profile,setProfile]=useState<Profile|null>(null);
  const [campaigns,setCampaigns]=useState<Campaign[]>([]);
  const [expenses,setExpenses]=useState<Expense[]>([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [from,setFrom]=useState(todayInput().slice(0,8)+"01");
  const [to,setTo]=useState(todayInput());
  const [campaignFilter,setCampaignFilter]=useState("all");
  const [form,setForm]=useState({campanha_id:"",data_despesa:todayInput(),categoria:"Telefonia e comunicações",descricao:"",valor:"",moeda:"EUR"});
  const [cancelReasons,setCancelReasons]=useState<Record<string,string>>({});

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    const db=createClient();
    const {data:{user},error:authError}=await db.auth.getUser();
    if(authError||!user){router.replace("/login");return;}
    const {data:me,error:profileError}=await db.from("maima_perfis").select("user_id,nome,email,role,ativo").eq("user_id",user.id).maybeSingle();
    if(profileError||!me||!me.ativo){setError("Não foi possível confirmar o perfil de acesso.");setLoading(false);return;}
    if(!["admin","coordenador"].includes(me.role)){
      router.replace(me.role==="cliente"?"/cliente/painel":"/admin/operacao");return;
    }
    setProfile(me as Profile);
    try{
      const [campaignRows,expenseRows]=await Promise.all([
        fetchAll(db.from("maima_campanhas").select("id,codigo,nome,moeda").order("criado_em",{ascending:false})),
        fetchAll(db.from("maima_despesas").select("id,campanha_id,data_despesa,categoria,descricao,valor,moeda,estado,motivo_anulacao,criado_em").order("data_despesa",{ascending:false})),
      ]);
      setCampaigns(campaignRows as Campaign[]);
      setExpenses(expenseRows as Expense[]);
    }catch(err){
      setError("Não foi possível carregar as despesas: "+(err instanceof Error?err.message:"erro desconhecido"));
    }finally{setLoading(false);}
  },[router]);

  useEffect(()=>{void load();},[load]);

  const invalidRange=Boolean(from&&to&&from>to);
  const visible=useMemo(()=>expenses.filter(x=>
    (!from||x.data_despesa>=from)&&(!to||x.data_despesa<=to)&&
    (campaignFilter==="all"||(campaignFilter==="general"?x.campanha_id===null:x.campanha_id===campaignFilter))
  ),[expenses,from,to,campaignFilter]);
  const totals=visible.filter(x=>x.estado==="ativa").reduce((acc,x)=>{
    acc[x.moeda]=(acc[x.moeda]||0)+Number(x.valor);return acc;
  },{} as Record<string,number>);
  const totalText=Object.entries(totals).map(([code,value])=>money(value,code)).join(" · ");

  async function addExpense(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setSaving(true);setError("");setNotice("");
    const {data:{user},error:authError}=await createClient().auth.getUser();
    if(authError||!user){setError("A sessão terminou. Entre novamente.");setSaving(false);return;}
    const amount=Number(form.valor.replace(",","."));
    if(!Number.isFinite(amount)||amount<=0){setError("Indique um valor superior a zero.");setSaving(false);return;}
    const {error:insertError}=await createClient().from("maima_despesas").insert({
      campanha_id:form.campanha_id||null,data_despesa:form.data_despesa,
      categoria:form.categoria.trim(),descricao:form.descricao.trim(),
      valor:amount,moeda:form.moeda,criado_por:user.id,
    });
    if(insertError)setError("Não foi possível guardar a despesa: "+insertError.message);
    else{
      setNotice("Despesa registada. O lançamento ficou no histórico interno.");
      setForm(v=>({...v,descricao:"",valor:""}));
      await load();
    }
    setSaving(false);
  }

  async function annulExpense(expense:Expense){
    const reason=(cancelReasons[expense.id]||"").trim();
    if(reason.length<3){setError("Indique o motivo da anulação (mínimo 3 caracteres).");return;}
    setError("");setNotice("");
    const {error:updateError}=await createClient().from("maima_despesas")
      .update({estado:"anulada",motivo_anulacao:reason,atualizado_em:new Date().toISOString()})
      .eq("id",expense.id).eq("estado","ativa");
    if(updateError)setError("Não foi possível anular a despesa: "+updateError.message);
    else{setNotice("Despesa anulada e mantida no histórico.");await load();}
  }

  function exportCSV(){
    const escape=(v:string|number|null)=>'"'+String(v??"").replace(/"/g,'""')+'"';
    const rows=[
      ["Data","Campanha","Categoria","Descrição","Valor","Moeda","Estado","Motivo de anulação"],
      ...visible.map(x=>[
        x.data_despesa,
        x.campanha_id?campaigns.find(c=>c.id===x.campanha_id)?.codigo||"Campanha":"Despesa geral",
        x.categoria,x.descricao,x.valor,x.moeda,x.estado,x.motivo_anulacao,
      ]),
    ];
    const content=String.fromCharCode(65279)+rows.map(row=>row.map(escape).join(";")).join("\r\n");
    const blob=new Blob([content],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download="maima-despesas-"+from+"-a-"+to+".csv";
    document.body.appendChild(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  if(loading)return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p>A carregar despesas...</p></main>;
  if(!profile)return <main className="mx-auto max-w-xl p-8"><p role="alert">{error||"Perfil indisponível."}</p></main>;

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">MAIMA CALL CENTER</p><h1 className="mt-1 text-xl font-bold">Despesas operacionais</h1><p className="mt-1 text-xs text-slate-500">{profile.nome||profile.email} · {profile.role}</p></div>
        <nav className="flex flex-wrap gap-2">
          <Link href="/admin/operacao" className="rounded-lg border px-3 py-2 text-sm font-semibold">CRM operacional</Link>
          <Link href="/admin/relatorios" className="rounded-lg border px-3 py-2 text-sm font-semibold">Relatórios</Link>
          {profile.role==="admin"&&<Link href="/admin" className="rounded-lg border px-3 py-2 text-sm font-semibold">Administração</Link>}
          <button onClick={()=>void load()} className="rounded-lg bg-[#103B70] px-3 py-2 text-sm font-semibold text-white">Atualizar</button>
        </nav>
      </div>
    </header>

    <section className="mx-auto max-w-7xl px-5 py-8">
      {error&&<p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice&&<p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <form onSubmit={addExpense} className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold">Registar despesa</h2>
          <p className="mt-1 text-sm text-slate-500">Registe custos reais e associe-os à campanha correspondente. Despesas sem campanha ficam como custos gerais.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">Data<input required type="date" value={form.data_despesa} onChange={e=>setForm(v=>({...v,data_despesa:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label>
            <label className="text-sm font-semibold">Campanha<select value={form.campanha_id} onChange={e=>setForm(v=>({...v,campanha_id:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"><option value="">Despesa geral (não alocada)</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}</select></label>
            <label className="text-sm font-semibold sm:col-span-2">Categoria<select required value={form.categoria} onChange={e=>setForm(v=>({...v,categoria:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal">{["Telefonia e comunicações","Dados e internet","Software e licenças","Remunerações e prémios","Marketing e publicidade","Deslocações e transporte","Formação","Material e equipamento","Serviços externos","Outros"].map(c=><option key={c}>{c}</option>)}</select></label>
            <label className="text-sm font-semibold sm:col-span-2">Descrição<input required minLength={2} maxLength={500} value={form.descricao} onChange={e=>setForm(v=>({...v,descricao:e.target.value}))} placeholder="Ex.: mensalidade de telefonia da campanha" className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label>
            <label className="text-sm font-semibold">Valor<input required type="number" min="0.01" step="0.01" value={form.valor} onChange={e=>setForm(v=>({...v,valor:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label>
            <label className="text-sm font-semibold">Moeda<select value={form.moeda} onChange={e=>setForm(v=>({...v,moeda:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal">{["EUR","AOA","USD","GBP"].map(c=><option key={c}>{c}</option>)}</select></label>
          </div>
          <button disabled={saving} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving?"A guardar...":"Guardar despesa"}</button>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold">Consultar despesas</h2>
          <p className="mt-1 text-sm text-slate-500">Filtros e totais das despesas ativas no intervalo selecionado.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">De<input type="date" value={from} max={to||undefined} onChange={e=>setFrom(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label>
            <label className="text-sm font-semibold">Até<input type="date" value={to} min={from||undefined} onChange={e=>setTo(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"/></label>
            <label className="text-sm font-semibold sm:col-span-2">Campanha<select value={campaignFilter} onChange={e=>setCampaignFilter(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"><option value="all">Todas (inclui gerais)</option><option value="general">Apenas despesas gerais</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}</select></label>
          </div>
          {invalidRange&&<p className="mt-3 text-sm text-red-700">A data inicial não pode ser posterior à data final.</p>}
          <div className="mt-4 rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Total ativo no período</p><p className="mt-1 text-xl font-bold">{totalText||"—"}</p><p className="mt-1 text-xs text-slate-500">Moedas diferentes são apresentadas separadamente, sem conversão cambial.</p></div>
          <button onClick={exportCSV} disabled={invalidRange||visible.length===0} className="mt-4 rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50">Exportar CSV</button>
        </section>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Histórico de despesas</h2><p className="mt-1 text-sm text-slate-500">{visible.length} registo(s). Despesas anuladas permanecem visíveis e não entram nos totais.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{visible.filter(x=>x.estado==="ativa").length} ativas</span></div>
        <div className="mt-4 space-y-3">
          {visible.map(x=><article key={x.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs text-slate-500">{x.data_despesa} · {campaigns.find(c=>c.id===x.campanha_id)?.codigo||"Despesa geral"} · {x.categoria}</p><h3 className="mt-1 font-semibold">{x.descricao}</h3><p className="mt-1 text-sm font-semibold">{money(Number(x.valor),x.moeda)}</p>{x.estado==="anulada"&&<p className="mt-2 text-xs text-red-700">Anulada: {x.motivo_anulacao}</p>}</div>
              <span className={"rounded-full px-3 py-1 text-xs font-semibold "+(x.estado==="ativa"?"bg-emerald-50 text-emerald-800":"bg-slate-100 text-slate-600")}>{x.estado==="ativa"?"Ativa":"Anulada"}</span>
            </div>
            {x.estado==="ativa"&&<div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={cancelReasons[x.id]||""} onChange={e=>setCancelReasons(v=>({...v,[x.id]:e.target.value}))} placeholder="Motivo da anulação (se necessário)" maxLength={250} className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"/><button onClick={()=>void annulExpense(x)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">Anular lançamento</button></div>}
          </article>)}
          {visible.length===0&&<p className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">Não existem despesas neste filtro.</p>}
        </div>
      </section>
      <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">Apenas administração e coordenação podem consultar e lançar despesas. As anulações ficam no histórico. Não há conversão automática entre EUR, AOA, USD e GBP; os valores são contabilizados na moeda original e não substituem validação contabilística.</p>
    </section>
  </main>;
}
