"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HandCoins } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const { administrator, isLoading, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && administrator) router.replace(searchParams.get("next") || "/clients");
  }, [administrator, isLoading, router, searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);

    try {
      await login(String(form.get("email")), String(form.get("password")));
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to reach the PHP API.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-foreground p-12 text-background lg:flex lg:flex-col lg:justify-between">
        <HandCoins className="size-10 text-emerald-400" aria-hidden="true" />
        <div className="max-w-xl space-y-5">
          <p className="font-mono text-sm uppercase text-emerald-400">Administrative ledger</p>
          <h1 className="text-5xl font-semibold leading-tight">Every client movement, accounted for.</h1>
          <p className="text-lg text-background/70">Secure administration for clients, earnings, expenses, and balance reports.</p>
        </div>
      </section>
      <section className="grid place-items-center px-5 py-12">
        <Card className="w-full max-w-md border-0 shadow-none sm:border sm:shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Administrator sign in</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="username" required disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" required disabled={isSubmitting} />
              </div>
              <Button className="w-full" disabled={isSubmitting || isLoading}>
                {isSubmitting ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}