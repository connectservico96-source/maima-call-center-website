export type DirecaoChamada = "entrada" | "saida";

export type EventoTelefoniaNormalizado = {
  fornecedor: string;
  evento_externo_id: string;
  chamada_externa_id: string;
  telefone: string | null;
  direcao: DirecaoChamada;
  chamada_em: string;
  duracao_segundos: number | null;
  resultado: string | null;
  operador_externo_ref: string | null;
};

/**
 * Contrato interno comum a todos os fornecedores.
 * Cada integração futura deve converter o payload original para este formato
 * antes de o enviar para a caixa de entrada da MAIMA.
 */
export interface AdaptadorTelefonia<TPayload = unknown> {
  readonly fornecedor: string;
  normalizar(payload: TPayload): EventoTelefoniaNormalizado;
}
