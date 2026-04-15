"use client";

import type { ProfessionalProfileResponse, SpringPage } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// ─── Extended type for example profiles ───
interface ExampleProfile extends ProfessionalProfileResponse {
  photoUrl: string;
}

// ─── 3 Example profiles for demo ───
const EXAMPLE_PROFILES: ExampleProfile[] = [
  {
    id: "example-1",
    name: "Ana Carolina Silva",
    headline: "Desenvolvedora Full Stack",
    description: "Especialista em React, Node.js e TypeScript com 5 anos de experiência construindo aplicações web de alta performance. Apaixonada por interfaces modernas, arquitetura limpa e APIs escaláveis. Já atuei em projetos de e-commerce com +100k usuários, fintechs (processamento de pagamentos) e plataformas SaaS B2B. Certificação AWS Solutions Architect e experiência com metodologias ágeis (Scrum/Kanban).",
    contactEmail: "ana.silva@email.com",
    profileCompleted: true,
    skills: ["React", "TypeScript", "Node.js", "Next.js", "PostgreSQL", "Docker", "AWS"],
    createdAt: "2025-01-15T10:00:00Z",
    photoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "example-2",
    name: "Rafael Mendes",
    headline: "Designer UI/UX Sênior",
    description: "Designer com mais de 7 anos de experiência criando interfaces digitais que encantam e convertem. Especializado em design systems escaláveis, prototipagem de alta fidelidade no Figma e pesquisa de usuário quantitativa e qualitativa. Foco em acessibilidade (WCAG 2.1) e experiência premium. Portfolio inclui projetos para Nubank, iFood, Ambev e diversas startups do ecossistema brasileiro.",
    contactEmail: "rafael.mendes@email.com",
    profileCompleted: true,
    skills: ["Figma", "UI Design", "UX Research", "Design System", "Prototyping", "Adobe CC", "Motion Design"],
    createdAt: "2025-03-20T14:00:00Z",
    photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: "example-3",
    name: "Juliana Ferreira",
    headline: "Engenheira de Dados & IA",
    description: "Engenheira de dados com expertise em Python, Machine Learning e construção de pipelines de dados robustos. Mais de 6 anos de experiência com infraestrutura AWS, Apache Spark e modelos de NLP/LLMs. Já desenvolvi soluções de IA para startups e grandes empresas — desde chatbots inteligentes e sistemas de recomendação até análise preditiva de churn. Mestrado em Ciência da Computação pela USP.",
    contactEmail: "juliana.ferreira@email.com",
    profileCompleted: true,
    skills: ["Python", "Machine Learning", "AWS", "SQL", "Data Engineering", "TensorFlow", "Spark"],
    createdAt: "2025-02-10T09:00:00Z",
    photoUrl: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

// ─── Helper to get photo URL for example profiles ───
const EXAMPLE_PHOTO_MAP: Record<string, string> = {};
EXAMPLE_PROFILES.forEach((p) => { EXAMPLE_PHOTO_MAP[p.id] = p.photoUrl; });

export default function ProfessionalsSearchPage() {
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<SpringPage<ProfessionalProfileResponse> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Debounce ref — avoids rapid re-fetches while typing
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (searchText: string, searchPage: number) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(searchPage));
    params.set("size", "9");
    if (searchText.trim()) params.set("text", searchText.trim());
    try {
      const res = await api<SpringPage<ProfessionalProfileResponse>>(
        `/professionals?${params.toString()}`
      );

      // On page 0, append example profiles (filtered by search text)
      if (searchPage === 0) {
        const q = searchText.trim().toLowerCase();
        const filteredExamples = q
          ? EXAMPLE_PROFILES.filter(
              (p) =>
                p.name?.toLowerCase().includes(q) ||
                p.headline?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.skills.some((s) => s.toLowerCase().includes(q))
            )
          : EXAMPLE_PROFILES;

        // Avoid duplicating if IDs already exist
        const existingIds = new Set(res.content.map((p) => p.id));
        const newExamples = filteredExamples.filter((p) => !existingIds.has(p.id));

        setData({
          ...res,
          content: [...res.content, ...newExamples],
          totalElements: res.totalElements + newExamples.length,
        });
      } else {
        setData(res);
      }
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Erro ao buscar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initial load
  useEffect(() => {
    load("", 0);
  }, [load]);

  // Debounced search while typing
  useEffect(() => {
    if (!mounted) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      load(text, 0);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, mounted, load]);

  // Page change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!mounted) return;
    load(text, page);
  }, [page]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPage(0);
    load(text, 0);
  }

  if (!mounted) {
    return <div className="p-8 text-center text-on-surface-variant">Carregando pagina...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center sm:text-left">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl lg:text-6xl max-w-3xl">
          Encontre o especialista ideal para seu projeto
        </h1>
        <p className="text-lg text-on-surface-variant md:text-xl max-w-2xl">
          Conectamos as mentes mais brilhantes do mercado digital para transformar suas ideias em produtos de alto nível.
        </p>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={onSearch}
        className="mb-12 flex w-full flex-col gap-3 rounded-2xl bg-surface-container-lowest p-2 shadow-xl border border-outline-variant/30 sm:flex-row sm:items-center"
      >
        <div className="flex flex-1 items-center px-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Pesquise por skill, orçamento, descrição..."
            className="w-full bg-transparent py-3 text-on-surface outline-none placeholder:text-on-surface-variant/60"
          />
        </div>
        
        <div className="flex items-center gap-2 px-2 pb-2 sm:pb-0">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-surface px-6 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
          >
            <SlidersHorizontal size={18} />
            Filtros
          </button>
          
          <button
            type="submit"
            className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary transition-all duration-200 hover:scale-105 hover:bg-primary/90 active:scale-95"
            aria-label="Buscar"
          >
            <Search size={20} />
          </button>
        </div>
      </form>

      {error && <p className="mb-8 text-error">{error}</p>}

      {/* Results area — min-height prevents layout "jumping" */}
      <div className="min-h-[200px]">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
          </div>
        )}

        {!loading && data && data.content.length === 0 && (
          <p className="mt-8 text-center text-on-surface-variant content-fade-in">
            Nenhum profissional encontrado para sua busca.
          </p>
        )}

        {!loading && data && data.content.length > 0 && (
          <div className="content-fade-in">
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.content.map((p) => {
                const name = p.name || p.headline || "Profissional";
                const initial = name.charAt(0).toUpperCase();
                const photoUrl = EXAMPLE_PHOTO_MAP[p.id];
                return (
                  <li
                    key={p.id}
                    className="flex flex-col overflow-hidden rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-outline-variant/30"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      {/* Profile Avatar */}
                      {photoUrl ? (
                        <div className="h-16 w-16 rounded-full overflow-hidden shadow-sm border-2 border-white">
                          <Image src={photoUrl} alt={name} width={64} height={64} className="object-cover w-full h-full" />
                        </div>
                      ) : (
                        <Avatar className="h-16 w-16 shadow-sm">
                          <AvatarFallback className="bg-primary text-white text-xl font-bold">
                            {initial}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {/* Completed badge */}
                      {p.profileCompleted && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          Ativo
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-on-surface line-clamp-1 capitalize">
                        {name}
                      </h2>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-secondary line-clamp-1">
                        {p.headline || "Profissional"}
                      </h3>

                      {/* Description preview */}
                      {p.description && (
                        <p className="text-xs text-on-surface-variant line-clamp-2 mb-3 leading-relaxed">
                          {p.description}
                        </p>
                      )}
                      
                      {/* Skills Grid */}
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {p.skills.length > 0 ? (
                          <>
                            {p.skills.slice(0, 4).map((s) => (
                              <span
                                key={s}
                                className="rounded-lg bg-surface px-2.5 py-1 text-[11px] font-bold text-on-surface-variant"
                              >
                                {s.toUpperCase()}
                              </span>
                            ))}
                            {p.skills.length > 4 && (
                              <span className="rounded-lg bg-surface px-2.5 py-1 text-[11px] font-bold text-on-surface-variant">
                                +{p.skills.length - 4}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-on-surface-variant italic">Nenhuma habilidade listada</span>
                        )}
                      </div>
                    </div>

                    {/* Ver Perfil Button */}
                    <Link
                      href={`/app/professionals/${p.id}`}
                      className="mt-2 block w-full rounded-xl bg-secondary py-3 text-center text-sm font-bold text-white transition-colors hover:bg-secondary/90"
                    >
                      Ver Perfil
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-10 flex items-center justify-between gap-4">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-xl bg-surface px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors disabled:opacity-40 hover:bg-surface-container"
              >
                Anterior
              </button>
              <span className="text-sm font-medium text-on-surface-variant">
                Página {data.number + 1} de {Math.max(1, data.totalPages)} (
                {data.totalElements} perfis)
              </span>
              <button
                type="button"
                disabled={page >= data.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl bg-surface px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors disabled:opacity-40 hover:bg-surface-container"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
