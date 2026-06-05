"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MainNavbar } from "@/components/MainNavbar";
import { PronnectLogo } from "@/components/PronnectLogo";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LinkedInIcon, InstagramIcon, YouTubeIcon } from "@/components/SocialIcons";
import { cn } from "@/lib/utils";

const storyColumns = [
  {
    title: "História",
    text: "A Pronnect nasceu da necessidade de conectar talentos de tecnologia a empresas que buscam execução com excelência. Fundada em Recife, carregamos a inovação e a criatividade do ecossistema tech do Porto Digital no nosso DNA. Desde o início, trabalhamos para construir uma plataforma que valorize tanto quem contrata quanto quem executa.",
  },
  {
    title: "Missão",
    text: "Nossa missão é democratizar o acesso a profissionais qualificados de tecnologia, oferecendo um ambiente seguro, transparente e eficiente para contratações. Acreditamos que todo projeto merece o melhor talento, e todo profissional merece oportunidades que reconheçam seu valor e expertise.",
  },
  {
    title: "Valores",
    text: "Transparência em cada etapa do processo. Segurança para ambos os lados da contratação. Qualidade acima de quantidade. Respeito pelo trabalho e pelo tempo de cada profissional. Inovação constante para oferecer a melhor experiência possível na plataforma.",
  },
] as const;

const teamMembers = [
  {
    name: "Bruno Ricardo",
    role: "CEO",
    desc: "Líder visionário com experiência no ecossistema tech de Recife.",
    initials: "BR",
    image: "/team/bruno.jpg",
  },
  {
    name: "Evandro Júnior",
    role: "COO",
    desc: "Especialista em operações e processos de plataformas digitais.",
    initials: "EJ",
    image: "/team/evandro.jpg",
  },
  {
    name: "Lucas Costa",
    role: "CTO",
    desc: "Engenheiro de software com foco em arquitetura e escalabilidade.",
    initials: "LC",
    image: "/team/lucas.png",
  },
  {
    name: "Wendell Lins",
    role: "CPO",
    desc: "Responsável por guiar a estratégia de produto e a visão da plataforma.",
    initials: "WL",
    image: "/team/wendell.jpeg",
  },
  {
    name: "Jhonata Muniz",
    role: "QA Lead",
    desc: "Especialista em qualidade e processos de desenvolvimento.",
    initials: "JM",
    image: "/team/jonny.jpg",
  },
  {
    name: "Davi Lucas",
    role: "Head de Design",
    desc: "UX/UI designer apaixonado por criar experiências excepcionais.",
    initials: "DL",
    image: "/team/davi.jpg",
  },
] as const;

export default function AboutPage() {
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollPrev = () => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.firstElementChild?.clientWidth || 280;
      carouselRef.current.scrollBy({
        left: -(cardWidth + 24), // card width + gap (24px)
        behavior: "smooth",
      });
    }
  };

  const scrollNext = () => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.firstElementChild?.clientWidth || 280;
      carouselRef.current.scrollBy({
        left: cardWidth + 24, // card width + gap (24px)
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <MainNavbar />

      {/* ─── HERO ─── */}
      <header className="relative bg-[#0a1a2e] pt-[4.5rem] overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/recife-city.jpg"
            alt="Cidade de Recife, Pernambuco"
            fill
            className="object-cover object-center"
            sizes="100vw"
            quality={100}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#061428]/90 via-[#061428]/70 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28 lg:py-36">
          <div className="max-w-2xl">
            <h1 className="font-headline text-4xl font-bold leading-tight text-white md:text-5xl lg:text-[3.25rem] lg:leading-[1.12]">
              Sobre Nós
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-white/75 md:text-lg">
              Nossa missão é conectar empresas a profissionais de tecnologia excepcionais, com
              segurança, transparência e eficiência.
            </p>
          </div>
        </div>
      </header>

      {/* ─── OUR STORY ─── */}
      <section className="border-b border-border/40 bg-card px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-primary dark:text-white md:text-4xl lg:text-[2.5rem]">
              Conheça a Pronnect
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border/40">
            {storyColumns.map((col, index) => (
              <div
                key={col.title}
                className={cn(
                  "flex flex-col",
                  index === 0 ? "md:pr-8" : index === 2 ? "md:pl-8" : "md:px-8",
                )}
              >
                <h3 className="mb-4 font-body text-lg font-bold text-primary dark:text-white">
                  {col.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{col.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MEET OUR TEAM ─── */}
      <section className="border-b border-border/40 bg-muted/50 dark:bg-background px-6 py-20 md:px-10 md:py-28 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                Quem faz acontecer
              </span>
              <h2 className="font-headline text-3xl font-bold tracking-tight text-primary dark:text-white md:text-4xl lg:text-[2.5rem]">
                Nosso Time
              </h2>
            </div>
            {/* Carousel navigation buttons */}
            <div className="flex gap-2">
              <button
                onClick={scrollPrev}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-primary/75 dark:text-white/75 transition-all hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 shadow-sm"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={scrollNext}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-primary/75 dark:text-white/75 transition-all hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95 shadow-sm"
                aria-label="Próximo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              ref={carouselRef}
              className="no-scrollbar flex flex-row gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4"
            >
              {teamMembers.map((member) => (
                <div
                  key={member.name}
                  className="w-[85vw] sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] shrink-0 snap-start flex flex-col items-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm transition-all duration-300 hover:shadow-md dark:shadow-none hover:border-accent/40"
                >
                  <div className="mb-5">
                    <Avatar className="h-24 w-24 border-[3px] border-border shadow-md dark:border-border">
                      {member.image && (
                        <AvatarImage
                          src={member.image}
                          alt={`Foto de ${member.name}`}
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <h3 className="font-body text-base font-bold text-primary dark:text-white">
                    {member.name}
                  </h3>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-accent">
                    {member.role}
                  </p>
                  <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground min-h-[60px]">
                    {member.desc}
                  </p>
                  <Link href="#" className="mb-4 text-sm font-semibold text-accent hover:underline">
                    Saiba Mais
                  </Link>
                  <div className="flex gap-2">
                    <a
                      href="#"
                      aria-label={`LinkedIn de ${member.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-primary/70 transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <LinkedInIcon size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[--footer-bg] px-6 py-16 text-white md:px-10 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
            <div className="lg:col-span-1">
              <PronnectLogo inverted />
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
                Marketplace para talento de tecnologia e clientes que precisam de execução com
                qualidade e segurança.
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
            <p>© {new Date().getFullYear()} Pronnect. Todos os direitos reservados.</p>
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
