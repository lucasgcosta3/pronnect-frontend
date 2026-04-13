"use client";

import type { CompanyProfileResponse, ProfessionalProfileResponse } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AppDashboardPage() {
  const role = getRoleFromToken();
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [profileLabel, setProfileLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!role || role === "ADMIN") {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        if (role === "PROFESSIONAL") {
          const p = await api<ProfessionalProfileResponse>("/professionals/me");
          setNeedsOnboarding(!p.profileCompleted);
          setProfileLabel(p.headline || "Profissional");
        } else if (role === "COMPANY") {
          const c = await api<CompanyProfileResponse>("/companies/me");
          setNeedsOnboarding(!c.profileCompleted);
          setProfileLabel(c.name);
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) {
          setNeedsOnboarding(true);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [role]);

  if (loading) {
    return <p className="text-on-surface-variant">Carregando…</p>;
  }

  if (role === "ADMIN") {
    return (
      <div>
        <h1 className="font-headline mb-4 text-2xl text-primary">Painel</h1>
        <p className="text-on-surface-variant">
          Conta administrativa. Use a API ou ferramentas de back-office.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-headline mb-2 text-2xl text-primary">Painel</h1>
      {profileLabel && !needsOnboarding && (
        <p className="mb-6 text-on-surface-variant">
          Olá, <span className="font-semibold text-primary">{profileLabel}</span>
        </p>
      )}

      {needsOnboarding && role === "PROFESSIONAL" && (
        <div className="mb-6 rounded-xl border border-secondary/40 bg-secondary-container/20 p-4">
          <p className="mb-2 text-on-surface">
            Complete seu perfil e adicione habilidades para aparecer nas buscas.
          </p>
          <Link
            href="/app/professional/onboarding"
            className="font-bold text-secondary hover:underline"
          >
            Ir para onboarding
          </Link>
        </div>
      )}

      {needsOnboarding && role === "COMPANY" && (
        <div className="mb-6 rounded-xl border border-secondary/40 bg-secondary-container/20 p-4">
          <p className="mb-2 text-on-surface">
            Cadastre os dados da empresa para enviar propostas.
          </p>
          <Link
            href="/app/company/onboarding"
            className="font-bold text-secondary hover:underline"
          >
            Ir para onboarding
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {role === "COMPANY" && (
          <Link
            href="/app/professionals"
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 transition-shadow hover:shadow-md"
          >
            <h2 className="font-headline text-lg font-bold text-primary">
              Buscar profissionais
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Filtre por habilidade ou texto e envie propostas.
            </p>
          </Link>
        )}
        {role === "COMPANY" && (
          <Link
            href="/app/proposals/sent"
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 transition-shadow hover:shadow-md"
          >
            <h2 className="font-headline text-lg font-bold text-primary">
              Minhas propostas
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Acompanhe status e cancele se ainda estiver pendente.
            </p>
          </Link>
        )}
        {role === "PROFESSIONAL" && (
          <Link
            href="/app/proposals/inbox"
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 transition-shadow hover:shadow-md"
          >
            <h2 className="font-headline text-lg font-bold text-primary">
              Propostas recebidas
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Aceite ou recuse convites de empresas.
            </p>
          </Link>
        )}
        {(role === "COMPANY" || role === "PROFESSIONAL") && (
          <Link
            href="/app/messages"
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6 transition-shadow hover:shadow-md"
          >
            <h2 className="font-headline text-lg font-bold text-primary">
              Mensagens
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Conversas vinculadas a propostas aceitas.
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
