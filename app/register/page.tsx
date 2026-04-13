"use client";

import type { AccountResponse, AccountRole, RegisterAccountRequest } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccountRole>("PROFESSIONAL");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body: RegisterAccountRequest = { name, email, password, role };
      await api<AccountResponse>("/auth/register", {
        method: "POST",
        json: body,
      });
      router.push("/login?registered=1");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Não foi possível registrar.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-8 shadow-sm">
        <h1 className="font-headline mb-6 text-center text-2xl text-primary">
          Criar conta
        </h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">
              Nome
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-on-surface outline-none ring-secondary focus:ring-2"
            />
          </div>
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
              Senha (mín. 6 caracteres)
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-on-surface outline-none ring-secondary focus:ring-2"
            />
          </div>
          <div>
            <span className="mb-2 block text-sm font-medium text-on-surface">
              Tipo de conta
            </span>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="role"
                  checked={role === "PROFESSIONAL"}
                  onChange={() => setRole("PROFESSIONAL")}
                />
                Profissional
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="role"
                  checked={role === "COMPANY"}
                  onChange={() => setRole("COMPANY")}
                />
                Empresa
              </label>
            </div>
          </div>
          {error && (
            <p className="text-sm text-error" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-secondary py-3 font-bold text-on-secondary transition-opacity disabled:opacity-50"
          >
            {loading ? "Criando…" : "Registrar"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Já tem conta?{" "}
          <Link href="/login" className="font-bold text-secondary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
