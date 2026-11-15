import Link from "next/link";

export const metadata = {
  title: "Privacidade",
  description: "Informação provisória sobre o tratamento de dados pessoais no website e nos serviços digitais da MAIMA CALL CENTER.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <main className="container max-w-3xl py-16">
      <Link href="/" className="text-sm font-bold text-[#103B70]">← Voltar ao início</Link>
      <h1 className="mt-8 text-4xl font-bold text-[#103B70]">Informação de privacidade</h1>
      <p className="mt-3 text-sm text-slate-500">Versão de trabalho: 15 de novembro de 2026</p>
      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-950">
        <strong>Nota importante:</strong> esta informação descreve os tratamentos atualmente identificados no website, mas ainda não é uma política jurídica final. Antes de iniciar campanhas comerciais e tratamento sistemático de leads em Portugal, a MAIMA deverá confirmar a identificação legal da entidade, as bases jurídicas, os prazos de conservação, os contratos com prestadores e as regras de transferência internacional de dados com apoio especializado.
      </div>

      <h2 className="mt-9 text-xl font-bold text-[#103B70]">1. Responsável pelo tratamento</h2>
      <p className="mt-3 leading-8 text-slate-600">A atividade é apresentada sob a designação MAIMA CALL CENTER, com sede indicada no projeto em Rua de Pavel, n.º 179, S11, Z1, Q2, Bairro Capalanca, Município de Mulenvos, Província de Luanda, Angola. A denominação jurídica completa, número de identificação fiscal e endereço de contacto dedicado para assuntos de privacidade ainda devem ser acrescentados e confirmados.</p>

      <h2 className="mt-8 text-xl font-bold text-[#103B70]">2. Dados que podem ser tratados</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-7 text-slate-600">
        <li>Pedidos de contacto: nome, empresa, e-mail, telefone, área de interesse e mensagem.</li>
        <li>Conta de cliente: nome, empresa, telefone, e-mail, dados de autenticação geridos pelo serviço de identidade e informação necessária à gestão da conta.</li>
        <li>Área reservada: pedidos associados à conta, campanhas e contratos disponibilizados, faturas e comprovativos de pagamento.</li>
        <li>Operação interna: dados de leads fornecidas ou autorizadas pelo contratante, registos de chamadas, atribuição a operadores, contratos e avaliações de qualidade, quando estes módulos forem utilizados.</li>
      </ul>

      <h2 className="mt-8 text-xl font-bold text-[#103B70]">3. Finalidades</h2>
      <p className="mt-3 leading-8 text-slate-600">Os dados podem ser utilizados para responder a pedidos, criar e proteger contas, prestar e acompanhar serviços contratados, gerir campanhas comerciais, registar contactos e respetivos resultados, tratar faturação e pagamentos, analisar a qualidade da operação e cumprir obrigações aplicáveis. Os dados de leads de campanhas devem ser utilizados apenas dentro do âmbito e das autorizações confirmadas com a entidade contratante.</p>

      <h2 className="mt-8 text-xl font-bold text-[#103B70]">4. Aceitação e fundamento do tratamento</h2>
      <p className="mt-3 leading-8 text-slate-600">O formulário de contacto e o registo de conta incluem uma confirmação de leitura da informação de privacidade. A aplicação regista a confirmação do formulário com a respetiva versão e data e, no registo de conta, guarda a versão indicada no processo de autenticação. Essa confirmação não substitui a avaliação da base jurídica adequada para cada finalidade. A MAIMA deve documentar essa avaliação antes de iniciar campanhas ou comunicações comerciais.</p>

      <h2 className="mt-8 text-xl font-bold text-[#103B70]">5. Prestadores e transferências</h2>
      <p className="mt-3 leading-8 text-slate-600">A infraestrutura atual utiliza serviços técnicos de alojamento e deployment, base de dados, autenticação e armazenamento de ficheiros, bem como um serviço de correio eletrónico para avisos administrativos. A identificação contratual dos prestadores, os locais de tratamento, os subcontratantes e as garantias aplicáveis a transferências entre Angola, Portugal e outros países devem ser confirmados e descritos na versão final desta informação.</p>

      <h2 className="mt-8 text-xl font-bold text-[#103B70]">6. Conservação e segurança</h2>
      <p className="mt-3 leading-8 text-slate-600">A plataforma utiliza contas individuais, permissões por perfil e regras de acesso à base de dados e aos ficheiros. Os prazos de conservação de pedidos, contas, leads, chamadas, contratos, gravações e comprovativos ainda têm de ser definidos por categoria e finalidade. Os dados não devem ser conservados por mais tempo do que o necessário para a finalidade e as obrigações aplicáveis.</p>

      <h2 className="mt-8 text-xl font-bold text-[#103B70]">7. Direitos e pedidos</h2>
      <p className="mt-3 leading-8 text-slate-600">Consoante a legislação aplicável, os titulares poderão solicitar acesso, retificação, apagamento, limitação ou oposição ao tratamento, bem como retirar um consentimento quando esse for o fundamento utilizado. Para exercer direitos, utilize o formulário de contacto do website e identifique o pedido como assunto de privacidade. O canal dedicado, os prazos e a autoridade de controlo competente devem ser confirmados na revisão jurídica final.</p>

      <h2 className="mt-8 text-xl font-bold text-[#103B70]">8. Contacto e atualizações</h2>
      <p className="mt-3 leading-8 text-slate-600">Os contactos telefónico e eletrónico oficiais da MAIMA ainda não foram fornecidos para publicação. Esta página será atualizada quando a identificação jurídica, os contactos, as bases de tratamento, os prazos e os prestadores estiverem formalmente confirmados.</p>
      <p className="mt-10 border-t border-slate-200 pt-5 text-xs leading-6 text-slate-400">Esta página é uma base informativa de trabalho e não constitui aconselhamento jurídico nem declaração de conformidade legal.</p>
    </main>
  );
}
