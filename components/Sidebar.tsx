"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Trophy,
  LogOut,
  Printer,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    icon: LayoutDashboard,
    label: "Dashboard",
    managerOnly: false,
  },
  {
    href: "/clientes",
    icon: Users,
    label: "Clientes",
    managerOnly: true,
  },
  {
    href: "/daylin",
    icon: CalendarCheck,
    label: "Daylin",
    managerOnly: false,
  },
  {
    href: "/premiacao",
    icon: Trophy,
    label: "Premiação",
    managerOnly: false,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isManager = session?.user?.role === "MANAGER";

  const visibleItems = navItems.filter(
    (item) => !item.managerOnly || isManager
  );

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 flex flex-col shadow-xl">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-blue-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
            <Printer className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              Bis Gráfica
            </h1>
            <p className="text-xs text-blue-300">CRM</p>
          </div>
        </div>
      </div>

      {/* Usuário atual */}
      <div className="px-4 py-4 border-b border-blue-700">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {session?.user?.name?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs text-blue-300">
              {isManager ? "Gestor" : "Vendedor"}
            </p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-white text-blue-900 shadow-sm"
                  : "text-blue-100 hover:bg-blue-700/50 hover:text-white"
              )}
            >
              <Icon
                className={cn("w-5 h-5", isActive ? "text-blue-700" : "")}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-4 h-4 text-blue-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-blue-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-blue-700/50 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
