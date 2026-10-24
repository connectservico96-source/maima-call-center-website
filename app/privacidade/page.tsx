import Link from "next/link";

export const metadata = { title: "Privacidade", robots: { index: false, follow: false } };

export default function PrivacyPage() {
  return (
    <main className="container max-w-3xl py-16">
      <Link href="/" className="text-sm font-bold text-[#a9772c]">← Voltar ao início</Link>
      <h1 className="mt-8 text-4xl font-bold text-[#10243a]">Privacidade</h1>
      <p className="mt-5 leading-8 text-slate-600">Esta página é um modelo inicial e não constitui uma política de privacidade final. Antes de publicar, a MAIMA CALL CENTER deverá confirmar a entidade responsável pelo tratamento, os contactos, as finalidades, a base jurídica, os destinatários, os prazos de conservação, os direitos das pessoas e os procedimentos aplicáveis a transferências internacionais de dados.</p>
      <h2 className="mt-8 text-xl font-bold">Pedidos enviados pelo website</h2>
      <p className="mt-3 leading-8 text-slate-600">A versão inicial do formulário não transmite nem armazena dados. Quando for ligado a um serviço real, esta página deverá descrever com rigor o funcionamento implementado e os prestadores envolvidos.</p>
    </main>
  );
}
