import Link from "next/link";

export const metadata = {
  title: "Cookies",
  description: "Informação sobre cookies e tecnologias de sessão no website MAIMA CALL CENTER.",
  robots: { index: false, follow: false },
};

export default function CookiesPage() {
  return (
    <main className="container max-w-3xl py-16">
      <Link href="/" className="text-sm font-bold text-[#103B70]">← Voltar ao início</Link>
      <h1 className="mt-8 text-4xl font-bold text-[#103B70]">Cookies e tecnologias de sessão</h1>
      <p className="mt-3 text-sm text-slate-500">Versão de trabalho: 15 de novembro de 2026</p>
      <p className="mt-5 leading-8 text-slate-600">A área reservada utiliza mecanismos técnicos de sessão e autenticação necessários para permitir iniciar sessão, manter o acesso e proteger as páginas privadas. Estes mecanismos são essenciais ao funcionamento da conta.</p>
      <p className="mt-4 leading-8 text-slate-600">Não foi identificada uma ferramenta de publicidade ou análise de audiência configurada no código analisado. Esta informação deve ser revista caso sejam adicionados serviços de estatística, marketing, mapas, vídeos incorporados ou outras tecnologias de terceiros.</p>
      <p className="mt-4 leading-8 text-slate-600">A versão atual ainda não inclui um centro de preferências nem um mecanismo de consentimento para tecnologias não essenciais. Antes de adicionar cookies não essenciais, a MAIMA deverá avaliar os requisitos aplicáveis e implementar a escolha do utilizador.</p>
      <p className="mt-8 text-sm text-slate-500">Para informação sobre dados pessoais, consulte a <Link href="/privacidade" className="font-semibold text-emerald-700 underline">informação de privacidade</Link>.</p>
    </main>
  );
}
