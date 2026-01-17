"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  Boxes,
  Calculator,
  LogOut,
  Menu,
  X,
  Wallet,
  TrendingDown,
  Tags,
  User,
  Printer,
} from "lucide-react";
import { useState, useEffect } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: DollarSign, label: "Vendas", href: "/dashboard/vendas" },
  { icon: Wallet, label: "Aportes", href: "/dashboard/aportes" },
  { icon: TrendingDown, label: "Despesas", href: "/dashboard/despesas" },
  { icon: Tags, label: "Categorias", href: "/dashboard/categorias" },
  { icon: Package, label: "Produtos", href: "/dashboard/produtos" },
  { icon: Boxes, label: "Filamentos", href: "/dashboard/filamentos" },
  { icon: Calculator, label: "Calculadora", href: "/dashboard/calculadora" },
  { icon: User, label: "Perfil", href: "/dashboard/perfil" },
  { icon: Printer, label: "Impressoras", href: "/dashboard/impressoras" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      console.log("❌ Dashboard: Sem usuário, redirecionando para login");
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-vultrix-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-vultrix-black flex">
      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-vultrix-dark border-r border-vultrix-gray
          transform transition-transform duration-300 ease-in-out
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-vultrix-gray">
            <Link href="/dashboard" className="text-2xl font-bold text-white">
              Vultrix <span className="text-vultrix-accent">3D</span>
            </Link>
            <p className="text-xs text-vultrix-light/60 mt-1">
              Sistema Interno
            </p>
          </div>

          {/* Menu */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${
                      isActive
                        ? "bg-vultrix-accent text-white"
                        : "text-vultrix-light/70 hover:bg-vultrix-gray hover:text-white"
                    }
                  `}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-vultrix-gray">
            <div className="mb-3 px-4">
              <p className="text-xs text-vultrix-light/60">Usuário</p>
              <p className="text-sm text-white truncate">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-vultrix-light/70 hover:bg-red-500/10 hover:text-red-500 transition-all"
            >
              <LogOut size={20} />
              <span className="font-medium">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden bg-vultrix-dark border-b border-vultrix-gray p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            Vultrix <span className="text-vultrix-accent">3D</span>
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
