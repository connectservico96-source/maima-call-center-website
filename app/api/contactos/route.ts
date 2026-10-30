import { createClient } from "@/lib/supabase/server";

export async function GET() {
  return Response.json({ ok: true, rota: "contactos" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const nome = String(body.name ?? "").trim();
    const empresa = String(body.company ?? "").trim();
    const email = String(body.email ?? "").trim();
    const area = String(body.interest ?? "").trim();
    const mensagem = String(body.message ?? "").trim() || "Sem mensagem";

    if (!nome || !empresa || !email || !area) {
      return Response.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }

    if (nome.length > 150 || empresa.length > 200 || email.length > 254 || area.length > 150 || mensagem.length > 5000) {
      return Response.json({ error: "Um dos campos é demasiado longo." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("contactos").insert({
      nome,
      empresa,
      email,
      area_interesse: area,
      mensagem,
      ...(user ? { user_id: user.id } : {}),
    });

    if (error) {
      console.error("Supabase insert falhou:", error.message);
      return Response.json({ error: "Não foi possível guardar o pedido. Tente novamente." }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Erro ao processar contacto:", error);
    return Response.json({ error: "Ocorreu um erro ao processar o pedido." }, { status: 400 });
  }
}
