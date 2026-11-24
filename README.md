# MAIMA CALL CENTER — Website e plataforma operacional

Website institucional e plataforma de gestão comercial da MAIMA CALL CENTER, desenvolvido com Next.js App Router, React, TypeScript, Tailwind CSS e Supabase.

## Funcionalidades

### Website público
- Apresentação institucional dos serviços de angariação comercial, qualificação de contactos, validação e acompanhamento operacional.
- Formulário de contacto ligado à API e à tabela `public.contactos`, com registo da aceitação da informação de privacidade.
- Notificação por e-mail à administração quando é recebido um pedido.
- Páginas de privacidade, cookies e termos de utilização em versão de trabalho, sujeitas a validação jurídica.

### Área de autenticação e cliente
- Registo de conta de cliente, início de sessão e recuperação de palavra-passe.
- Perfis com funções `admin`, `coordenador`, `operador` e `cliente`.
- Consulta dos pedidos e faturas associados à conta.
- Consulta de campanhas e contratos disponibilizados à empresa através de funções de portal com campos limitados.
- Atualização dos dados de perfil e de contacto da empresa.
- Envio e histórico de comprovativos de pagamento em armazenamento privado.

### Gestão interna
- Painel administrativo para pedidos, notas internas, faturação e revisão de comprovativos.
- Gestão de utilizadores e atribuição de perfis.
- CRM operacional com campanhas, guiões, importação CSV de leads, distribuição por operador, registo de chamadas, retornos, contratos, validação, chargebacks, controlo de qualidade e indicadores.
- Relatórios operacionais por período, campanha e operador, com indicadores de contacto, interesse, contratos, qualidade, comissões e despesas; exportação CSV e impressão/PDF.
- Registo interno de despesas por campanha ou como custo geral, com histórico de anulações e acesso restrito a administração/coordenação.
- Exportação CSV de leads e chamadas.

## Perfis de acesso
- **Administrador:** gestão global, equipa, empresas, campanhas, leads, contratos, qualidade e condições financeiras internas.
- **Coordenador:** gestão da operação, distribuição de leads, campanhas, validação de contratos e qualidade.
- **Operador:** consulta apenas das leads atribuídas, registo de chamadas e submissão de contratos elegíveis.
- **Cliente empresarial:** consulta dos dados da sua empresa, campanhas e contratos disponibilizados, pedidos e faturação.

As permissões são aplicadas na base de dados através de Row Level Security (RLS). A interface não é considerada uma barreira de segurança por si só.

## Requisitos
- Node.js 20.9 ou superior
- npm

## Executar localmente
```bash
npm install
npm run dev
```
Abra http://localhost:3000.

## Validar a compilação
```bash
npm run build
npm run start
```

## Configuração e publicação
1. Definir `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
2. Configurar `NEXT_PUBLIC_SITE_URL` para o domínio real.
3. Configurar os segredos SMTP apenas no ambiente de servidor da Vercel; nunca os colocar em código de cliente.
4. Confirmar as URLs de redirecionamento de autenticação no Supabase.
5. Criar contas individuais para a equipa. O utilizador regista a conta e a administração atribui o perfil interno adequado em **Equipa e acessos**.
6. Configurar empresas e campanhas com guião aprovado e condições financeiras confirmadas.
7. Só importar leads fornecidas ou autorizadas pelo contratante. As leads sem prova de autorização ficam bloqueadas para chamadas.
8. O sistema telefónico externo ainda não está integrado: nesta versão as chamadas são registadas manualmente. A integração depende do fornecedor e do CRM/sistema de chamadas aprovado pelo contratante.
9. Rever as páginas de privacidade, cookies e termos com apoio jurídico, incluindo as transferências internacionais de dados entre Angola e Portugal.
10. A faturação PDF atualmente disponibilizada no portal é um documento de consulta gerado pela aplicação. A sua validade como fatura fiscal deve ser confirmada por profissional de contabilidade e substituída por integração fiscal adequada antes de ser usada como documento fiscal oficial.
11. O website mantém `robots: noindex` até a MAIMA decidir que está pronto para indexação.

## Estrutura principal
- `app/page.tsx`: homepage
- `app/admin/page.tsx`: administração de pedidos e faturação
- `app/admin/equipa/page.tsx`: perfis e acessos
- `app/admin/operacao/page.tsx`: CRM operacional
- `app/admin/relatorios/page.tsx`: relatórios operacionais por período, campanha e operador
- `app/admin/custos/page.tsx`: registo e consulta de despesas operacionais
- `app/cliente/painel/page.tsx`: Área de Cliente empresarial
- `app/registar/page.tsx`: registo de clientes
- `app/login/page.tsx`: autenticação e encaminhamento por perfil
- `app/api/contactos/route.ts`: receção dos pedidos do website
- `lib/supabase`: clientes Supabase de navegador e servidor

## Limites conhecidos da primeira versão operacional
- O registo de chamadas é manual; não existe ainda integração com telefonia, gravações ou sincronização automática com CRM externo.
- Os relatórios permitem filtrar por datas, campanha e operador, e incluem despesas registadas. O custo por validação é uma métrica operacional simples: despesas no período divididas pelas validações registadas no período; custos gerais não são distribuídos por campanha, moedas diferentes não são convertidas e custos não são atribuídos a operadores. O envio automático de relatórios ainda não está configurado.
- A criação de contas de operadores/coordenadores começa pelo registo individual e atribuição posterior do perfil pela administração.
- As páginas legais são textos de trabalho, não aconselhamento jurídico nem confirmação de conformidade.
- A faturação PDF do portal não substitui, por si só, um sistema de faturação certificado.

## Factos vs. hipóteses
O conteúdo institucional tem como base o projeto operacional disponibilizado pela MAIMA. Não são apresentados resultados de vendas, clientes, certificações ou parcerias não confirmados. A remuneração por contrato é informação interna da campanha e não deve ser apresentada como preço público da MAIMA.
