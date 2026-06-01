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
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (!termsAccepted) {
      toast.error("Você precisa aceitar os termos de uso para continuar.");
      return;
    }

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
        toast.error("Falha ao entrar. Verifique suas credenciais.");
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
          <p className="mb-6 rounded-lg bg-secondary/10 p-3 text-center text-sm font-medium text-secondary border border-secondary/20">
            Conta criada com sucesso! Faça login para continuar.
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-foreground/80">
                Senha
              </label>
              <button
                type="button"
                onClick={() => toast.info("Funcionalidade disponível em breve.")}
                className="text-xs text-primary dark:text-white/70 hover:underline transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="Digite sua senha..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-11 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          {/* Terms of use checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  termsAccepted
                    ? "bg-primary border-primary"
                    : "border-border group-hover:border-primary/50"
                }`}
              >
                {termsAccepted && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs text-muted-foreground leading-relaxed">
              Li e aceito os{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Termos de uso disponíveis em breve.");
                }}
                className="font-semibold text-primary dark:text-white hover:underline"
              >
                Termos de Uso
              </button>{" "}
              e a{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Política de privacidade disponível em breve.");
                }}
                className="font-semibold text-primary dark:text-white hover:underline"
              >
                Política de Privacidade
              </button>{" "}
              da Pronnect.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
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
