import Link from "next/link";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, Check, CheckCircle2,
  ClipboardCheck, Headset, Layers3, MessageSquareText, ShieldCheck, Target, Users,
} from "lucide-react";
import Header from "@/components/Header";
import ContactForm from "@/components/ContactForm";
import InviteRecoveryRedirect from "@/components/InviteRecoveryRedirect";

const services = [
  {
    icon: Headset,
    title: "Angariação comercial",
    text: "Contactos comerciais estruturados para apoiar a identificação e conversão de potenciais clientes.",
  },
  {
    icon: Target,
    title: "Qualificação de contactos",
    text: "Processos organizados para compreender necessidades e encaminhar oportunidades relevantes.",
  },
  {
    icon: ClipboardCheck,
    title: "Validação e qualidade",
    text: "Atenção aos critérios acordados, registos claros e verificação dos elementos essenciais.",
  },
  {
    icon: BarChart3,
    title: "Acompanhamento operacional",
    text: "Indicadores de atividade e análise contínua para apoiar decisões e melhoria de processos.",
  },
];

const principles = [
  "Guiões comerciais aprovados com a entidade contratante",
  "Registo e acompanhamento através de CRM definido para a operação",
  "Revisão de qualidade e análise de motivos de cancelamento",
  "Crescimento gradual com base em resultados verificados",
];

export default function HomePage() {
  return (
    <>
      <InviteRecoveryRedirect />
      <Header />
      <main>
        
<section
  id="inicio"
  className="relative isolate overflow-hidden bg-[#092B52] text-white"
  style={{
    backgroundImage:
      "linear-gradient(rgba(9,43,82,0.72), rgba(9,43,82,0.78)), url('/hero-call-center.jpeg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}
>

          <div className="absolute inset-0 -z-10 opacity-40" aria-hidden="true">
            <div className="absolute -right-24 -top-40 h-[540px] w-[540px] rounded-full border border-white/10" />
            <div className="absolute -right-4 -top-20 h-[380px] w-[380px] rounded-full border border-white/10" />
            <div className="absolute bottom-0 right-0 h-2/3 w-1/2 bg-gradient-to-l from-[#16834A]/10 to-transparent" />
          </div>
          <div className="container grid min-h-[650px] items-center gap-14 py-20 lg:grid-cols-[1.12fr_.88fr] lg:py-24">
            <div className="max-w-2xl">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wide text-slate-200">
                <span className="h-2 w-2 rounded-full bg-[#16834A]" /> Operações comerciais com método
              </div>
              <h1 className="text-4xl font-extrabold leading-[1.06] tracking-[-.05em] sm:text-5xl lg:text-[4.25rem]">
                Cada contacto é uma oportunidade de <span className="text-[#1A9A58]">criar valor.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
                Estruturamos operações de angariação comercial com foco na qualidade do contacto, no acompanhamento dos processos e na melhoria contínua.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="#contacto" className="btn btn-primary">Solicitar proposta <ArrowUpRight size={17} /></Link>
                <Link href="#servicos" className="btn btn-outline">Conhecer os serviços <ArrowDownRight size={17} /></Link>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/15 pt-6 text-sm text-slate-300">
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#1A9A58]" /> Processo estruturado</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#1A9A58]" /> Foco na qualidade</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#1A9A58]" /> Evolução mensurável</span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[470px]">
              <div className="absolute -inset-5 rounded-[30px] border border-white/10" />
              <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[.06] p-6 shadow-2xl backdrop-blur sm:p-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#1A9A58]">O nosso compromisso</p>
                    <p className="mt-2 text-xl font-bold">Qualidade em cada etapa</p>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#16834A]/15 text-[#1A9A58]"><ShieldCheck size={25} /></span>
                </div>
                <div className="space-y-5 py-6">
                  {[
                    ["01", "Preparar", "Alinhar objetivos, informação e critérios."],
                    ["02", "Executar", "Trabalhar com processos e registos definidos."],
                    ["03", "Validar", "Acompanhar qualidade e corrigir desvios."],
                    ["04", "Melhorar", "Usar dados para orientar a evolução."],
                  ].map(([n, title, desc]) => (
                    <div key={n} className="flex gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-xs font-bold text-[#1A9A58]">{n}</span>
                      <div><p className="font-bold">{title}</p><p className="mt-1 text-sm leading-6 text-slate-300">{desc}</p></div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-[#16834A]/20 bg-[#16834A]/10 p-4 text-sm leading-6 text-slate-200">
                  A prioridade é construir uma operação sustentável — não apenas aumentar o volume de contactos.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-100 bg-white">
          <div className="container grid gap-6 py-7 sm:grid-cols-3">
            {[
              ["Método", "Processos definidos e acompanhados"],
              ["Qualidade", "Validação e melhoria contínua"],
              ["Parceria", "Objetivos alinhados com cada cliente"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3">
                <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-[#16834A]"><Check size={17} /></span>
                <div><p className="font-bold text-[#103B70]">{title}</p><p className="mt-1 text-sm text-slate-500">{desc}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section id="empresa" className="section">
          <div className="container grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <span className="eyebrow">Quem somos</span>
              <h2 className="section-title mt-4">Uma operação comercial pensada para crescer com consistência.</h2>
              <p className="section-copy mt-6">
                A MAIMA CALL CENTER é um projeto empresarial sediado em Luanda, Angola, concebido para apoiar empresas que atuam no mercado português através de operações de angariação comercial organizadas.
              </p>
              <p className="section-copy mt-4">
                A abordagem privilegia a preparação da equipa, a clareza da comunicação, o controlo de qualidade e a análise dos resultados antes de qualquer expansão.
              </p>
              <Link href="#metodo" className="mt-7 inline-flex items-center gap-2 font-bold text-[#103B70] hover:text-[#16834A]">
                Conheça a nossa abordagem <ArrowRight size={17} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-[#103B70] p-6 text-white sm:p-8">
                <Layers3 className="mb-8 text-[#1A9A58]" size={29} />
                <p className="text-lg font-bold">Processos claros</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Papéis, etapas e critérios definidos para cada operação.</p>
              </div>
              <div className="mt-8 rounded-2xl bg-[#f7f8fa] p-6 sm:p-8">
                <MessageSquareText className="mb-8 text-[#16834A]" size={29} />
                <p className="text-lg font-bold text-[#103B70]">Comunicação</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">Contactos profissionais, transparentes e orientados para o cliente.</p>
              </div>
              <div className="rounded-2xl bg-[#f7f8fa] p-6 sm:p-8">
                <BarChart3 className="mb-8 text-[#16834A]" size={29} />
                <p className="text-lg font-bold text-[#103B70]">Medição</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">Acompanhamento dos indicadores acordados com o cliente.</p>
              </div>
              <div className="mt-8 rounded-2xl border border-slate-200 p-6 sm:p-8">
                <Users className="mb-8 text-[#103B70]" size={29} />
                <p className="text-lg font-bold text-[#103B70]">Equipa acompanhada</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">Formação, supervisão e evolução com base na qualidade.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="servicos" className="section bg-[#f7f8fa]">
          <div className="container">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div>
                <span className="eyebrow">O que fazemos</span>
                <h2 className="section-title mt-4">Apoio comercial ao longo do processo.</h2>
              </div>
              <p className="section-copy max-w-md">O âmbito final de cada serviço é definido com a entidade contratante, de acordo com os objetivos, os recursos e os requisitos aplicáveis.</p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {services.map(({ icon: Icon, title, text }) => (
                <article key={title} className="card group p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#103B70] text-[#1A9A58] transition group-hover:bg-[#16834A] group-hover:text-[#103B70]"><Icon size={23} /></span>
                  <h3 className="mt-6 text-lg font-bold text-[#103B70]">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-500">{text}</p>
                  <Link href="#contacto" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#103B70]">Falar sobre este serviço <ArrowRight size={15} /></Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="metodo" className="section">
          <div className="container grid gap-14 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              <span className="eyebrow">Como trabalhamos</span>
              <h2 className="section-title mt-4">Um método simples. Uma execução acompanhada.</h2>
              <p className="section-copy mt-6">Cada campanha começa com alinhamento e preparação. A operação é acompanhada por indicadores, validação e ciclos de melhoria.</p>
              <div className="mt-8 rounded-2xl bg-[#103B70] p-6 text-white">
                <ShieldCheck className="mb-4 text-[#1A9A58]" size={28} />
                <p className="text-lg font-bold">Qualidade antes do volume</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">O crescimento deve depender de resultados consistentes, conformidade e capacidade operacional.</p>
              </div>
            </div>
            <div className="space-y-0">
              {[
                ["01", "Alinhamento", "Definir objetivos, público, proposta comercial, indicadores e critérios de validação."],
                ["02", "Preparação", "Confirmar guiões, formação, ferramentas, origem dos contactos e procedimentos."],
                ["03", "Operação e acompanhamento", "Executar a campanha com registos, supervisão e análise periódica."],
                ["04", "Revisão e melhoria", "Identificar oportunidades, corrigir falhas e avaliar resultados antes de escalar."],
              ].map(([number, title, text], i) => (
                <div key={number} className="relative flex gap-5 pb-8 last:pb-0">
                  {i < 3 && <span aria-hidden="true" className="absolute left-[19px] top-11 h-[calc(100%-20px)] w-px bg-slate-200" />}
                  <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#16834A] bg-white text-xs font-extrabold text-[#16834A]">{number}</span>
                  <div className="pb-2">
                    <h3 className="text-lg font-bold text-[#103B70]">{title}</h3>
                    <p className="mt-2 max-w-xl text-sm leading-7 text-slate-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f8fa] py-16">
          <div className="container grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="eyebrow">Compromisso operacional</span>
              <h2 className="section-title mt-4">Trabalhar com transparência, controlo e responsabilidade.</h2>
              <p className="section-copy mt-5">Os procedimentos concretos são acordados antes do início de cada campanha e devem respeitar as obrigações contratuais e legais aplicáveis.</p>
            </div>
            <ul className="space-y-4">
              {principles.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700"><CheckCircle2 className="mt-0.5 shrink-0 text-[#16834A]" size={19} />{item}</li>)}
            </ul>
          </div>
        </section>

        <section id="contacto" className="bg-[#092B52] py-20 sm:py-24">
          <div className="container grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
            <div className="pt-4 text-white">
              <span className="eyebrow">Contactos comerciais</span>
              <h2 className="mt-4 text-4xl font-extrabold leading-tight tracking-[-.045em] sm:text-5xl">Vamos conversar sobre os seus objetivos?</h2>
              <p className="mt-6 max-w-lg text-base leading-8 text-slate-300">Conte-nos o que pretende alcançar. Podemos analisar o enquadramento da operação e conversar sobre os próximos passos.</p>
              <div className="mt-9 space-y-5 border-t border-white/15 pt-7">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.15em] text-[#1A9A58]">Localização indicada no projeto</p>
                  <p className="mt-2 leading-7 text-slate-200">Rua de Pavel, n.º 179, S11, Z1, Q2<br />Bairro Capalanca, Município de Mulenvos<br />Luanda, Angola</p>
                </div>
                <p className="max-w-md text-xs leading-5 text-slate-400">Os contactos telefónicos e o email comercial serão acrescentados depois de confirmados pela empresa.</p>
              </div>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
      <footer className="bg-[#071E3A] py-7 text-slate-400">
        <div className="container flex flex-col gap-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MAIMA CALL CENTER. Todos os direitos reservados.</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/privacidade" className="hover:text-white">Privacidade</Link>
            <Link href="/cookies" className="hover:text-white">Cookies</Link>
            <Link href="/termos" className="hover:text-white">Termos de utilização</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
