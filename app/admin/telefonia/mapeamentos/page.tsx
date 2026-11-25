"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Perfil={user_id:string;nome:string|null;email:string;role:string;ativo:boolean};
type Mapping={id:string;fornecedor:string;operador_externo_ref:string;operador_id:string;ativo:boolean};
export default function MapeamentosTelefoniaPage(){
  const router=useRouter();
  const [profile,setProfile]=useState<Perfil|null>(null);
  const [operators,setOperators]=useState<Perfil[]>([]);
  const [mappings,setMappings]=useState<Mapping[]>([]);
  const [form,setForm]=useState({fornecedor:"",operador_externo_ref:"",operador_id:""});
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    const db=createClient();
    const {data:{user},error:authError}=await db.auth.getUser();
    if(authError||!user){router.replace("/login");return;}
    const {data:me,error:profileError}=await db.from("maima_perfis").select("user_id,nome,email,role,ativo").eq("user_id",user.id).maybeSingle();
    if(profileError||!me||!me.ativo){setError("Não foi possível confirmar o perfil.");setLoading(false);return;}
    if(!["admin","coordenador"].includes(me.role)){router.replace("/admin/operacao");return;}
    setProfile(me as Perfil);
    const [team,map]=await Promise.all([
      db.from("maima_perfis").select("user_id,nome,email,role,ativo").eq("role","operador").eq("ativo",true).order("email"),
      db.from("maima_telefonia_operadores").select("id,fornecedor,operador_externo_ref,operador_id,ativo").order("fornecedor").order("operador_externo_ref")
    ]);
    if(team.error||map.error)setError("Não foi possível carregar os mapeamentos.");
    setOperators((team.data??[]) as Perfil[]);
    setMappings((map.data??[]) as Mapping[]);
    setLoading(false);
  },[router]);
  useEffect(()=>{void load();},[load]);

  async function addMapping(e:FormEvent<HTMLFormElement>){
    e.preventDefault();if(!profile)return;
    const fornecedor=form.fornecedor.trim().toLowerCase();
    const ref=form.operador_externo_ref.trim();
    if(!/^[a-z0-9][a-z0-9_-]{1,49}$/.test(fornecedor)){setError("Use um identificador de fornecedor com letras minúsculas, números, hífen ou underscore.");return;}
    if(!ref||!form.operador_id){setError("Preencha a referência externa e escolha o operador MAIMA.");return;}
    setSaving(true);setError("");setNotice("");
    const {error:insertError}=await createClient().from("maima_telefonia_operadores").insert({fornecedor,operador_externo_ref:ref,operador_id:form.operador_id,criado_por:profile.user_id});
    if(insertError)setError(insertError.message.includes("duplicate")?"Esta referência externa já está registada para o fornecedor.": "Não foi possível guardar: "+insertError.message);
    else{setNotice("Mapeamento guardado.");setForm({fornecedor:"",operador_externo_ref:"",operador_id:""});await load();}
    setSaving(false);
  }
  async function toggle(item:Mapping){
    setError("");setNotice("");
    const {error:updateError}=await createClient().from("maima_telefonia_operadores").update({ativo:!item.ativo,atualizado_em:new Date().toISOString()}).eq("id",item.id);
    if(updateError)setError("Não foi possível atualizar: "+updateError.message);
    else{setNotice("Mapeamento atualizado.");await load();}
  }
  const operatorName=(id:string)=>{const p=operators.find(x=>x.user_id===id);return p?.nome||p?.email||"Operador não encontrado";};

  if(loading)return <main className="p-8">A carregar mapeamentos...</main>;
  if(!profile)return <main className="p-8" role="alert">{error||"Acesso indisponível."}</main>;
  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-5">
      <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">MAIMA CALL CENTER</p><h1 className="text-xl font-bold">Mapeamento de operadores telefónicos</h1><p className="text-xs text-slate-500">{profile.nome||profile.email} · {profile.role}</p></div>
      <Link href="/admin/telefonia" className="rounded-lg border px-3 py-2 text-sm font-semibold">Voltar à telefonia</Link>
    </div></header>
    <section className="mx-auto max-w-5xl space-y-6 px-5 py-8">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">Associe a referência do agente fornecida pela central telefónica a um operador da MAIMA. A referência só será conhecida quando o fornecedor for selecionado e enviar os seus primeiros eventos.</div>
      {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice&&<p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <form onSubmit={addMapping} className="space-y-4 rounded-2xl border bg-white p-5">
        <h2 className="font-bold">Adicionar referência de operador</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium">Fornecedor (identificador)<input required value={form.fornecedor} onChange={e=>setForm(v=>({...v,fornecedor:e.target.value}))} placeholder="ex.: fornecedor_x" className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
          <label className="text-sm font-medium">ID externo do agente<input required value={form.operador_externo_ref} onChange={e=>setForm(v=>({...v,operador_externo_ref:e.target.value}))} placeholder="ID fornecido pela central" className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
          <label className="text-sm font-medium">Operador MAIMA<select required value={form.operador_id} onChange={e=>setForm(v=>({...v,operador_id:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">Selecionar operador</option>{operators.map(p=><option key={p.user_id} value={p.user_id}>{p.nome||p.email}</option>)}</select></label>
        </div>
        <button disabled={saving} className="rounded-lg bg-[#103B70] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving?"A guardar...":"Guardar mapeamento"}</button>
      </form>
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="mb-4 font-bold">Referências registadas</h2>
        {mappings.length===0?<p className="rounded-lg border border-dashed p-6 text-center text-sm text-slate-500">Ainda não existem referências de agentes. Poderá adicioná-las depois de escolher a central.</p>:
          <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b text-xs uppercase text-slate-500"><th className="px-3 py-3">Fornecedor</th><th className="px-3 py-3">ID externo</th><th className="px-3 py-3">Operador MAIMA</th><th className="px-3 py-3">Estado</th><th className="px-3 py-3">Ação</th></tr></thead><tbody>{mappings.map(m=><tr key={m.id} className="border-b"><td className="px-3 py-3">{m.fornecedor}</td><td className="px-3 py-3">{m.operador_externo_ref}</td><td className="px-3 py-3">{operatorName(m.operador_id)}</td><td className="px-3 py-3">{m.ativo?"Ativo":"Inativo"}</td><td className="px-3 py-3"><button onClick={()=>void toggle(m)} className="rounded-lg border px-3 py-1.5 text-xs font-semibold">{m.ativo?"Desativar":"Ativar"}</button></td></tr>)}</tbody></table></div>}
      </section>
    </section>
  </main>;
}
