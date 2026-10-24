import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MAIMA CALL CENTER | Soluções comerciais",
    template: "%s | MAIMA CALL CENTER",
  },
  description:
    "Serviços de angariação comercial e apoio a operações de contacto, com foco em qualidade, organização e resultados mensuráveis.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"),
  openGraph: {
    title: "MAIMA CALL CENTER | Soluções comerciais",
    description: "Operações comerciais estruturadas, com foco na qualidade e melhoria contínua.",
    type: "website",
    locale: "pt_PT",
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-PT">
      <body>{children}</body>
    </html>
  );
}
