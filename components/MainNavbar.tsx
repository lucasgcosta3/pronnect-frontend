"use client";

import { clearToken, getRoleFromToken, getToken, decodeJwtPayload } from "@/lib/auth";
import { PronnectLogo } from "@/components/PronnectLogo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navUnderline =
  "relative py-1 text-sm font-medium text-primary/75 transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-secondary after:transition-transform after:duration-300 hover:text-primary hover:after:scale-x-100";

const navUnderlineActive =
  "relative py-1 text-sm font-semibold text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-secondary";

export function MainNavbar() {
  const [role, setRole] = useState<string | null>(null);
  const [emailName, setEmailName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setRole(getRoleFromToken());
    const t = getToken();
    if (t) {
      const payload = decodeJwtPayload(t);
      if (payload?.sub) setEmailName(payload.sub.split('@')[0]);
    }
    setMounted(true);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function logout() {
    clearToken();
    window.location.reload();
  }

  return (
    <nav className="glass-nav fixed top-0 z-50 w-full border-b border-border/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-6 md:px-10">
        <Link href="/" className="shrink-0">
          <PronnectLogo />
        </Link>
        <div className="hidden flex-1 justify-center gap-10 md:flex items-center">
          <Link className={pathname === "/" ? navUnderlineActive : navUnderline} href="/">Home</Link>
          <Link className={pathname.startsWith("/app/professionals") ? navUnderlineActive : navUnderline} href="/app/professionals">Encontrar Profissionais</Link>
          <Link className={navUnderline} href="/#para-profissionais">Eu quero trabalhar</Link>
          <Link className={pathname === "/about" ? navUnderlineActive : navUnderline} href="/about">Sobre nós</Link>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          {!mounted ? (
            <div className="h-9 w-20 animate-pulse bg-surface-container rounded-full" />
          ) : role ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                className="flex items-center gap-2.5 bg-transparent border-none p-1.5 hover:bg-black/5 rounded-lg transition-colors"
                title="Sua Conta"
              >
                <span className="text-sm font-semibold text-on-surface capitalize hidden sm:block">{emailName || "Perfil"}</span>
                <Avatar className="h-8 w-8 shadow-sm">
                  <AvatarFallback className="bg-primary font-bold text-xs text-white">
                    {emailName ? emailName.charAt(0).toUpperCase() : (role === "COMPANY" ? "C" : "P")}
                  </AvatarFallback>
                </Avatar>
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-56 rounded-xl border border-border/50 bg-white p-2 shadow-xl z-50">
                  <div className="px-3 py-2 text-xs font-bold uppercase text-on-surface-variant tracking-wider">
                    Minha Conta
                  </div>
                  {role === "COMPANY" && (
                      <Link onClick={() => setDropdownOpen(false)} href="/app/company/onboarding" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-container-lowest font-medium">
                        <span className="material-symbols-outlined text-[18px]">person</span> Meu Perfil
                      </Link>
                  )}
                  {role === "PROFESSIONAL" && (
                       <Link onClick={() => setDropdownOpen(false)} href="/app/professional/onboarding" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-container-lowest font-medium">
                         <span className="material-symbols-outlined text-[18px]">person</span> Meu Perfil
                       </Link>
                  )}
                  <Link onClick={() => setDropdownOpen(false)} href="/app/messages" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface hover:bg-surface-container-lowest font-medium">
                    <span className="material-symbols-outlined text-[18px]">chat</span> Mensagens
                  </Link>
                  <div className="my-2 border-t border-border/50"></div>
                  <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-error hover:bg-error-container/20 font-medium">
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link className={navUnderline} href="/login">
                Faça login
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-full bg-secondary px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-secondary/90"
              >
                Cadastre-se
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
