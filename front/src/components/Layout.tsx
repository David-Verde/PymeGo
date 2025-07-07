// @ts-nocheck
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuthStore } from "@/store/authStore";
import { Home, Package, DollarSign, LogOut, PanelLeft } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const logout = useAuthStore((state) => state.logout);
  const businessName = useAuthStore((state) => state.business?.name);
  const businessLogoUrl = useAuthStore((state) => state.business?.logoUrl);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

  // Contenido de la navegación, reutilizado en ambos menús
  const navLinks = (
    <>
      <Link to="/" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
        <Home className="h-4 w-4" />
        Dashboard
      </Link>
      <Link to="/transactions" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
        <DollarSign className="h-4 w-4" />
        Transacciones
      </Link>
      <Link to="/products" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
        <Package className="h-4 w-4" />
        Productos
      </Link>
    </>
  );

  return (
    <div className="flex min-h-screen w-full bg-gray-100/40 dark:bg-gray-800/40">
      {/* --- Barra Lateral para Escritorio --- */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-white sm:flex dark:bg-gray-950">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link to="/" className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base">
            {businessLogoUrl ? (
              <img src={businessLogoUrl} alt="Logo del negocio" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <Package className="h-4 w-4 transition-all group-hover:scale-110" />
            )}
            <span className="sr-only">{businessName}</span>
          </Link>
          <h2 className="font-semibold text-lg">{businessName}</h2>
          {navLinks}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Button onClick={handleLogout} variant="ghost" className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </nav>
      </aside>

      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-60 w-full">
        {/* --- Header con menú hamburguesa para móvil --- */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium">
                <Link to="/" className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                  {businessLogoUrl ? (
                    <img src={businessLogoUrl} alt="Logo del negocio" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <Package className="h-5 w-5 transition-all group-hover:scale-110" />
                  )}
                  <span className="sr-only">{businessName}</span>
                </Link>
                <h2 className="font-semibold text-xl -mt-3">{businessName}</h2>
                {navLinks}
                <div className="absolute bottom-5 w-[85%]">
                  <Button onClick={handleLogout} variant="ghost" className="w-full justify-start gap-4 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
                    <LogOut className="h-5 w-5" />
                    Cerrar Sesión
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </header>

        {/* --- Contenido Principal --- */}
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}