# Integração telefónica da MAIMA

## Estado atual

A MAIMA tem uma camada de entrada independente do fornecedor. O fornecedor ainda não foi selecionado, por isso não existe ligação ativa a uma central telefónica e não são realizadas nem recebidas chamadas por esta camada.

## Arquitetura

1. O fornecedor envia um webhook para `POST /api/telefonia/webhook`.
2. Um adaptador específico converte o payload do fornecedor para o contrato interno definido em `lib/telefonia/types.ts`.
3. A rota valida o token de integração, valida o formato e regista o evento em `public.maima_telefonia_eventos`.
4. O par fornecedor + ID do evento é único; reenvios do mesmo evento não criam duplicados.
5. A função de associação procura uma correspondência exata do telefone com as leads; só associa automaticamente quando encontra uma única lead.\n6. O operador é obtido pelo mapeamento explícito da referência externa do agente; se não existir, usa o operador atualmente atribuído à lead.\n7. Se houver mais de uma lead com o mesmo número, o evento fica marcado como ambíguo e não escolhe uma lead por aproximação.

## Formato normalizado

```json
{
  "fornecedor": "nome-do-fornecedor",
  "evento_externo_id": "event-123",
  "chamada_externa_id": "call-456",
  "telefone": "+351900000000",
  "direcao": "saida",
  "chamada_em": "2026-11-24T10:30:00.000Z",
  "duracao_segundos": 95,
  "resultado": "atendida",
  "operador_externo_ref": "agent-12"
}
```

Campos obrigatórios: `fornecedor`, `evento_externo_id`, `chamada_externa_id`, `direcao` e `chamada_em`. O telefone, duração, resultado e referência do operador são opcionais.

## Configuração segura

Quando o fornecedor for escolhido, configurar na Vercel, apenas no servidor:

- `MAIMA_TELEFONIA_WEBHOOK_TOKEN`: token aleatório forte partilhado com o mecanismo de webhook do fornecedor.
- `SUPABASE_SERVICE_ROLE_KEY`: chave secreta do Supabase usada exclusivamente no servidor pela rota de webhook.

Nunca colocar estas variáveis com prefixo `NEXT_PUBLIC_`, nem enviar os seus valores por e-mail, chat ou código-fonte. O endpoint devolve 503 enquanto as variáveis não estiverem configuradas.

O token Bearer é um mecanismo inicial genérico. Se o fornecedor exigir assinatura HMAC, OAuth ou validação própria, o adaptador deverá validar o mecanismo oficial do fornecedor antes de aceitar eventos. Não se deve desativar a validação para acomodar um fornecedor.

## Privacidade e segurança

- A rota não guarda payload bruto, gravações, URLs de gravação ou transcrições.
- O acesso de leitura e atualização à caixa de eventos fica limitado a administradores e coordenadores.
- A chave service role nunca é usada no navegador.
- A associação de lead usa igualdade exata dos dígitos do telefone, ignorando espaços e símbolos; não usa aproximações de nome.\n- Correspondências ambíguas não são associadas automaticamente.\n- O mapeamento de agentes externos é gerido por administração/coordenação em `/admin/telefonia/mapeamentos`.\n- A associação não cria por si só um registo em `maima_chamadas`, nem altera autorização de contacto, consentimento ou estado da lead.
- Gravações e transcrições exigem análise contratual, consentimento, retenção e enquadramento legal aplicável em Angola e Portugal.

## O que falta quando o fornecedor for selecionado

- Confirmar nome do produto, plano e API/webhooks disponíveis.
- Implementar e testar o adaptador oficial e a validação de assinatura.
- Registar os IDs externos de agentes em `/admin/telefonia/mapeamentos` e associá-los aos operadores MAIMA.
- Rever manualmente eventos sem telefone, com números partilhados ou com mais de uma lead correspondente.
- Testar chamadas de entrada e saída, estados finais, duração, reenvios e falhas.
- Decidir, separadamente, se haverá gravação e como será gerida a retenção.
