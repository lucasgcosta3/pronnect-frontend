"use client";

import type { AuthResponse } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
        setError(err.message);
      } else {
        setError("Falha ao entrar.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        <h1 className="font-headline mb-6 text-center text-2xl text-primary">
          Entrar
        </h1>
        {searchParams.get("registered") && (
          <p className="mb-4 rounded-lg bg-secondary-container/30 p-3 text-sm text-on-secondary-container">
            Conta criada. Faça login para continuar.
          </p>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">
              E-mail
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-on-surface outline-none ring-secondary focus:ring-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">
              Senha
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-on-surface outline-none ring-secondary focus:ring-2"
            />
          </div>
          {error && (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3 font-bold text-on-primary transition-opacity disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Não tem conta?{" "}
          <Link
            href="/register"
            className="font-bold text-secondary hover:underline"
          >
            Registrar
          </Link>
        </p>
        <p className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-on-surface-variant hover:text-primary"
          >
            Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  );
}
