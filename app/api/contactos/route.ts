import { createClient } from "@/lib/supabase/server";
import nodemailer from "nodemailer";

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

    try {
      const gmailUser = process.env.GMAIL_USER;
      const gmailPassword = process.env.GMAIL_APP_PASSWORD;
      const notificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

      if (gmailUser && gmailPassword && notificationEmail) {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: { user: gmailUser, pass: gmailPassword.replace(/\s/g, "") },
        });
        await transporter.sendMail({
          from: { name: "MAIMA CALL CENTER", address: gmailUser },
          to: notificationEmail,
          subject: `Novo pedido recebido — ${nome}`,
          text: [
            "Foi recebido um novo pedido através do website MAIMA CALL CENTER.",
            "",
            `Nome: ${nome}`,
            `Empresa: ${empresa}`,
            `E-mail: ${email}`,
            `Área de interesse: ${area}`,
            "",
            "Mensagem:",
            mensagem,
          ].join(String.fromCharCode(13, 10)),
        });
      }
    } catch (emailError) {
      console.error("Falha ao enviar aviso por e-mail:", emailError);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Erro ao processar contacto:", error);
    return Response.json({ error: "Ocorreu um erro ao processar o pedido." }, { status: 400 });
  }
}
