import Link from "next/link";

export const metadata = { title: "Termos de utilização", robots: { index: false, follow: false } };

export default function TermsPage() {
  return (
    <main className="container max-w-3xl py-16">
      <Link href="/" className="text-sm font-bold text-[#a9772c]">← Voltar ao início</Link>
      <h1 className="mt-8 text-4xl font-bold text-[#10243a]">Termos de utilização</h1>
      <p className="mt-5 leading-8 text-slate-600">Esta página é um marcador de desenvolvimento. Os termos definitivos devem identificar corretamente a entidade responsável pelo website, os contactos oficiais, as regras de utilização e demais informações legalmente exigíveis.</p>
    </main>
  );
}
