"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Perfil={nome:string|null;email:string;role:string;ativo:boolean};
type Evento={id:string;fornecedor:string;evento_externo_id:string;chamada_externa_id:string;telefone:string|null;direcao:"entrada"|"saida";chamada_em:string;duracao_segundos:number|null;resultado:string|null;estado_integracao:string;recebido_em:string};

const estadoLabel:Record<string,string>={recebida:"Recebida",em_analise:"Em análise",associada:"Associada",ignorada:"Ignorada",erro:"Erro"};
const duracao=(seconds:number|null)=>seconds===null?"—":String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");
const data=(value:string)=>new Intl.DateTimeFormat("pt-PT",{dateStyle:"short",timeStyle:"short"}).format(new Date(value));

export default function TelefoniaPage(){
  const router=useRouter();
  const [profile,setProfile]=useState<Perfil|null>(null);
  const [events,setEvents]=useState<Evento[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    const db=createClient();
    const {data:{user},error:authError}=await db.auth.getUser();
    if(authError||!user){router.replace("/login");return;}
    const {data:me,error:profileError}=await db.from("maima_perfis").select("nome,email,role,ativo").eq("user_id",user.id).maybeSingle();
    if(profileError||!me||!me.ativo){setError("Não foi possível confirmar o perfil de acesso.");setLoading(false);return;}
    if(!["admin","coordenador"].includes(me.role)){router.replace(me.role==="cliente"?"/cliente/painel":"/admin/operacao");return;}
    setProfile(me as Perfil);
    const {data,error:eventsError}=await db.from("maima_telefonia_eventos")
      .select("id,fornecedor,evento_externo_id,chamada_externa_id,telefone,direcao,chamada_em,duracao_segundos,resultado,estado_integracao,recebido_em")
      .order("recebido_em",{ascending:false}).limit(100);
    if(eventsError)setError("Não foi possível carregar os eventos: "+eventsError.message);
    setEvents((data??[]) as Evento[]);
    setLoading(false);
  },[router]);

  useEffect(()=>{void load();},[load]);

  if(loading)return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p>A carregar integração telefónica...</p></main>;
  if(!profile)return <main className="mx-auto max-w-xl p-8"><p role="alert">{error||"Perfil indisponível."}</p></main>;

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-5">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">MAIMA CALL CENTER</p><h1 className="mt-1 text-xl font-bold">Integração telefónica</h1><p className="mt-1 text-xs text-slate-500">{profile.nome||profile.email} · {profile.role}</p></div>
        <nav className="flex flex-wrap gap-2">
          <Link href="/admin/operacao" className="rounded-lg border px-3 py-2 text-sm font-semibold">CRM operacional</Link>
          <Link href="/admin/relatorios" className="rounded-lg border px-3 py-2 text-sm font-semibold">Relatórios</Link>
          <button onClick={()=>void load()} className="rounded-lg bg-[#103B70] px-3 py-2 text-sm font-semibold text-white">Atualizar</button>
        </nav>
      </div>
    </header>
    <section className="mx-auto max-w-7xl px-5 py-8">
      <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <h2 className="font-bold text-blue-950">Preparada para receber o fornecedor escolhido</h2>
        <p className="mt-1 text-sm leading-6 text-blue-900">A camada de integração está preparada, mas ainda não existe ligação ativa a uma central telefónica. Quando o fornecedor for escolhido, será configurado o adaptador e a respetiva autenticação.</p>
      </div>
      {error&&<p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-bold">Eventos recebidos</h2><p className="text-sm text-slate-500">Últimos 100 eventos. Os registos são deduplicados por fornecedor e ID do evento.</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{events.length} registos</span>
        </div>
        {events.length===0?<div className="rounded-xl border border-dashed border-slate-300 p-8 text-center"><p className="font-semibold text-slate-700">Ainda não existem eventos telefónicos</p><p className="mt-1 text-sm text-slate-500">Esta lista começará a receber dados depois de o fornecedor ser configurado e ligado.</p></div>:
          <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm">
            <thead><tr className="border-b text-xs uppercase tracking-wide text-slate-500"><th className="px-3 py-3">Data da chamada</th><th className="px-3 py-3">Fornecedor / ID</th><th className="px-3 py-3">Telefone</th><th className="px-3 py-3">Direção</th><th className="px-3 py-3">Duração</th><th className="px-3 py-3">Resultado</th><th className="px-3 py-3">Estado</th></tr></thead>
            <tbody>{events.map(event=><tr key={event.id} className="border-b last:border-0">
              <td className="px-3 py-3 whitespace-nowrap">{data(event.chamada_em)}</td>
              <td className="px-3 py-3"><p className="font-semibold">{event.fornecedor}</p><p className="max-w-[190px] truncate text-xs text-slate-500" title={event.chamada_externa_id}>{event.chamada_externa_id}</p></td>
              <td className="px-3 py-3">{event.telefone||"Não fornecido"}</td>
              <td className="px-3 py-3">{event.direcao==="entrada"?"Recebida":"Efetuada"}</td>
              <td className="px-3 py-3 tabular-nums">{duracao(event.duracao_segundos)}</td>
              <td className="px-3 py-3">{event.resultado||"—"}</td>
              <td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{estadoLabel[event.estado_integracao]||event.estado_integracao}</span></td>
            </tr>)}</tbody>
          </table></div>}
      </section>
      <p className="mt-4 text-xs text-slate-500">Por segurança, esta fase não importa gravações nem transcrições e ainda não associa automaticamente eventos a leads ou operadores.</p>
    </section>
  </main>;
}
