"use client";

import { clearToken, getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = getRoleFromToken();
  const router = useRouter();

  function logout() {
    clearToken();
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-surface-container-low">
      <header className="border-b border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/app"
            className="font-headline text-lg font-bold text-primary"
          >
            Pronnect
          </Link>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-on-surface">
            {role === "COMPANY" && (
              <>
                <Link className="hover:text-secondary" href="/app/professionals">
                  Profissionais
                </Link>
                <Link className="hover:text-secondary" href="/app/proposals/sent">
                  Propostas enviadas
                </Link>
              </>
            )}
            {role === "PROFESSIONAL" && (
              <Link className="hover:text-secondary" href="/app/proposals/inbox">
                Propostas recebidas
              </Link>
            )}
            {(role === "COMPANY" || role === "PROFESSIONAL") && (
              <Link className="hover:text-secondary" href="/app/messages">
                Mensagens
              </Link>
            )}
            {role === "PROFESSIONAL" && (
              <Link
                className="hover:text-secondary"
                href="/app/professional/onboarding"
              >
                Meu perfil
              </Link>
            )}
            {role === "COMPANY" && (
              <Link
                className="hover:text-secondary"
                href="/app/company/onboarding"
              >
                Minha empresa
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              className="text-secondary hover:underline"
            >
              Sair
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
