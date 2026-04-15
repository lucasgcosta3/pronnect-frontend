"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getRoleFromToken } from "@/lib/auth";

import { PronnectLogo } from "@/components/PronnectLogo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { MainNavbar } from "@/components/MainNavbar";
import { LinkedInIcon, InstagramIcon, YouTubeIcon } from "@/components/SocialIcons";

const heroOrbitIcons = [
  { icon: "code", style: "left-[2%] top-[8%] md:left-0 md:top-[12%]" },
  { icon: "brush", style: "right-[4%] top-[6%] md:right-0 md:top-[10%]" },
  { icon: "edit", style: "left-[-2%] top-[38%] md:left-[-4%]" },
  { icon: "bar_chart", style: "right-[-2%] top-[40%] md:right-[-4%]" },
  { icon: "description", style: "left-[6%] bottom-[18%] md:left-0" },
  { icon: "settings", style: "right-[8%] bottom-[20%] md:right-[2%]" },
  { icon: "chat_bubble", style: "left-1/2 bottom-[-2%] -translate-x-1/2 md:bottom-[-4%]" },
] as const;

const processSteps = [
  {
    icon: "person_search",
    title: "Encontre",
    text: "Busque profissionais com habilidades e experiência alinhadas ao seu projeto.",
  },
  {
    icon: "assignment",
    title: "Marcos definidos",
    text: "Proposta clara com entregas e valores. Transparência em cada etapa.",
  },
  {
    icon: "encrypted",
    title: "Pagamento seguro",
    text: "Contrato e valores em hold até a validação. Menos risco para ambos.",
  },
  {
    icon: "task_alt",
    title: "Aprovar e liberar",
    text: "Validação final e liberação do pagamento quando tudo estiver concluído.",
  },
] as const;

const clientFeatures = [
  {
    icon: "verified_user",
    title: "Profissionais pré-validados",
    desc: "Curadoria e verificação para você contratar com mais segurança.",
  },
  {
    icon: "monitoring",
    title: "Controle em tempo real",
    desc: "Acompanhe marcos, mensagens e entregas em um só lugar.",
  },
  {
    icon: "gavel",
    title: "Contratos claros",
    desc: "Regras e escopo definidos antes do início do trabalho.",
  },
] as const;

const professionalFeatures = [
  {
    icon: "payments",
    title: "Pagamento garantido",
    desc: "Valores protegidos até a aprovação da entrega pelo cliente.",
  },
  {
    icon: "workspace_premium",
    title: "Clientes qualificados",
    desc: "Acesso a empresas que buscam execução séria e recorrente.",
  },
  {
    icon: "trending_up",
    title: "Reputação que cresce",
    desc: "Histórico e avaliações que fortalecem seu perfil na plataforma.",
  },
] as const;

const securityItems = [
  {
    icon: "lock",
    title: "Proteção em escrow",
    text: "Valores retidos até a entrega ser validada.",
  },
  {
    icon: "verified_user",
    title: "Verificação de identidade",
    text: "Menos fraude, mais confiança nas contratações.",
  },
  {
    icon: "description",
    title: "Contratos inteligentes",
    text: "Regras e marcos registrados de forma transparente.",
  },
  {
    icon: "headset_mic",
    title: "Mediação dedicada",
    text: "Suporte para divergências e dúvidas ao longo do projeto.",
  },
] as const;

const helpOptions = [
  {
    icon: "quiz",
    title: "Perguntas frequentes",
    text: "Respostas rápidas sobre contratos, pagamentos e perfil.",
    href: "#",
  },
  {
    icon: "support_agent",
    title: "Falar com suporte",
    text: "Nossa equipe ajuda em contas, disputas e uso da plataforma.",
    href: "/login",
  },
  {
    icon: "menu_book",
    title: "Documentação",
    text: "Guias para empresas e profissionais tirarem o máximo da Pronnect.",
    href: "#",
  },
] as const;

export default function LandingPage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(getRoleFromToken());
  }, []);

  return (
    <>
      <MainNavbar />

      <header className="border-b border-border/40 bg-white pt-[4.5rem]">
        <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 md:py-20 lg:py-24">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div className="max-w-xl lg:max-w-none">
              <div className="mb-8 flex flex-wrap gap-x-8 gap-y-4 text-xs font-medium text-muted-foreground md:text-sm">
                <div className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
                  <span className="material-symbols-outlined text-xl text-secondary">
                    check_circle
                  </span>
                  <span>Publicação gratuita</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
                  <span className="material-symbols-outlined text-xl text-secondary">
                    favorite
                  </span>
                  <span>Satisfação garantida</span>
                </div>
                <div className="flex flex-col items-center gap-1.5 text-center sm:items-start sm:text-left">
                  <span className="material-symbols-outlined text-xl text-secondary">
                    payments
                  </span>
                  <span>Pagamentos protegidos</span>
                </div>
              </div>
              <h1 className="font-body text-3xl font-bold leading-tight tracking-tight text-primary md:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
                Freelancers qualificados prontos para trabalhar no seu projeto{" "}
                <span className="text-secondary">hoje mesmo</span>
              </h1>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
                Conectamos talento e necessidade com propostas seguras, chat
                integrado e contratos claros. Publique, compare perfis e feche
                com quem faz sentido para o seu time.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  href={role ? "/app/professionals" : "/register"}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-secondary px-8 text-base font-semibold text-white shadow-md hover:bg-secondary/90 transition-colors"
                >
                  Eu quero contratar
                </Link>
                <Link
                  href="#para-profissionais"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Você quer trabalhar?
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[118%] w-[118%] max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-secondary/25 md:max-w-[480px]"
                aria-hidden
              />
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[95%] w-[95%] max-w-[380px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/[0.06] md:max-w-[440px]" />
              <div className="relative mx-auto aspect-square w-[min(100%,320px)] md:w-[min(100%,380px)]">
                <div className="absolute inset-0 rounded-full border-4 border-white shadow-[0_24px_60px_-12px_rgba(0,32,69,0.18)]">
                  <Image
                    src="/hero-professional.png"
                    alt="Profissional em escritório moderno trabalhando no laptop"
                    fill
                    className="rounded-full object-cover object-[center_20%]"
                    sizes="(max-width: 1024px) 320px, 380px"
                    priority
                  />
                </div>
                {heroOrbitIcons.map(({ icon, style }) => (
                  <div
                    key={icon}
                    className={cn(
                      "absolute flex size-11 items-center justify-center rounded-full border border-secondary/20 bg-white shadow-md md:size-12",
                      style
                    )}
                  >
                    <span className="material-symbols-outlined text-xl text-secondary md:text-2xl">
                      {icon}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <section
        id="como-funciona"
        className="border-b border-border/40 bg-white px-6 py-20 md:px-10 md:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-2xl">
            <span className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">
              Comece agora
            </span>
            <h2 className="font-headline text-3xl font-bold tracking-tight text-primary md:text-4xl lg:text-[2.5rem]">
              Como funciona
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {processSteps.map((s) => (
              <div key={s.title} className="flex flex-col">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-secondary shadow-sm">
                  <span className="material-symbols-outlined text-2xl text-white">
                    {s.icon}
                  </span>
                </div>
                <h3 className="mb-2 font-body text-lg font-bold text-primary">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="confianca"
        className="border-b border-border/40 bg-[#f0f3f7] px-6 py-20 md:px-10 md:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-3xl">
            <span className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">
              Confiança
            </span>
            <h2 className="font-headline text-3xl font-bold tracking-tight text-primary md:text-4xl lg:text-[2.5rem]">
              Confiança de quem lidera
            </h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-10">
            <div className="flex flex-col rounded-xl border border-black/[0.06] bg-white p-8 shadow-[0_20px_50px_-24px_rgba(0,32,69,0.25)] md:p-10 lg:p-12">
              <span
                className="font-headline mb-6 block text-6xl leading-none text-secondary md:text-7xl"
                aria-hidden
              >
                &ldquo;
              </span>
              <blockquote className="font-headline mb-10 flex-1 text-xl leading-snug text-primary md:text-2xl lg:text-[1.65rem] lg:leading-snug">
                A Pronnect mudou como fechamos squads externos: menos atrito,
                mais previsibilidade e visibilidade do que importa.
              </blockquote>
              <div className="flex items-center gap-4 border-t border-border/60 pt-8">
                <Avatar
                  size="lg"
                  className="size-14 border-2 border-secondary/35"
                >
                  <AvatarFallback className="bg-primary text-base font-semibold text-white">
                    RS
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-primary">Ricardo Salles</p>
                  <p className="text-sm text-muted-foreground">
                    Diretor de Operações, VisionTech
                  </p>
                </div>
              </div>
            </div>

            <div className="grid min-h-[340px] grid-cols-2 grid-rows-2 gap-3 sm:gap-4 md:min-h-[400px] lg:min-h-0">
              <div className="relative min-h-[160px] overflow-hidden rounded-xl sm:min-h-[180px]">
                <Image
                  src="https://picsum.photos/seed/pronnect-trust-a/500/700"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="flex flex-col justify-center rounded-xl bg-secondary p-6 text-white shadow-inner sm:p-8">
                <p className="font-headline text-3xl font-bold sm:text-4xl">
                  98%
                </p>
                <p className="mt-2 text-sm font-medium leading-snug text-white/95">
                  Taxa de satisfação entre usuários ativos
                </p>
              </div>
              <div className="flex flex-col justify-center rounded-xl bg-primary p-6 text-white shadow-inner sm:p-8">
                <p className="font-headline text-3xl font-bold sm:text-4xl">
                  500+
                </p>
                <p className="mt-2 text-sm font-medium leading-snug text-white/90">
                  Projetos e contratações na plataforma
                </p>
              </div>
              <div className="relative min-h-[160px] overflow-hidden rounded-xl sm:min-h-[180px]">
                <Image
                  src="https://picsum.photos/seed/pronnect-trust-b/500/700"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2">
        <div
          id="para-clientes"
          className="bg-primary px-8 py-16 text-white md:px-12 md:py-24 lg:px-16"
        >
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-secondary-fixed">
            Para clientes
          </p>
          <h2 className="font-headline mb-10 text-3xl font-bold leading-tight md:text-4xl">
            Escale com confiança total.
          </h2>
          <ul className="space-y-8">
            {clientFeatures.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-secondary-fixed text-2xl">
                  {f.icon}
                </span>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/65">
                    {f.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="mt-10 inline-flex items-center gap-1 text-sm font-semibold text-secondary-fixed hover:text-white"
          >
            Contratar talento
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>
        <div
          id="para-profissionais"
          className="bg-[#0a3d36] px-8 py-16 text-white md:px-12 md:py-24 lg:px-16"
        >
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-emerald-200/90">
            Para profissionais
          </p>
          <h2 className="font-headline mb-10 text-3xl font-bold leading-tight md:text-4xl">
            Trabalho de elite, remuneração justa.
          </h2>
          <ul className="space-y-8">
            {professionalFeatures.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-2xl text-emerald-200">
                  {f.icon}
                </span>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/70">
                    {f.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="mt-10 inline-flex items-center gap-1 text-sm font-semibold text-emerald-200 hover:text-white"
          >
            Encontrar oportunidades
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>
      </section>

      <section
        id="seguranca"
        className="border-b border-border/40 bg-[#f0f3f7] px-6 py-20 md:px-10 md:py-28"
      >
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border border-black/[0.06] bg-white p-8 shadow-[0_24px_60px_-28px_rgba(0,32,69,0.2)] md:p-12 md:pt-14">
            <div className="mb-10 text-center">
              <h2 className="font-headline text-3xl font-bold text-primary md:text-[2rem]">
                Segurança e confiança no centro
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
                Processos desenhados para reduzir risco e dar visibilidade em
                cada passo — do primeiro contato ao pagamento.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 md:gap-x-12 md:gap-y-10">
              {securityItems.map((item) => (
                <div key={item.title} className="flex gap-4">
                  <span className="material-symbols-outlined shrink-0 text-2xl text-secondary">
                    {item.icon}
                  </span>
                  <div>
                    <h3 className="mb-1.5 font-semibold text-primary">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="ajuda"
        className="bg-white px-6 py-20 md:px-10 md:py-28"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center md:mb-14">
            <h2 className="font-headline text-3xl font-bold text-primary md:text-4xl">
              Precisa de ajuda?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Escolha a opção que faz mais sentido para você.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {helpOptions.map((opt) => (
              <Card
                key={opt.title}
                className="border-border/80 shadow-sm transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
                    <span className="material-symbols-outlined text-2xl text-secondary">
                      {opt.icon}
                    </span>
                  </div>
                  <CardTitle className="font-headline text-lg text-primary">
                    {opt.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {opt.text}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href={opt.href}
                    className="text-sm font-semibold text-secondary hover:underline"
                  >
                    Acessar
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#061428] px-6 py-16 text-white md:px-10 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            <div className="lg:col-span-1">
              <PronnectLogo inverted />
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
                Marketplace para talento de tecnologia e clientes que precisam
                de execução com qualidade e segurança.
              </p>
            </div>
            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                Redes sociais
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="#"
                  aria-label="LinkedIn"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:border-white/30 hover:bg-white/10"
                >
                  <LinkedInIcon size={20} />
                </Link>
                <Link
                  href="#"
                  aria-label="Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:border-white/30 hover:bg-white/10"
                >
                  <InstagramIcon size={20} />
                </Link>
                <Link
                  href="#"
                  aria-label="YouTube"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:border-white/30 hover:bg-white/10"
                >
                  <YouTubeIcon size={20} />
                </Link>
              </div>
            </div>
            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                Política e privacidade
              </p>
              <ul className="space-y-3 text-sm text-white/65">
                <li>
                  <Link href="#" className="hover:text-white">
                    Política de privacidade
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Termos de uso
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Política de cookies
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                Segurança e compliance
              </p>
              <ul className="space-y-3 text-sm text-white/65">
                <li>
                  <Link href="#" className="hover:text-white">
                    Central de segurança
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Denúncias e abusos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white">
                    Transparência e LGPD
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="my-12 bg-white/10" />
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-white/45 md:flex-row">
            <p>
              © {new Date().getFullYear()} Pronnect. Todos os direitos
              reservados.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="#" className="hover:text-white/80">
                Privacidade
              </Link>
              <Link href="#" className="hover:text-white/80">
                Termos
              </Link>
              <Link href="/login" className="hover:text-white/80">
                Suporte
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
