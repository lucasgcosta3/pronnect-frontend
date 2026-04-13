"use client";

import { getToken } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      const dest = pathname || "/app";
      router.replace(`/login?redirect=${encodeURIComponent(dest)}`);
      setReady(true);
      return;
    }
    setAllowed(true);
    setReady(true);
  }, [router, pathname]);

  if (!ready || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-on-surface-variant">Carregando…</p>
      </div>
    );
  }

  return <>{children}</>;
}
