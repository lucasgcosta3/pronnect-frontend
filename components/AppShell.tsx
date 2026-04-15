"use client";

import { MainNavbar } from "@/components/MainNavbar";
import { usePathname } from "next/navigation";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChat = pathname.startsWith("/app/messages");

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)" }}>
      <MainNavbar />
      <main className={isChat ? "pt-[4.5rem]" : "pt-[5.5rem] pb-12"}>{children}</main>
    </div>
  );
}
