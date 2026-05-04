"use client";

import type { ProfessionalProfileResponse, SpringPage } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
      setData(res);
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

  useEffect(() => {
    if (!mounted) return;
    load(text, page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setPage(0);
    load(text, 0);
  }

  if (!mounted) {
    return <div className="p-8 text-center text-muted-foreground">Carregando pagina...</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center sm:text-left">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl max-w-3xl">
          Encontre o especialista ideal para seu projeto
        </h1>
        <p className="text-lg text-muted-foreground dark:text-gray-300 md:text-xl max-w-2xl">
          Conectamos as mentes mais brilhantes do mercado digital para transformar suas ideias em produtos de alto nível.
        </p>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={onSearch}
        className="mb-12 flex w-full flex-col gap-3 rounded-2xl bg-card p-2 shadow-xl border border-border sm:flex-row sm:items-center dark:shadow-none"
      >
        <div className="flex flex-1 items-center px-4">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Pesquise por skill, orçamento, descrição..."
            className="w-full bg-transparent py-3 text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        
        <div className="flex items-center gap-2 px-2 pb-2 sm:pb-0">
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-muted px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80"
          >
            <SlidersHorizontal size={18} />
            Filtros
          </button>
          
          <button
            type="submit"
            className="flex h-[46px] w-[46px] flex-shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all duration-200 hover:scale-105 hover:bg-primary/90 active:scale-95"
            aria-label="Buscar"
          >
            <Search size={20} />
          </button>
        </div>
      </form>

      {error && <p className="mb-8 text-destructive">{error}</p>}

      {/* Results area — min-height prevents layout "jumping" */}
      <div className="min-h-[200px]">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {!loading && data && data.content.length === 0 && (
          <p className="mt-8 text-center text-muted-foreground dark:text-gray-300 content-fade-in">
            Nenhum profissional encontrado para sua busca.
          </p>
        )}

        {!loading && data && data.content.length > 0 && (
          <div className="content-fade-in">
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.content.map((p) => {
                const name = p.name || p.headline || "Profissional";
                const initial = name.charAt(0).toUpperCase();

                return (
                  <li
                    key={p.id}
                    className="flex flex-col overflow-hidden rounded-3xl bg-card p-6 shadow-sm border border-border dark:shadow-none"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <Avatar className="h-16 w-16 shadow-sm">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      {p.profileCompleted && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                          <span className="material-symbols-outlined text-[12px]">check_circle</span>
                          Ativo
                        </span>
                      )}
                    </div>

                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-foreground line-clamp-1 capitalize">
                        {name}
                      </h2>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-accent line-clamp-1">
                        {p.headline || "Profissional"}
                      </h3>

                      {/* Description preview */}
                      {p.description && (
                        <p className="text-xs text-muted-foreground dark:text-gray-300 line-clamp-2 mb-3 leading-relaxed">
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
                                className="rounded-lg bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground"
                              >
                                {s.toUpperCase()}
                              </span>
                            ))}
                            {p.skills.length > 4 && (
                              <span className="rounded-lg bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                                +{p.skills.length - 4}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground dark:text-gray-300 italic">Nenhuma habilidade listada</span>
                        )}
                      </div>
                    </div>

                    {/* Ver Perfil Button */}
                    <Link
                      href={`/app/professionals/${p.id}`}
                      className="mt-2 block w-full rounded-xl bg-primary py-3 text-center text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
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
                className="rounded-xl bg-muted px-5 py-2.5 text-sm font-semibold text-foreground transition-colors disabled:opacity-40 hover:bg-muted/80"
              >
                Anterior
              </button>
              <span className="text-sm font-medium text-muted-foreground dark:text-gray-300">
                Página {data.number + 1} de {Math.max(1, data.totalPages)} (
                {data.totalElements} perfis)
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
          </div>
        )}
      </div>
    </div>
  );
}
