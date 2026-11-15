"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Profile = { user_id: string; nome: string | null; email: string; role: string; cliente_id: string | null; ativo: boolean };
type Cliente = { id: string; nome_empresa: string; estado: string };
type Campaign = { id: string; cliente_id: string; codigo: string; nome: string; setor: string; mercado: string; estado: string; valor_por_contrato_validado: number | null; moeda: string };
type Lead = { id: string; campanha_id: string; nome: string; telefone: string | null; email: string | null; origem: string; autorizacao_utilizacao: string; estado: string; operador_id: string | null; observacoes_operador: string | null; proxima_acao_em: string | null; nao_contactar: boolean };
type Call = { id: string; lead_id: string; campanha_id: string; operador_id: string; chamada_em: string; resultado: string; duracao_segundos: number | null; notas: string | null; retorno_em: string | null; consentimento_confirmado: boolean };
type Contract = { id: string; lead_id: string; campanha_id: string; operador_id: string; referencia_externa: string | null; estado: string; submetido_em: string; validado_em: string | null; motivo_rejeicao: string | null; motivo_cancelamento: string | null };
type Quality = { id: string; operador_id: string; pontuacao: number; falhas_identificadas: string | null; acao_corretiva: string | null; avaliado_em: string };
type Comissao = { id:string; contrato_id:string; campanha_id:string; operador_id:string; valor:number|null; moeda:string; estado:string };

const LEAD_STATES = ["nova","atribuida","em_contacto","qualificada","proposta_apresentada","contrato_submetido","sem_interesse","nao_contactar","fechada"];
const CALL_OUTCOMES = [
  ["atendida","Atendida"],["nao_atendida","Não atendeu"],["ocupado","Ocupado"],
  ["retorno_agendado","Retorno agendado"],["interessado","Interessado"],["sem_interesse","Sem interesse"],
  ["numero_invalido","Número inválido"],["nao_contactar","Não voltar a contactar"],
];
const CONTRACT_STATES = ["submetido","em_validacao","validado","ativado","rejeitado","cancelado","chargeback"];
function parseCSVRows(input:string): string[][] {
  const firstLine=input.split(/\r?\n/,1)[0]||"";
  const delimiter=(firstLine.match(/;/g)||[]).length>(firstLine.match(/,/g)||[]).length?";":",";
  const rows:string[][]=[];let row:string[]=[];let field="";let quoted=false;
  for(let i=0;i<input.length;i++){
    const ch=input[i];
    if(ch==='"'&&quoted&&input[i+1]==='"'){field+='"';i++;continue;}
    if(ch==='"'){quoted=!quoted;continue;}
    if(ch===delimiter&&!quoted){row.push(field.trim());field="";continue;}
    if((ch==="\n"||ch==="\r")&&!quoted){
      if(ch==="\r"&&input[i+1]==="\n")i++;
      row.push(field.trim());field="";
      if(row.some(cell=>cell.length>0))rows.push(row);
      row=[];continue;
    }
    field+=ch;
  }
  row.push(field.trim());if(row.some(cell=>cell.length>0))rows.push(row);
  return rows;
}
function csvHeader(value:string){return value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[\s-]+/g,"_");}

const label = (v: string) => ({
  nova:"Nova", atribuida:"Atribuída", em_contacto:"Em contacto", qualificada:"Qualificada",
  proposta_apresentada:"Proposta apresentada", contrato_submetido:"Contrato submetido",
  sem_interesse:"Sem interesse", nao_contactar:"Não contactar", fechada:"Fechada",
  planeada:"Planeada", ativa:"Ativa", pausada:"Pausada", concluida:"Concluída", cancelada:"Cancelada",
  submetido:"Submetido", em_validacao:"Em validação", validado:"Validado", ativado:"Ativado",
  rejeitado:"Rejeitado", chargeback:"Chargeback",
}[v] || v);

export default function OperacaoPage() {
  const router = useRouter();
  const [profile,setProfile] = useState<Profile|null>(null);
  const [clientes,setClientes] = useState<Cliente[]>([]);
  const [team,setTeam] = useState<Profile[]>([]);
  const [campaigns,setCampaigns] = useState<Campaign[]>([]);
  const [leads,setLeads] = useState<Lead[]>([]);
  const [calls,setCalls] = useState<Call[]>([]);
  const [contracts,setContracts] = useState<Contract[]>([]);
  const [quality,setQuality] = useState<Quality[]>([]);
  const [comissoes,setComissoes] = useState<Comissao[]>([]);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [campaignForm,setCampaignForm] = useState({cliente_id:"",codigo:"",nome:"",setor:"Energia",mercado:"Portugal",data_inicio:"",data_fim:"",valor:"",guiao_comercial:""});
  const [leadForm,setLeadForm] = useState({campanha_id:"",nome:"",telefone:"",email:"",origem:"Lead fornecida pelo contratante",operador_id:"",autorizacao_utilizacao:"pendente"});
  const [contractRef,setContractRef] = useState<Record<string,string>>({});
  const [contractReason,setContractReason] = useState<Record<string,string>>({});
  const [qualityForm,setQualityForm] = useState({chamada_id:"",pontuacao:"90",falhas_identificadas:"",acao_corretiva:"",identificacao:false,finalidade:false,proposta:false,consentimento:false,sem_pressao:false,dados_confirmados:false});
  const [saving,setSaving] = useState(false);
  const [csvCampaignId,setCsvCampaignId] = useState("");
  const [csvOperatorId,setCsvOperatorId] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const db = createClient();
    const {data:{user},error:authError} = await db.auth.getUser();
    if (authError || !user) { router.replace("/login"); return; }
    const {data:me,error:profileError} = await db.from("maima_perfis").select("user_id,nome,email,role,cliente_id,ativo").eq("user_id",user.id).maybeSingle();
    if (profileError || !me) { setError("Não foi possível confirmar o perfil de acesso. Contacte a administração."); setLoading(false); return; }
    const current = me as Profile;
    if (!current.ativo) { await db.auth.signOut(); router.replace("/login"); return; }
    if (!["admin","coordenador","operador"].includes(current.role)) { router.replace("/cliente/painel"); return; }
    setProfile(current);
    const [c, t, camp, l, ca, co, q, finance] = await Promise.all([
      db.from("maima_clientes").select("id,nome_empresa,estado").order("nome_empresa"),
      db.from("maima_perfis").select("user_id,nome,email,role,cliente_id,ativo").in("role",["operador","coordenador","admin"]).order("role"),
      db.from("maima_campanhas").select("id,cliente_id,codigo,nome,setor,mercado,estado,valor_por_contrato_validado,moeda").order("criado_em",{ascending:false}),
      db.from("maima_leads").select("id,campanha_id,nome,telefone,email,origem,autorizacao_utilizacao,estado,operador_id,observacoes_operador,proxima_acao_em,nao_contactar").order("criado_em",{ascending:false}),
      db.from("maima_chamadas").select("id,lead_id,campanha_id,operador_id,chamada_em,resultado,duracao_segundos,notas,retorno_em,consentimento_confirmado").order("chamada_em",{ascending:false}),
      db.from("maima_contratos").select("id,lead_id,campanha_id,operador_id,referencia_externa,estado,submetido_em,validado_em,motivo_rejeicao,motivo_cancelamento").order("submetido_em",{ascending:false}),
      db.from("maima_qualidade").select("id,operador_id,pontuacao,falhas_identificadas,acao_corretiva,avaliado_em").order("avaliado_em",{ascending:false}),
      db.from("maima_comissoes_contratos").select("id,contrato_id,campanha_id,operador_id,valor,moeda,estado").order("atualizado_em",{ascending:false}),
    ]);
    const firstError = [c.error,t.error,camp.error,l.error,ca.error,co.error,q.error,finance.error].find(Boolean);
    if (firstError) setError("Alguns dados não puderam ser carregados: " + firstError.message);
    setClientes((c.data??[]) as Cliente[]);
    setTeam((t.data??[]) as Profile[]);
    setCampaigns((camp.data??[]) as Campaign[]);
    setLeads((l.data??[]) as Lead[]);
    setCalls((ca.data??[]) as Call[]);
    setContracts((co.data??[]) as Contract[]);
    setQuality((q.data??[]) as Quality[]);
    setComissoes((finance.data??[]) as Comissao[]);
    setLoading(false);
  },[router]);

  useEffect(()=>{void load();},[load]);

  const canManage = profile?.role === "admin" || profile?.role === "coordenador";
  const operators = team.filter(p=>p.role==="operador" && p.ativo);
  const counts = useMemo(()=>({
    leads:leads.length,
    calls:calls.length,
    submitted:contracts.filter(c=>["submetido","em_validacao"].includes(c.estado)).length,
    validated:contracts.filter(c=>["validado","ativado"].includes(c.estado)).length,
    chargebacks:contracts.filter(c=>c.estado==="chargeback").length,
    blocked:leads.filter(l=>l.nao_contactar).length,
    fees:comissoes.filter(c=>c.estado==="ativa" && c.valor!==null).length,
  }),[leads,calls,contracts,comissoes]);

  async function createCampaign(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); if(!profile) return;
    setSaving(true); setError(""); setNotice("");
    const amount=campaignForm.valor.trim()===""?null:Number(campaignForm.valor.replace(",","."));
    if(amount!==null && (!Number.isFinite(amount)||amount<0)){setError("Indique um valor válido por contrato validado.");setSaving(false);return;}
    const {error:insertError}=await createClient().from("maima_campanhas").insert({
      cliente_id:campaignForm.cliente_id,codigo:campaignForm.codigo.trim(),nome:campaignForm.nome.trim(),
      setor:campaignForm.setor,mercado:campaignForm.mercado,
      valor_por_contrato_validado:amount,criado_por:profile.user_id,
      data_inicio:campaignForm.data_inicio||null,data_fim:campaignForm.data_fim||null,
      guiao_comercial:campaignForm.guiao_comercial.trim()||null,
    });
    if(insertError) setError("Não foi possível criar a campanha: "+insertError.message);
    else {setNotice("Campanha criada.");setCampaignForm({cliente_id:"",codigo:"",nome:"",setor:"Energia",mercado:"Portugal",data_inicio:"",data_fim:"",valor:"",guiao_comercial:""});await load();}
    setSaving(false);
  }

  async function createLead(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setSaving(true); setError(""); setNotice("");
    const authorised=leadForm.autorizacao_utilizacao==="autorizada";
    const {error:insertError}=await createClient().from("maima_leads").insert({
      campanha_id:leadForm.campanha_id,nome:leadForm.nome.trim(),telefone:leadForm.telefone.trim()||null,
      email:leadForm.email.trim()||null,origem:leadForm.origem.trim(),
      autorizacao_utilizacao:leadForm.autorizacao_utilizacao,
      autorizacao_comprovada_em:authorised?new Date().toISOString():null,
      operador_id:leadForm.operador_id||null,estado:leadForm.operador_id?"atribuida":"nova",
      criado_por:profile?.user_id,
    });
    if(insertError) setError("Não foi possível registar a lead: "+insertError.message);
    else {setNotice("Lead registada. Só poderá ser contactada depois de confirmada a autorização de utilização.");setLeadForm({campanha_id:"",nome:"",telefone:"",email:"",origem:"Lead fornecida pelo contratante",operador_id:"",autorizacao_utilizacao:"pendente"});await load();}
    setSaving(false);
  }

  async function importCSV(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if(!profile)return;
    const form=e.currentTarget;
    const fd=new FormData(form);
    const file=fd.get("csv_file");
    if(!(file instanceof File)||file.size===0){setError("Selecione um ficheiro CSV.");return;}
    if(!csvCampaignId){setError("Selecione a campanha para importar as leads.");return;}
    if(file.size>5*1024*1024){setError("O ficheiro CSV não pode ultrapassar 5 MB.");return;}
    setSaving(true);setError("");setNotice("");
    try{
      const parsed=parseCSVRows(await file.text());
      if(parsed.length<2)throw new Error("O ficheiro não contém linhas de dados.");
      const headers=parsed[0].map(csvHeader);
      const idx=(...names:string[])=>headers.findIndex(h=>names.includes(h));
      const nameIdx=idx("nome","name");
      const phoneIdx=idx("telefone","telemovel","phone");
      const emailIdx=idx("email","e_mail");
      const sourceIdx=idx("origem","source");
      const refIdx=idx("referencia_origem","referencia","source_reference");
      const authIdx=idx("autorizacao_utilizacao","autorizacao","authorization");
      if(nameIdx<0||sourceIdx<0||(phoneIdx<0&&emailIdx<0))throw new Error("Cabeçalhos obrigatórios: nome, telefone ou email e origem.");
      const existing=new Set<string>();
      leads.filter(l=>l.campanha_id===csvCampaignId).forEach(l=>{
        if(l.telefone)existing.add("p:"+l.telefone.replace(/\D/g,""));
        if(l.email)existing.add("e:"+l.email.trim().toLowerCase());
      });
      const batch:string[]=[];
      const payload:any[]=[];
      let duplicates=0;
      for(const cells of parsed.slice(1)){
        const value=(i:number)=>i>=0?(cells[i]||"").trim():"";
        const nome=value(nameIdx),telefone=value(phoneIdx),email=value(emailIdx),origem=value(sourceIdx);
        if(!nome||!origem||(!telefone&&!email))continue;
        const phoneKey=telefone?"p:"+telefone.replace(/\D/g,""):"";
        const emailKey=email?"e:"+email.toLowerCase():"";
        if((phoneKey&&existing.has(phoneKey))||(emailKey&&existing.has(emailKey))){duplicates++;continue;}
        if(phoneKey)existing.add(phoneKey);if(emailKey)existing.add(emailKey);
        const auth=value(authIdx).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
        const authorised=["autorizada","autorizado","sim","yes","true","1"].includes(auth);
        const denied=["nao_autorizada","nao autorizado","nao autorizada","nao","no","false","0"].includes(auth);
        payload.push({
          campanha_id:csvCampaignId,nome,telefone:telefone||null,email:email||null,origem,
          referencia_origem:value(refIdx)||null,
          autorizacao_utilizacao:authorised?"autorizada":denied?"nao_autorizada":"pendente",
          autorizacao_comprovada_em:authorised?new Date().toISOString():null,
          operador_id:csvOperatorId||null,estado:csvOperatorId?"atribuida":"nova",
          lote_importacao:crypto.randomUUID(),criado_por:profile.user_id,
        });
      }
      if(payload.length===0)throw new Error("Não foram encontradas leads válidas novas para importar.");
      if(payload.length>500)throw new Error("O ficheiro contém mais de 500 leads novas. Divida a importação em ficheiros mais pequenos.");
      const {error:insertError}=await createClient().from("maima_leads").insert(payload);
      if(insertError)throw new Error(insertError.message);
      setNotice(payload.length+" lead(s) importada(s). "+duplicates+" duplicada(s) ignorada(s). Leads sem autorização confirmada permanecem bloqueadas para chamadas.");
      form.reset();setCsvCampaignId("");setCsvOperatorId("");
      await load();
    }catch(err){setError(err instanceof Error?err.message:"Falha ao importar o ficheiro CSV.");}
    finally{setSaving(false);}
  }

  async function assignLead(lead:Lead,operatorId:string) {
    setError("");setNotice("");
    const {error:updateError}=await createClient().from("maima_leads").update({operador_id:operatorId||null,estado:operatorId?"atribuida":"nova"}).eq("id",lead.id);
    if(updateError) setError("Não foi possível atribuir a lead: "+updateError.message);
    else {setNotice("Atribuição atualizada.");await load();}
  }

  async function addCall(e:FormEvent<HTMLFormElement>,lead:Lead) {
    e.preventDefault();
    if(!profile)return;
    if(lead.autorizacao_utilizacao!=="autorizada" || lead.nao_contactar){setError("Esta lead não está autorizada para contacto.");return;}
    const form=e.currentTarget;
    const fd=new FormData(form);
    setSaving(true);setError("");setNotice("");
    const {error:insertError}=await createClient().from("maima_chamadas").insert({
      lead_id:lead.id,campanha_id:lead.campanha_id,operador_id:profile.user_id,
      tentativa_numero:calls.filter(c=>c.lead_id===lead.id).length+1,
      resultado:String(fd.get("resultado")),
      duracao_segundos:fd.get("duracao")?Number(fd.get("duracao")):null,
      notas:String(fd.get("notas")||"").trim()||null,
      retorno_em:fd.get("retorno_em")?new Date(String(fd.get("retorno_em"))).toISOString():null,
      consentimento_confirmado:fd.get("consentimento_confirmado")==="on",
      consentimento_em:fd.get("consentimento_confirmado")==="on"?new Date().toISOString():null,
    });
    if(insertError) setError("Não foi possível registar a chamada: "+insertError.message);
    else {setNotice("Chamada registada.");form.reset();await load();}
    setSaving(false);
  }

  async function submitContract(e:FormEvent<HTMLFormElement>,lead:Lead) {
    e.preventDefault();if(!profile)return;
    const hasConsent = calls.some(c=>c.lead_id===lead.id && c.resultado==="interessado" && c.consentimento_confirmado);
    if(!hasConsent){setError("Antes de submeter o contrato, registe uma chamada com resultado “Interessado” e confirmação do consentimento.");return;}
    setSaving(true);setError("");setNotice("");
    const {error:insertError}=await createClient().from("maima_contratos").insert({
      lead_id:lead.id,campanha_id:lead.campanha_id,operador_id:profile.user_id,
      referencia_externa:contractRef[lead.id]?.trim()||null,estado:"submetido",
    });
    if(insertError) setError("Não foi possível submeter o contrato: "+insertError.message);
    else {setNotice("Contrato registado como submetido. Aguarda validação.");setContractRef(v=>({...v,[lead.id]:""}));await load();}
    setSaving(false);
  }

  async function changeContract(contract:Contract,status:string) {
    const patch:any={estado:status};
    if(status==="rejeitado") patch.motivo_rejeicao=contractReason[contract.id]||null;
    if(status==="cancelado"||status==="chargeback") patch.motivo_cancelamento=contractReason[contract.id]||null;
    const {error:updateError}=await createClient().from("maima_contratos").update(patch).eq("id",contract.id);
    if(updateError) setError("Não foi possível atualizar o contrato: "+updateError.message);
    else {setNotice("Estado do contrato atualizado.");await load();}
  }

  async function reviewQuality(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();if(!profile)return;
    const selected=calls.find(c=>c.id===qualityForm.chamada_id);
    const lead=selected?leads.find(l=>l.id===selected.lead_id):null;
    if(!selected||!lead){setError("Selecione uma chamada válida.");return;}
    const score=Number(qualityForm.pontuacao);
    if(!Number.isInteger(score)||score<0||score>100){setError("A pontuação tem de estar entre 0 e 100.");return;}
    const {error:insertError}=await createClient().from("maima_qualidade").insert({
      chamada_id:selected.id,lead_id:lead.id,campanha_id:selected.campanha_id,operador_id:selected.operador_id,
      avaliador_id:profile.user_id,pontuacao:score,checklist:{
        identificacao:qualityForm.identificacao,
        finalidade_contacto:qualityForm.finalidade,
        proposta_clara:qualityForm.proposta,
        consentimento:qualityForm.consentimento,
        comunicacao_sem_pressao:qualityForm.sem_pressao,
        dados_confirmados:qualityForm.dados_confirmados,
      },
      falhas_identificadas:qualityForm.falhas_identificadas.trim()||null,
      acao_corretiva:qualityForm.acao_corretiva.trim()||null,
    });
    if(insertError) setError("Não foi possível guardar a avaliação: "+insertError.message);
    else {setNotice("Avaliação de qualidade registada.");setQualityForm({chamada_id:"",pontuacao:"90",falhas_identificadas:"",acao_corretiva:"",identificacao:false,finalidade:false,proposta:false,consentimento:false,sem_pressao:false,dados_confirmados:false});await load();}
  }

  const fmt=(value:string)=>new Intl.DateTimeFormat("pt-PT",{dateStyle:"short",timeStyle:"short"}).format(new Date(value));
  const operatorName=(id:string)=>team.find(p=>p.user_id===id)?.nome||team.find(p=>p.user_id===id)?.email||"Operador";
  const campaignName=(id:string)=>campaigns.find(c=>c.id===id)?.nome||"Campanha";
  const leadName=(id:string)=>leads.find(l=>l.id===id)?.nome||"Lead";

  if(loading) return <main className="flex min-h-screen items-center justify-center bg-slate-50"><p>A carregar o CRM operacional...</p></main>;
  if(!profile) return <main className="mx-auto max-w-xl p-8"><p role="alert">{error||"Perfil indisponível."}</p></main>;

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-700">MAIMA CALL CENTER</p><h1 className="mt-1 text-xl font-bold text-slate-900">CRM operacional</h1><p className="mt-1 text-xs text-slate-500">{profile.nome||profile.email} · {profile.role}</p></div>
      <div className="flex flex-wrap gap-2"><Link href="/admin" className="rounded-lg border px-3 py-2 text-sm font-semibold">Painel administrativo</Link>{profile.role==="admin"&&<Link href="/admin/equipa" className="rounded-lg border px-3 py-2 text-sm font-semibold">Equipa e acessos</Link>}<button onClick={()=>void load()} className="rounded-lg bg-[#103B70] px-4 py-2 text-sm font-semibold text-white">Atualizar</button></div>
    </div></header>
    <section className="mx-auto max-w-7xl px-5 py-8">
      {error&&<p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice&&<p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[[counts.leads,"Leads visíveis"],[counts.calls,"Chamadas registadas"],[counts.submitted,"Em validação"],[counts.validated,"Validados / ativados"],[counts.chargebacks,"Chargebacks"],[counts.blocked,"Bloqueados"],[counts.fees,"Comissões calculadas"]].map(([v,t])=><div key={String(t)} className="rounded-xl border bg-white p-4"><p className="text-sm text-slate-500">{t}</p><p className="mt-1 text-2xl font-bold">{v}</p></div>)}
      </div>

      {canManage&&<section className="mt-8 grid gap-5 lg:grid-cols-2">
        <form onSubmit={createCampaign} className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">Criar campanha</h2><p className="mt-1 text-sm text-slate-500">Associar a campanha a uma empresa cliente.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold">Cliente<select required value={campaignForm.cliente_id} onChange={e=>setCampaignForm(v=>({...v,cliente_id:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">Selecionar cliente</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nome_empresa}</option>)}</select></label>
            <label className="text-sm font-semibold">Código<input required value={campaignForm.codigo} onChange={e=>setCampaignForm(v=>({...v,codigo:e.target.value.toUpperCase()}))} placeholder="ENERGIA-2026-01" className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label className="text-sm font-semibold sm:col-span-2">Nome da campanha<input required value={campaignForm.nome} onChange={e=>setCampaignForm(v=>({...v,nome:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label className="text-sm font-semibold">Setor<input required value={campaignForm.setor} onChange={e=>setCampaignForm(v=>({...v,setor:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label className="text-sm font-semibold">Data de início<input type="date" value={campaignForm.data_inicio} onChange={e=>setCampaignForm(v=>({...v,data_inicio:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label className="text-sm font-semibold">Data de fim<input type="date" value={campaignForm.data_fim} onChange={e=>setCampaignForm(v=>({...v,data_fim:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label className="text-sm font-semibold">Mercado<input required value={campaignForm.mercado} onChange={e=>setCampaignForm(v=>({...v,mercado:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label className="text-sm font-semibold sm:col-span-2">Valor por contrato validado (opcional)<input type="number" min="0" step="0.01" value={campaignForm.valor} onChange={e=>setCampaignForm(v=>({...v,valor:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"/><span className="text-xs font-normal text-slate-500">Deixe vazio até o valor estar confirmado por contrato.</span></label>
            <label className="text-sm font-semibold sm:col-span-2">Guião comercial aprovado<textarea rows={4} value={campaignForm.guiao_comercial} onChange={e=>setCampaignForm(v=>({...v,guiao_comercial:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" placeholder="Inserir o guião e as condições aprovadas pelo contratante."/></label>
          </div>
          <button disabled={saving||clientes.length===0} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Criar campanha</button>
        </form>
        <form onSubmit={createLead} className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">Registar uma lead</h2><p className="mt-1 text-sm text-slate-500">Guarde a origem e confirme a autorização antes de permitir chamadas.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold sm:col-span-2">Campanha<select required value={leadForm.campanha_id} onChange={e=>setLeadForm(v=>({...v,campanha_id:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">Selecionar campanha</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}</select></label>
            <label className="text-sm font-semibold">Nome<input required value={leadForm.nome} onChange={e=>setLeadForm(v=>({...v,nome:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label className="text-sm font-semibold">Telefone<input value={leadForm.telefone} onChange={e=>setLeadForm(v=>({...v,telefone:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label className="text-sm font-semibold">E-mail<input type="email" value={leadForm.email} onChange={e=>setLeadForm(v=>({...v,email:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label className="text-sm font-semibold">Origem<input required value={leadForm.origem} onChange={e=>setLeadForm(v=>({...v,origem:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
            <label className="text-sm font-semibold">Operador<select value={leadForm.operador_id} onChange={e=>setLeadForm(v=>({...v,operador_id:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">Sem atribuição</option>{operators.map(o=><option key={o.user_id} value={o.user_id}>{o.nome||o.email}</option>)}</select></label>
            <label className="text-sm font-semibold">Autorização de utilização<select value={leadForm.autorizacao_utilizacao} onChange={e=>setLeadForm(v=>({...v,autorizacao_utilizacao:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="pendente">Pendente de confirmação</option><option value="autorizada">Autorizada e verificada</option><option value="nao_autorizada">Não autorizada</option></select></label>
          </div>
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900">Apenas marque “Autorizada e verificada” quando existir confirmação documental ou contratual da autorização de utilização da lead.</p>
          <button disabled={saving||campaigns.length===0} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Guardar lead</button>
        </form>
      </section>}

      {canManage&&<form onSubmit={importCSV} className="mt-5 rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-bold">Importar leads por CSV</h2>
        <p className="mt-1 text-sm text-slate-500">Importe uma lista fornecida ou autorizada pelo contratante, associe-a à campanha e, opcionalmente, a um operador.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold">Campanha<select required value={csvCampaignId} onChange={e=>setCsvCampaignId(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">Selecionar campanha</option>{campaigns.map(c=><option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}</select></label>
          <label className="text-sm font-semibold">Atribuir a operador (opcional)<select value={csvOperatorId} onChange={e=>setCsvOperatorId(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">Sem atribuição</option>{operators.map(o=><option key={o.user_id} value={o.user_id}>{o.nome||o.email}</option>)}</select></label>
          <label className="text-sm font-semibold">Ficheiro CSV<input required type="file" name="csv_file" accept=".csv,text/csv" className="mt-1 block w-full rounded-lg border p-2 text-xs font-normal"/></label>
        </div>
        <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">Cabeçalhos: <strong>nome, telefone, email, origem, referencia_origem, autorizacao_utilizacao</strong>. São obrigatórios nome, origem e pelo menos telefone ou email. A autorização deve ser “autorizada”, “pendente” ou “nao_autorizada”. A importação limita-se a 500 leads por ficheiro e ignora duplicados encontrados na campanha.</p>
        <button disabled={saving||campaigns.length===0} className="mt-4 rounded-lg bg-[#103B70] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Importar leads</button>
      </form>}

      <section className="mt-9 rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold">Leads da operação</h2><p className="mt-1 text-sm text-slate-500">{canManage?"Distribua leads e acompanhe o trabalho da equipa.":"Consulte as leads que lhe foram atribuídas e registe cada tentativa de contacto."}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{leads.length} registos</span></div>
        <div className="mt-5 space-y-4">
          {leads.map(lead=><article key={lead.id} className="rounded-xl border border-slate-200 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="text-xs text-slate-500">{campaignName(lead.campanha_id)} · {lead.origem}</p><h3 className="mt-1 font-bold text-slate-900">{lead.nome}</h3><p className="mt-1 text-sm text-slate-600">{lead.telefone||"Sem telefone"} {lead.email?"· "+lead.email:""}</p><p className="mt-2 text-xs text-slate-500">Estado: {label(lead.estado)} · Autorização: {label(lead.autorizacao_utilizacao)}</p></div>
              {canManage&&<label className="text-xs font-semibold">Atribuir a<select value={lead.operador_id||""} onChange={e=>void assignLead(lead,e.target.value)} className="mt-1 block rounded-lg border px-2 py-2 text-sm"><option value="">Sem operador</option>{operators.map(o=><option key={o.user_id} value={o.user_id}>{o.nome||o.email}</option>)}</select></label>}
              {!canManage&&<span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{label(lead.estado)}</span>}
            </div>
            {lead.nao_contactar&&<p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">Esta pessoa foi marcada para não voltar a ser contactada.</p>}
            {profile.role==="operador"&&lead.autorizacao_utilizacao==="autorizada"&&!lead.nao_contactar&&<div className="mt-4 grid gap-4 lg:grid-cols-2">
              <form onSubmit={e=>void addCall(e,lead)} className="rounded-lg bg-slate-50 p-4">
                <h4 className="font-semibold">Registar chamada</h4>
                <label className="mt-3 block text-xs font-semibold">Resultado<select name="resultado" required className="mt-1 w-full rounded-lg border bg-white px-3 py-2">{CALL_OUTCOMES.map(([v,t])=><option key={v} value={v}>{t}</option>)}</select></label>
                <label className="mt-3 block text-xs font-semibold">Duração (segundos)<input name="duracao" type="number" min="0" className="mt-1 w-full rounded-lg border bg-white px-3 py-2"/></label>
                <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-700"><input name="consentimento_confirmado" type="checkbox" className="mt-1"/><span>O potencial cliente confirmou o consentimento necessário para avançar com a proposta/contrato, segundo o procedimento aprovado.</span></label>
                <label className="mt-3 block text-xs font-semibold">Retorno (opcional)<input name="retorno_em" type="datetime-local" className="mt-1 w-full rounded-lg border bg-white px-3 py-2"/></label>
                <label className="mt-3 block text-xs font-semibold">Notas<textarea name="notas" rows={2} className="mt-1 w-full rounded-lg border bg-white px-3 py-2"/></label>
                <button disabled={saving} className="mt-3 rounded-lg bg-[#103B70] px-4 py-2 text-sm font-semibold text-white">Guardar chamada</button>
              </form>
              {calls.some(c=>c.lead_id===lead.id && c.resultado==="interessado" && c.consentimento_confirmado) ? <form onSubmit={e=>void submitContract(e,lead)} className="rounded-lg border border-emerald-200 p-4">
                <h4 className="font-semibold">Submeter contrato</h4><p className="mt-1 text-xs leading-5 text-slate-500">Utilize depois de confirmar interesse, consentimento e todos os elementos exigidos no guião aprovado.</p>
                <label className="mt-3 block text-xs font-semibold">Referência do contrato (opcional)<input value={contractRef[lead.id]||""} onChange={e=>setContractRef(v=>({...v,[lead.id]:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
                <button disabled={saving} className="mt-3 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Registar contrato submetido</button>
              </form> : <div className="rounded-lg border border-emerald-200 p-4 text-sm text-slate-600">O registo do contrato ficará disponível depois de guardar uma chamada com resultado “Interessado” e consentimento confirmado.</div>}
            </div>}
            {profile.role==="operador"&&lead.autorizacao_utilizacao!=="autorizada"&&<p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Esta lead está bloqueada para chamadas até a coordenação confirmar a autorização.</p>}
            {calls.filter(c=>c.lead_id===lead.id).length>0&&<details className="mt-3"><summary className="cursor-pointer text-sm font-semibold text-slate-700">Histórico de chamadas ({calls.filter(c=>c.lead_id===lead.id).length})</summary><div className="mt-2 space-y-2">{calls.filter(c=>c.lead_id===lead.id).map(c=><div key={c.id} className="rounded-lg bg-slate-50 p-3 text-sm"><p className="font-semibold">{CALL_OUTCOMES.find(x=>x[0]===c.resultado)?.[1]||c.resultado} · {fmt(c.chamada_em)}</p><p className="mt-1 text-slate-600">{c.notas||"Sem observações"} {c.duracao_segundos!==null?"· "+c.duracao_segundos+" s":""}</p></div>)}</div></details>}
          </article>)}
          {leads.length===0&&<p className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-500">Ainda não existem leads atribuídas ou registadas.</p>}
        </div>
      </section>

      <section className="mt-9 rounded-2xl border bg-white p-5">
        <h2 className="text-xl font-bold">Contratos e validação</h2><p className="mt-1 text-sm text-slate-500">O contrato submetido só conta como validado depois de confirmação do contratante.</p>
        <div className="mt-4 space-y-3">{contracts.map(c=><article key={c.id} className="rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{c.referencia_externa||"Contrato sem referência"}</p><p className="mt-1 text-sm text-slate-600">{leadName(c.lead_id)} · {campaignName(c.campanha_id)}</p><p className="mt-1 text-xs text-slate-500">{fmt(c.submetido_em)} · {operatorName(c.operador_id)}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{label(c.estado)}</span></div>
          {canManage&&<div className="mt-3 flex flex-wrap gap-2"><input aria-label="Motivo de rejeição ou cancelamento" value={contractReason[c.id]||""} onChange={e=>setContractReason(v=>({...v,[c.id]:e.target.value}))} placeholder="Motivo, se aplicável" className="min-w-[220px] flex-1 rounded-lg border px-3 py-2 text-sm"/><select value={c.estado} onChange={e=>void changeContract(c,e.target.value)} className="rounded-lg border px-3 py-2 text-sm">{CONTRACT_STATES.map(s=><option key={s} value={s}>{label(s)}</option>)}</select></div>}
        </article>)}{contracts.length===0&&<p className="py-6 text-center text-sm text-slate-500">Ainda não existem contratos registados.</p>}</div>
      </section>

      {canManage&&<section className="mt-9 grid gap-5 lg:grid-cols-2">
        <form onSubmit={reviewQuality} className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">Avaliação de qualidade</h2><p className="mt-1 text-sm text-slate-500">Registe uma revisão de chamada e uma eventual ação corretiva.</p>
          <label className="mt-4 block text-sm font-semibold">Chamada<select required value={qualityForm.chamada_id} onChange={e=>setQualityForm(v=>({...v,chamada_id:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="">Selecionar chamada</option>{calls.map(c=><option key={c.id} value={c.id}>{leadName(c.lead_id)} · {fmt(c.chamada_em)} · {operatorName(c.operador_id)}</option>)}</select></label>
          <label className="mt-3 block text-sm font-semibold">Pontuação (0–100)<input required type="number" min="0" max="100" value={qualityForm.pontuacao} onChange={e=>setQualityForm(v=>({...v,pontuacao:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">{[
            ["identificacao","Identificação clara do operador"],["finalidade","Finalidade do contacto explicada"],["proposta","Proposta e condições apresentadas claramente"],["consentimento","Consentimento confirmado"],["sem_pressao","Sem pressão ou promessas indevidas"],["dados_confirmados","Dados essenciais confirmados"],
          ].map(([key,text])=><label key={key} className="flex items-start gap-2 text-xs leading-5 text-slate-700"><input type="checkbox" checked={Boolean(qualityForm[key as keyof typeof qualityForm])} onChange={e=>setQualityForm(v=>({...v,[key]:e.target.checked}))} className="mt-1"/>{text}</label>)}</div>
          <label className="mt-3 block text-sm font-semibold">Falhas identificadas<textarea value={qualityForm.falhas_identificadas} onChange={e=>setQualityForm(v=>({...v,falhas_identificadas:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2" rows={2}/></label>
          <label className="mt-3 block text-sm font-semibold">Ação corretiva<textarea value={qualityForm.acao_corretiva} onChange={e=>setQualityForm(v=>({...v,acao_corretiva:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2" rows={2}/></label>
          <button disabled={!calls.length} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Guardar avaliação</button>
        </form>
        <div className="rounded-2xl border bg-white p-5">
          <h2 className="text-lg font-bold">Indicadores por operador</h2><p className="mt-1 text-sm text-slate-500">Contagem de chamadas e contratos registados nesta operação.</p>
          <div className="mt-4 space-y-3">{operators.map(o=>{const opCalls=calls.filter(c=>c.operador_id===o.user_id);const opContracts=contracts.filter(c=>c.operador_id===o.user_id);const opValidated=opContracts.filter(c=>["validado","ativado"].includes(c.estado)).length;const fees=comissoes.filter(c=>c.operador_id===o.user_id&&c.estado==="ativa"&&c.valor!==null);const totals=fees.reduce((acc,c)=>({...acc,[c.moeda]:(acc[c.moeda]||0)+Number(c.valor)} as Record<string,number>),{} as Record<string,number>);const feeText=Object.entries(totals).map(([currency,amount])=>new Intl.NumberFormat("pt-PT",{style:"currency",currency}).format(amount)).join(" · ");return <div key={o.user_id} className="rounded-lg bg-slate-50 p-3"><p className="font-semibold">{o.nome||o.email}</p><p className="mt-1 text-sm text-slate-600">{opCalls.length} chamadas · {opContracts.length} contratos submetidos · {opValidated} validados</p><p className="mt-1 text-xs text-emerald-800">Comissões validadas: {feeText||"valor não configurado"}</p></div>})}{operators.length===0&&<p className="text-sm text-slate-500">Ainda não existem operadores ativos. O administrador pode criar as contas e atribuir os perfis em “Equipa e acessos”.</p>}</div>
        </div>
      </section>}
      <p className="mt-8 text-center text-xs leading-5 text-slate-400">As leads com autorização pendente ou não autorizada não podem ser chamadas através deste módulo. Os valores de remuneração só devem ser configurados após confirmação contratual.</p>
    </section>
  </main>;
}
