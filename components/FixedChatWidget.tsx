"use client";

import { getRoleFromToken } from "@/lib/auth";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function FixedChatWidget() {
  const [role, setRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setRole(getRoleFromToken());
    setMounted(true);
  }, []);

  if (!mounted || !role || pathname.startsWith("/app/messages")) return null;

  return (
    <Link 
      href="/app/messages"
      className={cn(
        "fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:bg-primary/90 active:scale-95 group"
      )}
      aria-label="Abrir Chat"
    >
      <span className="material-symbols-outlined text-[26px] transition-transform group-hover:scale-110">chat</span>
    </Link>
  );
}
