"use client";

import { clearToken, getRoleFromToken, getToken, decodeJwtPayload } from "@/lib/auth";
import { PronnectLogo } from "@/components/PronnectLogo";
import { ThemeToggle } from "@/components/ThemeToggle";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navUnderline =
  "relative py-1 text-sm font-medium text-primary/75 dark:text-white/75 transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-secondary after:transition-transform after:duration-300 hover:text-primary dark:hover:text-white hover:after:scale-x-100";

const navUnderlineActive =
  "relative py-1 text-sm font-semibold text-primary dark:text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-secondary";

export function MainNavbar() {
  const [role, setRole] = useState<string | null>(null);
  const [emailName, setEmailName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const currentRole = getRoleFromToken();
    setRole(currentRole);
    const t = getToken();
    if (t) {
      const payload = decodeJwtPayload(t);
      if (payload) {
        setEmailName(payload.name || payload.fullName || (payload.sub ? payload.sub.split('@')[0] : null));
      }
    }
    setMounted(true);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function logout() {
    clearToken();
    window.location.reload();
  }

  return (
    <nav className="glass-nav fixed top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md transition-colors duration-300">
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
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />

          {!mounted ? (
            <div className="h-9 w-20 animate-pulse bg-muted rounded-full" />
          ) : role ? (
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)} 
                className="flex items-center gap-2.5 bg-transparent border-none p-1.5 hover:bg-foreground/5 rounded-lg transition-colors"
                title="Sua Conta"
              >
                <span className="text-sm font-semibold text-foreground capitalize hidden sm:block">{emailName || "Perfil"}</span>
                <Avatar className="h-8 w-8 shadow-sm">
                  <AvatarFallback className="bg-primary font-bold text-xs text-primary-foreground">
                    {emailName ? emailName.charAt(0).toUpperCase() : (role === "COMPANY" ? "C" : "P")}
                  </AvatarFallback>
                </Avatar>
              </button>
              
              {dropdownOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-56 rounded-xl border border-border bg-card p-2 shadow-xl z-50">
                  <div className="px-3 py-2 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                    Minha Conta
                  </div>
                  {role === "COMPANY" && (
                      <Link onClick={() => setDropdownOpen(false)} href="/app/company/onboarding" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted font-medium">
                        <span className="material-symbols-outlined text-[18px]">person</span> Meu Perfil
                      </Link>
                  )}
                  {role === "PROFESSIONAL" && (
                       <Link onClick={() => setDropdownOpen(false)} href="/app/professional/onboarding" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted font-medium">
                         <span className="material-symbols-outlined text-[18px]">person</span> Meu Perfil
                       </Link>
                  )}
                  <Link onClick={() => setDropdownOpen(false)} href="/app/messages" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted font-medium">
                    <span className="material-symbols-outlined text-[18px]">chat</span> Mensagens
                  </Link>
                  <div className="my-2 border-t border-border/50"></div>
                  <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 font-medium">
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
                className="inline-flex h-10 items-center justify-center rounded-full bg-secondary px-6 text-sm font-semibold text-secondary-foreground shadow-sm transition-colors hover:bg-secondary/90"
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
