
export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return Response.json(
        { error: "Configuração do Supabase em falta." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const nome = String(body.name ?? "").trim();
    const empresa = String(body.company ?? "").trim();
    const email = String(body.email ?? "").trim();
    const area = String(body.interest ?? "").trim();
    const mensagem = String(body.message ?? "").trim() || "Sem mensagem";

    if (!nome || !empresa || !email || !area) {
      return Response.json(
        { error: "Preencha todos os campos obrigatórios." },
        { status: 400 }
      );
    }

    if (
      nome.length > 150 ||
      empresa.length > 200 ||
      email.length > 254 ||
      area.length > 150 ||
      mensagem.length > 5000
    ) {
      return Response.json(
        { error: "Um dos campos é demasiado longo." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${url}/rest/v1/contactos`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          nome,
          empresa,
          email,
          area_interesse: area,
          mensagem,
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      console.error("Supabase insert falhou:", response.status);
      return Response.json(
        { error: "Não foi possível guardar o pedido. Tente novamente." },
        { status: 502 }
      );
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Ocorreu um erro ao processar o pedido." },
      { status: 400 }
    );
  }
}
