import type { DirecaoChamada, EventoTelefoniaNormalizado } from "./types";

const textOrNull = (value: unknown, max: number): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

export function normalizarEventoTelefonia(input: unknown): EventoTelefoniaNormalizado | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const value = input as Record<string, unknown>;

  const fornecedor = textOrNull(value.fornecedor, 50)?.toLowerCase() ?? null;
  const evento = textOrNull(value.evento_externo_id, 200);
  const chamada = textOrNull(value.chamada_externa_id, 200);
  const direcao = value.direcao;
  const chamadaEm = textOrNull(value.chamada_em, 50);

  if (!fornecedor || !/^[a-z0-9][a-z0-9_-]{1,49}$/.test(fornecedor)) return null;
  if (!evento || !chamada || !chamadaEm) return null;
  if (direcao !== "entrada" && direcao !== "saida") return null;

  const date = new Date(chamadaEm);
  if (Number.isNaN(date.getTime())) return null;

  let duracao: number | null = null;
  if (value.duracao_segundos !== undefined && value.duracao_segundos !== null) {
    const parsed = Number(value.duracao_segundos);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 86400) return null;
    duracao = parsed;
  }

  return {
    fornecedor,
    evento_externo_id: evento,
    chamada_externa_id: chamada,
    telefone: textOrNull(value.telefone, 40),
    direcao: direcao as DirecaoChamada,
    chamada_em: date.toISOString(),
    duracao_segundos: duracao,
    resultado: textOrNull(value.resultado, 100),
    operador_externo_ref: textOrNull(value.operador_externo_ref, 200),
  };
}
