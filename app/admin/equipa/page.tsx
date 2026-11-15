"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Member = { user_id:string; nome:string|null; email:string; role:string; cliente_id:string|null; ativo:boolean; criado_em:string };
const ROLES = ["cliente","operador","coordenador","admin"];

export default function EquipaPage(){
  const router=useRouter();
  const [rows,setRows]=useState<Member[]>([]);
  const [me,setMe]=useState("");
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [saving,setSaving]=useState<string|null>(null);

  const load=useCallback(async()=>{
    setLoading(true);setError("");
    const db=createClient();
    const {data:{user}}=await db.auth.getUser();
    if(!user){router.replace("/login");return;}
    setMe(user.id);
    const {data:profile,error:profileError}=await db.from("maima_perfis").select("role").eq("user_id",user.id).maybeSingle();
    if(profileError||profile?.role!=="admin"){router.replace("/admin");return;}
    const {data,error:queryError}=await db.from("maima_perfis").select("user_id,nome,email,role,cliente_id,ativo,criado_em").order("criado_em",{ascending:false});
    if(queryError)setError("Não foi possível consultar os perfis: "+queryError.message);
    else setRows((data??[]) as Member[]);
    setLoading(false);
  },[router]);

  useEffect(()=>{void load();},[load]);

  async function save(member:Member){
    setSaving(member.user_id);setError("");setNotice("");
    const {error:updateError}=await createClient().from("maima_perfis").update({role:member.role,ativo:member.ativo}).eq("user_id",member.user_id);
    if(updateError)setError("Não foi possível atualizar o perfil: "+updateError.message);
    else setNotice("Perfil atualizado para "+member.email+".");
    setSaving(null);
  }

  async function logout(){await createClient().auth.signOut();router.replace("/login");router.refresh();}

  if(loading)return <main className="flex min-h-screen items-center justify-center"><p>A carregar equipa...</p></main>;
  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-5"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">MAIMA CALL CENTER</p><h1 className="text-xl font-bold">Equipa e acessos</h1></div><div className="flex gap-2"><Link href="/admin/operacao" className="rounded-lg border px-3 py-2 text-sm font-semibold">CRM operacional</Link><button onClick={logout} className="rounded-lg border px-3 py-2 text-sm">Sair</button></div></div></header>
    <section className="mx-auto max-w-6xl px-5 py-8">
      <div><h2 className="text-2xl font-bold">Gestão de utilizadores</h2><p className="mt-1 text-sm leading-6 text-slate-600">Os utilizadores criam a sua conta em “Criar conta”. Depois, o administrador atribui o perfil adequado e ativa ou suspende o acesso.</p></div>
      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">Segurança: atribua os perfis de operador e coordenador apenas a pessoas autorizadas pela MAIMA. Não partilhe contas. O perfil de administrador deve ficar limitado a responsáveis de confiança.</div>
      {error&&<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice&&<p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <div className="mt-5 space-y-3">{rows.map(member=><article key={member.user_id} className="flex flex-col justify-between gap-4 rounded-xl border bg-white p-4 sm:flex-row sm:items-center"><div><p className="font-semibold">{member.nome||"Nome por preencher"}</p><p className="text-sm text-slate-600">{member.email}</p><p className="mt-1 text-xs text-slate-400">Perfil criado: {new Intl.DateTimeFormat("pt-PT",{dateStyle:"medium"}).format(new Date(member.criado_em))}</p></div><div className="flex flex-wrap items-center gap-2"><select aria-label={"Perfil de "+member.email} disabled={member.user_id===me} value={member.role} onChange={e=>setRows(old=>old.map(x=>x.user_id===member.user_id?{...x,role:e.target.value}:x))} className="rounded-lg border px-3 py-2 text-sm">{ROLES.map(role=><option key={role} value={role}>{role}</option>)}</select><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={member.ativo} disabled={member.user_id===me} onChange={e=>setRows(old=>old.map(x=>x.user_id===member.user_id?{...x,ativo:e.target.checked}:x))}/> Ativo</label><button disabled={saving===member.user_id||member.user_id===me} onClick={()=>void save(member)} className="rounded-lg bg-[#103B70] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving===member.user_id?"A guardar...":"Guardar"}</button></div></article>)}{rows.length===0&&<p className="rounded-lg border bg-white p-8 text-center text-sm text-slate-500">Não existem perfis registados.</p>}</div>
    </section>
  </main>;
}
