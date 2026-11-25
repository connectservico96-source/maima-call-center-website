import { timingSafeEqual } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { normalizarEventoTelefonia } from "@/lib/telefonia/normalizar-evento";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PAYLOAD_BYTES = 32_000;

function tokenValido(received: string | null, expected: string): boolean {
  if (!received) return false;
  const supplied = Buffer.from(received);
  const configured = Buffer.from(expected);
  return supplied.length === configured.length && timingSafeEqual(supplied, configured);
}

async function lerPayloadLimitado(request: Request): Promise<unknown> {
  if (!request.body) throw new Error("empty_body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_PAYLOAD_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new Error("payload_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

export async function POST(request: Request) {
  const webhookToken = process.env.MAIMA_TELEFONIA_WEBHOOK_TOKEN;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!webhookToken || !supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Integração telefónica ainda não configurada." }, { status: 503 });
  }

  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
  if (!tokenValido(bearer, webhookToken)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_PAYLOAD_BYTES) {
    return Response.json({ error: "Evento demasiado grande." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await lerPayloadLimitado(request);
  } catch (error) {
    if (error instanceof Error && error.message === "payload_too_large") {
      return Response.json({ error: "Evento demasiado grande." }, { status: 413 });
    }
    return Response.json({ error: "JSON inválido ou corpo vazio." }, { status: 400 });
  }

  const evento = normalizarEventoTelefonia(payload);
  if (!evento) {
    return Response.json({ error: "O evento não respeita o formato normalizado da MAIMA." }, { status: 400 });
  }

  const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: saved, error: saveError } = await supabase
    .from("maima_telefonia_eventos")
    .upsert(evento, { onConflict: "fornecedor,evento_externo_id" })
    .select("id")
    .single();

  if (saveError || !saved) {
    console.error("Falha ao guardar evento telefónico:", saveError?.message);
    return Response.json({ error: "Não foi possível registar o evento." }, { status: 502 });
  }

  const { error: associationError } = await supabase.rpc("maima_associar_evento_telefonia", {
    p_evento_id: saved.id,
  });
  if (associationError) {
    console.error("Evento guardado, mas a associação automática falhou:", associationError.message);
    return Response.json({ ok: true, recebido: true, associacao: "pendente" }, { status: 202 });
  }

  return Response.json({ ok: true, recebido: true, associacao: "processada" }, { status: 202 });
}
