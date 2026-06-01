"use client";

import type { AccountResponse, AccountRole, RegisterAccountRequest } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { PronnectLogo } from "@/components/PronnectLogo";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { formatCpf, formatCnpj, isValidCpf, isValidCnpj } from "@/lib/validators";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<AccountRole>("PROFESSIONAL");
  const [cpf, setCpf] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [personType, setPersonType] = useState<"PF" | "PJ">("PF");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (role === "PROFESSIONAL") {
      if (!isValidCpf(cpf)) {
        toast.error("CPF inválido.");
        return;
      }
    } else if (role === "COMPANY") {
      if (personType === "PF" && !isValidCpf(cpf)) {
        toast.error("CPF inválido.");
        return;
      }
      if (personType === "PJ" && !isValidCnpj(cnpj)) {
        toast.error("CNPJ inválido.");
        return;
      }
    }

    setLoading(true);
    try {
      const body: RegisterAccountRequest = { 
        name, 
        email, 
        password, 
        role,
        cpf: role === "PROFESSIONAL" || (role === "COMPANY" && personType === "PF") ? cpf : undefined,
        cnpj: role === "COMPANY" && personType === "PJ" ? cnpj : undefined,
        personType: role === "COMPANY" ? personType : undefined
      };
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
    <div className="flex flex-col min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-[1.5rem] bg-card p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
        
        {/* LOGO */}
        <div className="mb-2 flex justify-center">
          <Link href="/" className="inline-block">
            <PronnectLogo className="text-4xl md:text-4xl" />
          </Link>
        </div>

        {/* HEADINGS */}
        <p className="mb-10 text-center text-sm text-muted-foreground">
          Insira seus dados abaixo para criar sua conta e começar.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                Nome completo
              </label>
              <input
                type="text"
                required
                placeholder="Exemplo da Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            
            {/* E-mail */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                E-mail
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="exemplo@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                Senha (mín. 6 caracteres)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="Insira sua senha..."
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

            {/* Tipo de conta Select */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                Tipo de conta
              </label>
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as AccountRole);
                    if (e.target.value === "COMPANY") setPersonType("PF");
                  }}
                  className="w-full appearance-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-all hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="PROFESSIONAL">Sou Profissional</option>
                  <option value="COMPANY">Sou Empresa / Cliente</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* PF / PJ Toggle (Somente para COMPANY) */}
            {role === "COMPANY" && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                  Tipo de Pessoa
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="personType"
                      value="PF"
                      checked={personType === "PF"}
                      onChange={() => setPersonType("PF")}
                      className="accent-primary"
                    />
                    <span className="text-sm">Pessoa Física</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="personType"
                      value="PJ"
                      checked={personType === "PJ"}
                      onChange={() => setPersonType("PJ")}
                      className="accent-primary"
                    />
                    <span className="text-sm">Pessoa Jurídica</span>
                  </label>
                </div>
              </div>
            )}

            {/* CPF / CNPJ */}
            {(role === "PROFESSIONAL" || (role === "COMPANY" && personType === "PF")) && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                  CPF
                </label>
                <input
                  type="text"
                  required
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  maxLength={14}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {role === "COMPANY" && personType === "PJ" && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground/80">
                  CNPJ
                </label>
                <input
                  type="text"
                  required
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                  maxLength={18}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full rounded-xl border border-border bg-card py-3.5 text-sm font-bold text-foreground transition-all hover:bg-muted focus:ring-2 focus:ring-primary/20"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? "Confirmando..." : "Confirmar"}
            </button>
          </div>
        </form>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
