import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu } from "lucide-react";

const links = [
  { href: "#empresa", label: "A empresa" },
  { href: "#servicos", label: "Serviços" },
  { href: "#metodo", label: "Metodologia" },
  { href: "#contacto", label: "Contactos" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="container flex min-h-[78px] items-center justify-between gap-6">
        <Link href="#inicio" aria-label="MAIMA CALL CENTER — início" className="flex shrink-0 items-center">
          <Image src="/logo.png" alt="MAIMA CALL CENTER" width={260} height={88} priority className="h-auto w-[190px] sm:w-[225px]" />
        </Link>
        <nav aria-label="Navegação principal" className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-semibold text-slate-600 transition hover:text-[#10243a]">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="#contacto" className="btn btn-primary hidden sm:inline-flex">
          Solicitar proposta <ArrowUpRight size={16} />
        </Link>
        <details className="relative md:hidden">
          <summary aria-label="Abrir menu" className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 text-[#10243a]">
            <Menu size={21} />
          </summary>
          <nav aria-label="Navegação móvel" className="absolute right-0 top-14 flex w-56 flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                {link.label}
              </Link>
            ))}
            <Link href="#contacto" className="btn btn-primary mt-1">Solicitar proposta</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
