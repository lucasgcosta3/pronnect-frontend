import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-on-surface-variant">Carregando…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
