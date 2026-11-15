import Link from "next/link";

export const metadata = {
  title: "Termos de utilização",
  description: "Condições gerais de utilização do website e das áreas reservadas MAIMA CALL CENTER.",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <main className="container max-w-3xl py-16">
      <Link href="/" className="text-sm font-bold text-[#103B70]">← Voltar ao início</Link>
      <h1 className="mt-8 text-4xl font-bold text-[#103B70]">Termos de utilização</h1>
      <p className="mt-3 text-sm text-slate-500">Versão de trabalho: 15 de novembro de 2026</p>
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
        Estes termos são uma base provisória de utilização do website. Não substituem os contratos de prestação de serviços que a MAIMA celebrar com clientes empresariais e devem ser revistos juridicamente antes da operação comercial em Portugal.
      </div>

      <h2 className="mt-9 text-xl font-bold text-[#103B70]">1. Âmbito</h2>
      <p className="mt-3 leading-8 text-slate-600">O website apresenta a MAIMA CALL CENTER e permite enviar pedidos de contacto. As áreas reservadas disponibilizam funcionalidades de conta, pedidos, campanhas, contratos, faturação e comprovativos, de acordo com o perfil e as funcionalidades ativadas para cada utilizador.</p>

      <h2 className="mt-8 text-xl font-bold text-[#103B70]">2. Contas e acessos</h2>
      <p className="mt-3 leading-8 text-slate-600">Cada utilizador deve manter a confidencialidade das suas credenciais, utilizar uma conta individual e comunicar à MAIMA qualquer suspeita de acesso não autorizado. As permissões dependem do perfil atribuído. A MAIMA poderá suspender um acesso quando exista motivo de segurança ou utilização indevida, respeitando os procedimentos e obrigações aplicáveis.</p>

      <h2 className="mt-8 text-xl font-bold text-[#103B70]">3. Utilização adequada</h2>
      <p className="mt-3 leading-8 text-slate-600">Não é permitido utilizar o website para fins ilícitos, introduzir dados sem autorização, tentar aceder a informação de terceiros, comprometer a segurança do serviço ou enviar conteúdos abusivos, fraudulentos ou maliciosos. Os utilizadores internos devem respeitar as instruções da MAIMA, as regras da campanha e as permissões do seu perfil.</p>

      <h2 className="mt-8 text-xl font-bold text-[#103B70]">4. Pedidos, campanhas e contratos</h2>
      <p className="mt-3 leading-8 text-slate-600">O envio de um pedido através do formulário não constitui, por si só, uma proposta aceite nem um contrato de prestação de serviços. O âmbito, preço, níveis de serviço, responsabilidades, critérios de validação, cancelamentos e demais condições serão definidos em documento contratual próprio entre as partes.</p>

      <h2 className="mt-8 text-xl font-bold text-[#103B70]">5. Faturação e comprovativos</h2>
      <p className="mt-3 leading-8 text-slate-600">A área reservada pode disponibilizar documentos de cobrança e permitir o envio de comprovativos para análise. O envio de um comprovativo não equivale à confirmação do pagamento. O estado apenas será atualizado após revisão pela MAIMA. Os requisitos fiscais, a identificação da entidade emitente e a validade dos documentos de faturação devem ser confirmados nos documentos oficiais da empresa.</p>

      <h2 className="mt-8 text-xl font-bold text-[#103B70]">6. Informação e disponibilidade</h2>
      <p className="mt-3 leading-8 text-slate-600">A MAIMA procura manter a informação atualizada e o website disponível, mas não garante funcionamento ininterrupto nem ausência absoluta de erros. Algumas funcionalidades podem ser alteradas, suspensas ou sujeitas a manutenção. Os indicadores apresentados no portal dependem dos dados registados e validados na operação.</p>

      <h2 className="mt-8 text-xl font-bold text-[#103B70]">7. Propriedade intelectual</h2>
      <p className="mt-3 leading-8 text-slate-600">Os elementos de marca, textos, imagens e conteúdos próprios do website não podem ser reproduzidos ou utilizados comercialmente sem autorização, salvo quando a lei o permita. A utilização de marcas de clientes ou parceiros depende de autorização específica.</p>

      <h2 className="mt-8 text-xl font-bold text-[#103B70]">8. Privacidade e alterações</h2>
      <p className="mt-3 leading-8 text-slate-600">A utilização de dados pessoais é descrita na <Link href="/privacidade" className="font-semibold text-emerald-700 underline">informação de privacidade</Link>. Estes termos poderão ser atualizados para refletir alterações legais, técnicas ou operacionais. A versão aplicável deverá ser identificada e disponibilizada no website.</p>

      <h2 className="mt-8 text-xl font-bold text-[#103B70]">9. Identificação e contacto</h2>
      <p className="mt-3 leading-8 text-slate-600">A localização indicada no projeto é Rua de Pavel, n.º 179, S11, Z1, Q2, Bairro Capalanca, Município de Mulenvos, Província de Luanda, Angola. A denominação jurídica completa, número de identificação fiscal e contactos oficiais ainda devem ser inseridos e confirmados.</p>
      <p className="mt-10 border-t border-slate-200 pt-5 text-xs leading-6 text-slate-400">Documento-base sujeito a revisão jurídica. As condições específicas dos serviços dependem do contrato celebrado entre a MAIMA e cada entidade contratante.</p>
    </main>
  );
}
