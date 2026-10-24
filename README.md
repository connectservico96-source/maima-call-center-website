# MAIMA CALL CENTER — Website

Website institucional responsivo em Next.js App Router, React, TypeScript e Tailwind CSS.

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

## Antes de publicar
1. Confirmar a qualidade visual do logótipo extraído do PDF; o ficheiro `public/logo.png` foi preparado com fundo transparente. Confirmar os códigos exatos das cores oficiais.
2. Confirmar o texto institucional, os serviços efetivamente disponíveis e os dados legais da entidade.
3. Adicionar email, telefone, domínio e demais contactos oficiais.
4. Ligar o formulário a um endpoint seguro ou CRM. Atualmente o formulário é demonstrativo e **não envia nem armazena dados**.
5. Rever as páginas de privacidade, cookies e termos com apoio jurídico competente, incluindo o enquadramento Angola–Portugal e a proteção de dados.
6. Definir `NEXT_PUBLIC_SITE_URL` para o domínio real.
7. Rever SEO e, após a validação do domínio/conteúdo, permitir indexação. O projeto começa com `robots: noindex` para evitar indexação acidental.
8. Executar testes em dispositivos móveis, acessibilidade, formulário, segurança e desempenho.

## Estrutura
- `app/page.tsx`: homepage
- `app/globals.css`: estilos globais e tokens visuais provisórios
- `components/Header.tsx`: navegação responsiva
- `components/ContactForm.tsx`: formulário demonstrativo
- `app/privacidade`, `app/cookies`, `app/termos`: páginas-base a validar

## Factos vs. hipóteses
O texto empresarial usa o documento de projeto disponibilizado como base. A paleta azul/verde com apontamento vermelho foi aproximada visualmente a partir do logótipo do PDF; confirmar os códigos oficiais da marca. Não são apresentados testemunhos, clientes, certificações ou resultados que não tenham sido confirmados.
