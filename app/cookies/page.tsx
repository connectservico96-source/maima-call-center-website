import Link from "next/link";

export const metadata = { title: "Cookies", robots: { index: false, follow: false } };

export default function CookiesPage() {
  return (
    <main className="container max-w-3xl py-16">
      <Link href="/" className="text-sm font-bold text-[#a9772c]">← Voltar ao início</Link>
      <h1 className="mt-8 text-4xl font-bold text-[#10243a]">Cookies</h1>
      <p className="mt-5 leading-8 text-slate-600">Este modelo não integra ferramentas de análise ou publicidade. Se forem adicionadas cookies não essenciais ou tecnologias semelhantes, a implementação e a informação ao utilizador devem ser revistas antes da publicação.</p>
    </main>
  );
}
