import { timingSafeEqual } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { normalizarEventoTelefonia } from "@/lib/telefonia/normalizar-evento";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokenValido(received: string | null, expected: string): boolean {
  if (!received) return false;
  const supplied = Buffer.from(received);
  const configured = Buffer.from(expected);
  return supplied.length === configured.length && timingSafeEqual(supplied, configured);
}

export async function POST(request: Request) {
  const webhookToken = process.env.MAIMA_TELEFONIA_WEBHOOK_TOKEN;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookToken || !supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Integração telefónica ainda não configurada." }, { status: 503 });
  }

  if (!tokenValido(request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null, webhookToken)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 32_000) {
    return Response.json({ error: "Evento demasiado grande." }, { status: 413 });
  }

  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 32_000) return Response.json({ error: "Evento demasiado grande." }, { status: 413 });
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const evento = normalizarEventoTelefonia(payload);
  if (!evento) {
    return Response.json({ error: "O evento não respeita o formato normalizado da MAIMA." }, { status: 400 });
  }

  const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase
    .from("maima_telefonia_eventos")
    .upsert(evento, { onConflict: "fornecedor,evento_externo_id", ignoreDuplicates: true });

  if (error) {
    console.error("Falha ao guardar evento telefónico:", error.message);
    return Response.json({ error: "Não foi possível registar o evento." }, { status: 502 });
  }

  return Response.json({ ok: true, recebido: true }, { status: 202 });
}
