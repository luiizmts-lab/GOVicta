"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTree,
  Building2,
  ArrowLeftRight,
  ClipboardList,
  FileSpreadsheet,
  UploadCloud,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orcamento-executivo", label: "Orçamento Executivo", icon: ListTree },
  { href: "/orcamento-rm", label: "Orçamento RM", icon: Building2 },
  { href: "/de-para", label: "DE-PARA Orçamentário", icon: ArrowLeftRight },
  { href: "/registros", label: "Registros / QQP", icon: ClipboardList },
  { href: "/administracao/modelos", label: "Modelos de Contratação", icon: FileSpreadsheet },
  { href: "/administracao/importacao", label: "Importação de Dados", icon: UploadCloud },
  { href: "/administracao/obras", label: "Administração", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r bg-emerald-950 text-emerald-50 md:flex">
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500 font-bold text-emerald-950">
          V
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">VICTA</p>
          <p className="text-xs leading-none text-emerald-300">Gestão Orçamentária</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {ITENS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-600 text-white"
                  : "text-emerald-100 hover:bg-emerald-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 text-[11px] text-emerald-400">
        Ambiente de demonstração — dados fictícios
      </div>
    </aside>
  );
}
