"use client";

import type { ProjectResponse, SpringPage } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Search, Briefcase, DollarSign, Clock, Plus } from "lucide-react";

export default function ProjectsPage() {
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<SpringPage<ProjectResponse> | null>(null);
  const [myProjects, setMyProjects] = useState<ProjectResponse[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "my">("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAllProjects = useCallback(async (searchText: string, searchPage: number) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(searchPage));
    params.set("size", "9");
    if (searchText.trim()) params.set("search", searchText.trim());
    try {
      const res = await api<SpringPage<ProjectResponse>>(`/projects?${params.toString()}`);
      setData(res);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Erro ao carregar projetos.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<ProjectResponse[]>("/projects/my");
      setMyProjects(res);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Erro ao carregar seus projetos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    setRole(getRoleFromToken());
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (activeTab === "all") {
      loadAllProjects(text, page);
    } else {
      loadMyProjects();
    }
  }, [activeTab, page, mounted]);

  // Debounced search for typing
  useEffect(() => {
    if (!mounted || activeTab !== "all") return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      loadAllProjects(text, 0);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text, mounted, activeTab, loadAllProjects]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPage(0);
    loadAllProjects(text, 0);
  }

  if (!mounted) {
    return <div className="p-8 text-center text-muted-foreground">Carregando página...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 mt-16">
      {/* Header */}
      <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            {role === "COMPANY" ? "Projetos e Oportunidades" : "Buscar Projetos"}
          </h1>
          <p className="mt-2 text-muted-foreground max-w-xl">
            {role === "COMPANY"
              ? "Gerencie seus projetos publicados ou explore outras oportunidades na plataforma."
              : "Encontre os melhores projetos do mercado freelance e envie seus lances."}
          </p>
        </div>

        {role === "COMPANY" && (
          <Link
            href="/app/projects/new"
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
          >
            <Plus size={18} />
            Publicar Projeto
          </Link>
        )}
      </div>

      {/* Tabs for Company */}
      {role === "COMPANY" && (
        <div className="mb-8 border-b border-border flex gap-6">
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "all"
                ? "border-secondary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos os Projetos
          </button>
          <button
            onClick={() => {
              setActiveTab("my");
              loadMyProjects();
            }}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "my"
                ? "border-secondary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Meus Projetos Publicados ({myProjects.length})
          </button>
        </div>
      )}

      {/* Search area only for general projects */}
      {activeTab === "all" && (
        <form
          onSubmit={onSearch}
          className="mb-8 flex w-full flex-col gap-3 rounded-2xl bg-card p-2 shadow-xl border border-border sm:flex-row sm:items-center dark:shadow-none"
        >
          <div className="flex flex-1 items-center px-4">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pesquise por habilidades, tecnologias ou palavras-chave..."
              className="w-full bg-transparent py-3 text-foreground outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <div className="flex items-center gap-2 px-2 pb-2 sm:pb-0">
            <button
              type="submit"
              className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:scale-105 hover:bg-primary/90 active:scale-95"
              aria-label="Buscar"
            >
              <Search size={20} />
            </button>
          </div>
        </form>
      )}

      {error && <p className="mb-8 text-destructive font-medium">{error}</p>}

      {/* Loading Indicator */}
      <div className="min-h-[300px]">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {/* All Projects Content */}
        {!loading && activeTab === "all" && data && (
          <>
            {data.content.length === 0 ? (
              <p className="mt-8 text-center text-muted-foreground">
                Nenhum projeto encontrado para sua busca.
              </p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data.content.map((project) => (
                  <ProjectCard key={project.id} project={project} isOwner={project.companyId === myProjects[0]?.companyId} />
                ))}
              </div>
            )}

            {data.content.length > 0 && (
              <div className="mt-10 flex items-center justify-between gap-4">
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-xl bg-muted px-5 py-2.5 text-sm font-semibold text-foreground transition-colors disabled:opacity-40 hover:bg-muted/80"
                >
                  Anterior
                </button>
                <span className="text-sm font-medium text-muted-foreground">
                  Página {data.number + 1} de {Math.max(1, data.totalPages)} ({data.totalElements} projetos)
                </span>
                <button
                  type="button"
                  disabled={page >= data.totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl bg-muted px-5 py-2.5 text-sm font-semibold text-foreground transition-colors disabled:opacity-40 hover:bg-muted/80"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}

        {/* My Projects Content */}
        {!loading && activeTab === "my" && (
          <>
            {myProjects.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center">
                <Briefcase className="mx-auto text-muted-foreground mb-4 opacity-50" size={40} />
                <p className="text-muted-foreground font-medium mb-4">Você ainda não publicou nenhum projeto.</p>
                <Link
                  href="/app/projects/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/95 transition-colors"
                >
                  <Plus size={16} /> Publicar agora
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {myProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} isOwner />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ project, isOwner = false }: { project: ProjectResponse; isOwner?: boolean }) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">Aberto</span>;
      case "CLOSED":
        return <span className="rounded-full bg-red-50 dark:bg-red-950 px-2.5 py-1 text-[11px] font-bold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">Fechado</span>;
      case "IN_PROGRESS":
        return <span className="rounded-full bg-amber-50 dark:bg-amber-950 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">Em Progresso</span>;
      case "COMPLETED":
        return <span className="rounded-full bg-blue-50 dark:bg-blue-950 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">Concluído</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl bg-card p-6 shadow-sm border border-border hover:shadow-md transition-shadow relative">
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground line-clamp-1">{project.companyName}</span>
        {getStatusBadge(project.status)}
      </div>

      <div className="flex-1">
        <h2 className="text-lg font-bold text-foreground line-clamp-2 leading-snug mb-2">{project.title}</h2>

        {/* Budget & Payment Type */}
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-muted-foreground">
          <div className="flex items-center gap-1">
            {project.paymentType === "FIXED_PRICE" ? (
              <>
                <DollarSign size={14} className="text-accent" />
                <span>Valor Fixo</span>
              </>
            ) : (
              <>
                <Clock size={14} className="text-accent" />
                <span>Por Hora</span>
              </>
            )}
          </div>
          {(project.budgetMin !== null || project.budgetMax !== null) && (
            <div className="flex items-center gap-1 text-foreground font-bold">
              <span>
                {project.budgetMin !== null && project.budgetMax !== null
                  ? `R$ ${project.budgetMin.toLocaleString("pt-BR")} - R$ ${project.budgetMax.toLocaleString("pt-BR")}`
                  : project.budgetMin !== null
                  ? `A partir de R$ ${project.budgetMin.toLocaleString("pt-BR")}`
                  : project.budgetMax !== null
                  ? `Até R$ ${project.budgetMax.toLocaleString("pt-BR")}`
                  : "A combinar"}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-3 mb-4 leading-relaxed">{project.description}</p>

        {/* Skills */}
        <div className="mb-6 flex flex-wrap gap-1.5">
          {project.skills && project.skills.length > 0 ? (
            project.skills.slice(0, 3).map((s) => (
              <span key={s} className="rounded-lg bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                {s}
              </span>
            ))
          ) : (
            <span className="text-[10px] italic text-muted-foreground">Sem requerimentos</span>
          )}
          {project.skills && project.skills.length > 3 && (
            <span className="rounded-lg bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              +{project.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer Info & Action */}
      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between gap-4">
        <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
          <Briefcase size={12} />
          {project.bidCount} {project.bidCount === 1 ? "lance" : "lances"}
        </span>

        <Link
          href={`/app/projects/${project.id}`}
          className="rounded-xl bg-primary px-4 py-2 text-center text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-colors"
        >
          {isOwner ? "Gerenciar" : "Ver Detalhes"}
        </Link>
      </div>
    </div>
  );
}
