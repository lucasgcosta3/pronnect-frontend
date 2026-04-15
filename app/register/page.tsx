"use client";

import type { AccountResponse, AccountRole, RegisterAccountRequest } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { PronnectLogo } from "@/components/PronnectLogo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AccountRole>("PROFESSIONAL");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
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
        toast.error(err.message);
      } else {
        toast.error("Não foi possível registrar.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center px-4 py-12" style={{ background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)" }}>
      <div className="w-full max-w-2xl rounded-[1.5rem] bg-white p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/10">
        
        {/* LOGO */}
        <div className="mb-2 flex justify-center">
          <Link href="/" className="inline-block">
            <PronnectLogo className="text-4xl md:text-4xl" />
          </Link>
        </div>

        {/* HEADINGS */}
        <p className="mb-10 text-center text-sm text-on-surface-variant">
          Insira seus dados abaixo para criar sua conta e começar.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-on-surface/80">
                Nome completo
              </label>
              <input
                type="text"
                required
                placeholder="Exemplo da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            
            {/* E-mail */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-on-surface/80">
                E-mail
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="exemplo@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-on-surface/80">
                Senha (mín. 6 caracteres)
              </label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Insira sua senha..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Tipo de conta Select */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-on-surface/80">
                Tipo de conta
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AccountRole)}
                  className="w-full appearance-none rounded-xl border border-outline-variant/40 bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="PROFESSIONAL">Sou Profissional</option>
                  <option value="COMPANY">Sou Empresa / Cliente</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full rounded-xl border border-outline-variant/40 bg-white py-3.5 text-sm font-bold text-on-surface transition-all hover:bg-surface-container-lowest hover:border-outline-variant focus:ring-2 focus:ring-primary/20"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? "Confirmando..." : "Confirmar"}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-on-surface-variant">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
