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
    return <p className="text-muted-foreground">Carregando…</p>;
  }

  if (role === "ADMIN") {
    return (
      <div>
        <h1 className="font-headline mb-4 text-2xl text-primary dark:text-white">Painel</h1>
        <p className="text-muted-foreground">
          Conta administrativa. Use a API ou ferramentas de back-office.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-headline mb-2 text-2xl text-primary dark:text-white">Painel</h1>
      {profileLabel && !needsOnboarding && (
        <p className="mb-6 text-muted-foreground">
          Olá, <span className="font-semibold text-primary dark:text-white">{profileLabel}</span>
        </p>
      )}

      {needsOnboarding && role === "PROFESSIONAL" && (
        <div className="mb-6 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <p className="mb-2 text-foreground">
            Complete seu perfil e adicione habilidades para aparecer nas buscas.
          </p>
          <Link
            href="/app/professional/onboarding"
            className="font-bold text-accent hover:underline"
          >
            Ir para onboarding
          </Link>
        </div>
      )}

      {needsOnboarding && role === "COMPANY" && (
        <div className="mb-6 rounded-xl border border-accent/40 bg-accent/10 p-4">
          <p className="mb-2 text-foreground">
            Cadastre os dados da empresa para enviar propostas.
          </p>
          <Link
            href="/app/company/onboarding"
            className="font-bold text-accent hover:underline"
          >
            Ir para onboarding
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {role === "COMPANY" && (
          <>
            <Link
              href="/app/projects/new"
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <h2 className="font-headline text-lg font-bold text-primary dark:text-white flex items-center gap-2">
                Criar Projeto <span className="text-secondary text-base">✨ IA</span>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Publique seu projeto com ajuda de inteligência artificial e receba lances.
              </p>
            </Link>
            <Link
              href="/app/projects"
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <h2 className="font-headline text-lg font-bold text-primary dark:text-white">
                Meus Projetos
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Gerencie seus projetos publicados e veja propostas/lances recebidos.
              </p>
            </Link>
            <Link
              href="/app/professionals"
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <h2 className="font-headline text-lg font-bold text-primary dark:text-white">
                Buscar profissionais
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Filtre por habilidade ou texto e envie propostas de contratação.
              </p>
            </Link>
            <Link
              href="/app/proposals/sent"
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <h2 className="font-headline text-lg font-bold text-primary dark:text-white">
                Minhas propostas
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Acompanhe status e cancele se ainda estiver pendente.
              </p>
            </Link>
          </>
        )}
        {role === "PROFESSIONAL" && (
          <>
            <Link
              href="/app/projects"
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <h2 className="font-headline text-lg font-bold text-primary dark:text-white">
                Buscar Projetos
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Explore projetos publicados por empresas e envie seus lances (bids).
              </p>
            </Link>
            <Link
              href="/app/proposals/inbox"
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <h2 className="font-headline text-lg font-bold text-primary dark:text-white">
                Propostas recebidas
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Aceite ou recuse convites diretos de empresas.
              </p>
            </Link>
          </>
        )}
        {(role === "COMPANY" || role === "PROFESSIONAL") && (
          <Link
            href="/app/messages"
            className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
          >
            <h2 className="font-headline text-lg font-bold text-primary dark:text-white">
              Mensagens
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Conversas vinculadas a propostas aceitas.
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
