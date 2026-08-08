"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { HandCoins, LogOut, Users } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { administrator, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/login";

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (isLogin) return <main className="min-h-screen">{children}</main>;

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-8 px-4 sm:px-6">
          <Link href="/clients" className="flex items-center gap-2 font-semibold">
            <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <HandCoins className="size-5" aria-hidden="true" />
            </span>
            Client Ledger
          </Link>
          {!isLoading && administrator && (
            <>
              <nav className="flex flex-1 items-center" aria-label="Primary navigation">
                <Link
                  href="/clients"
                  className="flex items-center gap-2 border-b-2 border-primary px-3 py-5 text-sm font-medium"
                >
                  <Users className="size-4" aria-hidden="true" />
                  Clients
                </Link>
              </nav>
              <span className="hidden text-sm text-muted-foreground md:block">{administrator.name}</span>
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
                <LogOut className="size-4" />
                <span className="sr-only">Log out</span>
              </Button>
            </>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}