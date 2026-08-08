"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { administrator, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !administrator) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [administrator, isLoading, pathname, router]);

  if (isLoading || !administrator) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Checking administrator session...</div>;
  }

  return children;
}