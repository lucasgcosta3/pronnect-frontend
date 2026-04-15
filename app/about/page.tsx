import Image from "next/image";
import Link from "next/link";

import { MainNavbar } from "@/components/MainNavbar";
import { PronnectLogo } from "@/components/PronnectLogo";
import { Separator } from "@/components/ui/separator";
import { LinkedInIcon, InstagramIcon, YouTubeIcon } from "@/components/SocialIcons";
import { cn } from "@/lib/utils";

const storyColumns = [
  {
    title: "História da Empresa",
    text: "A Pronnect nasceu da necessidade de conectar talentos de tecnologia a empresas que buscam execução com excelência. Fundada em Recife, carregamos a inovação e a criatividade do ecossistema tech do Porto Digital no nosso DNA. Desde o início, trabalhamos para construir uma plataforma que valorize tanto quem contrata quanto quem executa.",
  },
  {
    title: "Missão",
    text: "Nossa missão é democratizar o acesso a profissionais qualificados de tecnologia, oferecendo um ambiente seguro, transparente e eficiente para contratações. Acreditamos que todo projeto merece o melhor talento, e todo profissional merece oportunidades que reconheçam seu valor e expertise.",
  },
  {
    title: "Valores da Empresa",
    text: "Transparência em cada etapa do processo. Segurança para ambos os lados da contratação. Qualidade acima de quantidade. Respeito pelo trabalho e pelo tempo de cada profissional. Inovação constante para oferecer a melhor experiência possível na plataforma.",
  },
] as const;

const teamMembers = [
  {
    name: "Lucas Ferreira",
    role: "CEO",
    desc: "Líder visionário com experiência no ecossistema tech de Recife.",
    avatar: "https://i.pravatar.cc/200?u=lucas-team",
  },
  {
    name: "Mariana Costa",
    role: "COO",
    desc: "Especialista em operações e processos de plataformas digitais.",
    avatar: "https://i.pravatar.cc/200?u=mariana-team",
  },
  {
    name: "Rafael Oliveira",
    role: "CTO",
    desc: "Engenheiro de software com foco em arquitetura e escalabilidade.",
    avatar: "https://i.pravatar.cc/200?u=rafael-team",
  },
  {
    name: "Ana Beatriz Lima",
    role: "Head de Design",
    desc: "UX/UI designer apaixonada por criar experiências excepcionais.",
    avatar: "https://i.pravatar.cc/200?u=ana-team",
  },
] as const;

export default function AboutPage() {
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
              Nossa missão é conectar empresas a profissionais de tecnologia
              excepcionais, com segurança, transparência e eficiência.
            </p>
          </div>
        </div>
      </header>

      {/* ─── OUR STORY ─── */}
      <section className="border-b border-border/40 bg-white px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <h2 className="font-headline text-3xl font-bold tracking-tight text-primary md:text-4xl lg:text-[2.5rem]">
              Conheça a Pronnect
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-border/40">
            {storyColumns.map((col, index) => (
              <div 
                key={col.title} 
                className={cn(
                  "flex flex-col", 
                  index === 0 ? "md:pr-8" : index === 2 ? "md:pl-8" : "md:px-8"
                )}
              >
                <h3 className="mb-4 font-body text-lg font-bold text-primary">
                  {col.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {col.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MEET OUR TEAM ─── */}
      <section className="border-b border-border/40 bg-[#f0f3f7] px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <span className="mb-3 block text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">
              Quem faz acontecer
            </span>
            <h2 className="font-headline text-3xl font-bold tracking-tight text-primary md:text-4xl lg:text-[2.5rem]">
              Nosso Time
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="flex flex-col items-center rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative mb-5 h-24 w-24 overflow-hidden rounded-full border-[3px] border-white shadow-md">
                  <Image
                    src={member.avatar}
                    alt={member.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <h3 className="font-body text-base font-bold text-primary">
                  {member.name}
                </h3>
                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary">
                  {member.role}
                </p>
                <p className="mb-5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {member.desc}
                </p>
                <Link
                  href="#"
                  className="mb-4 text-sm font-semibold text-secondary hover:underline"
                >
                  Saiba Mais
                </Link>
                <div className="flex gap-2">
                  <a
                    href="#"
                    aria-label={`LinkedIn de ${member.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-primary/70 transition-colors hover:bg-primary hover:text-white"
                  >
                    <LinkedInIcon size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
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
