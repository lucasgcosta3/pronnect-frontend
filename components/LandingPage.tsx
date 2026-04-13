import Image from "next/image";
import Link from "next/link";

const HERO_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAnc0SE2ySdumKDQj4FInSncNpdyCykP2KpbtAxZamJYEKic95xdYfj1kyeYeP8oG5mfyqLo60jSKtyBdPfxhrDBxMh47FYomp30kTEqWp0rpoImV_kuEF_q-YpVVKEiY-qFu2tNxX9khKmGe-ik9MKKxhT-miki3icTJDmT1d2_uepD15PofGoa3zbnWN7G5Zz2FvrBfmhAGw5iC4WM1fmNgcHMyIKAYr3l4L_9IMmp8lS1H5eRO7hi-_TtTxa4iiWA_K1b6T6IHdk";

export default function LandingPage() {
  return (
    <>
      <nav className="fixed top-0 z-50 w-full glass-nav shadow-[0_8px_30px_rgb(0,32,69,0.04)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
          <div className="flex items-center gap-8">
            <span className="font-headline text-2xl font-bold tracking-tighter text-slate-900">
              Pronnect
            </span>
            <div className="hidden gap-6 md:flex">
              <Link
                className="border-b-2 border-teal-600 pb-1 text-[14px] font-medium tracking-tight text-slate-900"
                href="/login?redirect=/app/professionals"
              >
                Descobrir
              </Link>
              <Link
                className="pb-1 text-[14px] font-medium tracking-tight text-slate-500 transition-colors duration-200 hover:text-teal-600"
                href="/register"
              >
                Contratar
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              className="text-[14px] font-medium text-slate-500 transition-colors hover:text-teal-600"
              href="/login"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-2 text-[14px] font-bold text-white transition-transform hover:scale-95 active:scale-90"
            >
              Começar
            </Link>
          </div>
        </div>
      </nav>

      <header className="relative flex min-h-[921px] items-center overflow-hidden pt-16">
        <div className="absolute inset-0 z-0">
          <Image
            src={HERO_IMG}
            alt="Vista costeira ao entardecer"
            fill
            priority
            className="object-cover brightness-[0.3]"
            sizes="100vw"
          />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-7xl px-8">
          <div className="max-w-3xl">
            <h1 className="mb-6 font-headline text-6xl tracking-tight text-white md:text-8xl">
              Pronnect
            </h1>
            <p className="mb-4 text-3xl font-semibold leading-tight text-white md:text-4xl">
              Conectamos talento e necessidade, tecnologia e oportunidade
            </p>
            <p className="mb-8 max-w-xl text-lg text-white/80">
              Profissionais de TI, propostas seguras, chat integrado e contratos
              claros para projetos ambiciosos.
            </p>
            <div className="mb-12 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login?redirect=/app"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-secondary to-primary-container px-8 py-4 text-lg font-bold text-white transition-transform hover:scale-95 active:scale-90"
              >
                Como funciona
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
            <div className="flex max-w-2xl items-center gap-2 rounded-2xl border border-white/10 bg-white/10 p-2 backdrop-blur-md">
              <div className="flex flex-1 items-center gap-3 px-4">
                <span className="material-symbols-outlined text-white/60">
                  search
                </span>
                <p className="text-sm text-white/70">
                  Faça login para buscar desenvolvedores, designers e mais.
                </p>
              </div>
              <Link
                href="/login?redirect=/app/professionals"
                className="rounded-xl bg-white px-6 py-2 font-bold text-primary transition-colors hover:bg-slate-100"
              >
                Buscar
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-surface px-8 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-secondary">
              Processo
            </span>
            <h2 className="font-headline text-4xl font-bold text-primary">
              Como funciona
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {[
              {
                icon: "person_search",
                title: "Encontre",
                text: "Busque profissionais com habilidades e experiência alinhadas ao seu projeto.",
              },
              {
                icon: "assignment_turned_in",
                title: "Proposta",
                text: "Envie uma proposta com mensagem e valor. O profissional aceita ou recusa.",
              },
              {
                icon: "encrypted",
                title: "Contrato e pagamento",
                text: "Ao aceitar, abrimos conversa e contrato. Pagamento com hold e liberação.",
              },
              {
                icon: "task_alt",
                title: "Entrega",
                text: "Profissional conclui; empresa valida. Transparência em cada etapa.",
              },
            ].map((s) => (
              <div key={s.title} className="group">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,32,69,0.04)] transition-transform group-hover:-translate-y-1">
                  <span className="material-symbols-outlined text-3xl text-secondary">
                    {s.icon}
                  </span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-primary">{s.title}</h3>
                <p className="leading-relaxed text-on-surface-variant">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary px-8 py-20 text-white">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="font-headline mb-6 text-3xl font-bold md:text-4xl">
            Pronto para começar?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-white/70">
            Crie sua conta como empresa ou profissional e use a API Pronnect já
            integrada a este painel.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-secondary px-8 py-3 font-bold text-white transition-transform hover:scale-95"
            >
              Criar conta
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/30 px-8 py-3 font-bold text-white transition-colors hover:bg-white/10"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-primary px-8 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-center">
            <div>
              <span className="font-headline mb-2 block text-2xl font-bold">
                Pronnect
              </span>
              <p className="max-w-sm text-sm text-white/50">
                Marketplace para talento de tecnologia e clientes que precisam
                de execução de qualidade.
              </p>
            </div>
            <div className="flex gap-6 text-sm text-white/60">
              <Link className="hover:text-secondary-fixed-dim" href="/login">
                Entrar
              </Link>
              <Link className="hover:text-secondary-fixed-dim" href="/register">
                Registrar
              </Link>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-xs text-white/40">
            © {new Date().getFullYear()} Pronnect. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </>
  );
}
