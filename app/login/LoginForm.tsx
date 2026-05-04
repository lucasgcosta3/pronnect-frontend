"use client";

import type { AuthResponse } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { PronnectLogo } from "@/components/PronnectLogo";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api<AuthResponse>("/auth/login", {
        method: "POST",
        json: { email, password },
      });
      setToken(res.accessToken);
      router.push(redirect);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Falha ao entrar.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[1.5rem] bg-card p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border dark:shadow-none dark:border-border">
        
        {/* LOGO */}
        <div className="mb-2 text-center">
          <Link href="/" className="inline-block">
            <PronnectLogo className="text-4xl md:text-4xl" />
          </Link>
        </div>

        {/* HEADINGS */}
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Que bom te ver novamente 👋<br />Faça o login na sua conta abaixo
        </p>

        {searchParams.get("registered") && (
          <p className="mb-6 rounded-lg bg-secondary-container/30 p-3 text-center text-sm font-medium text-white">
            Conta criada com sucesso. Faça login para continuar.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">
              E-mail
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="Digite seu e-mail..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground/80">
              Senha
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Digite sua senha..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Login"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link
            href="/register"
            className="font-bold text-primary dark:text-white hover:underline"
          >
            Cadastre-se grátis
          </Link>
        </p>
        
        <p className="mt-4 text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground/60 hover:text-primary dark:hover:text-white transition-colors"
          >
            Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  );
}
