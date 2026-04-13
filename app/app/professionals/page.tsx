"use client";

import type { ProfessionalProfileResponse, SpringPage } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

export default function ProfessionalsSearchPage() {
  const role = getRoleFromToken();
  const [skill, setSkill] = useState("");
  const [text, setText] = useState("");
  const [page, setPage] = useState(0);
  const [searchTick, setSearchTick] = useState(0);
  const [data, setData] = useState<SpringPage<ProfessionalProfileResponse> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("size", "9");
    if (skill.trim()) params.set("skill", skill.trim());
    if (text.trim()) params.set("text", text.trim());
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
  }, [page, skill, text]);

  useEffect(() => {
    load();
  }, [load, searchTick]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setPage(0);
    setSearchTick((t) => t + 1);
  }

  if (role !== "COMPANY") {
    return (
      <p className="text-on-surface-variant">
        Apenas empresas podem buscar profissionais neste MVP.
      </p>
    );
  }

  return (
    <div>
      <h1 className="font-headline mb-6 text-2xl text-primary">
        Profissionais
      </h1>
      <form
        onSubmit={onSearch}
        className="mb-8 flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Habilidade</label>
          <input
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            placeholder="Ex.: Java, React"
            className="w-full rounded-lg border border-outline-variant px-3 py-2"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium">Texto livre</label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Palavras no perfil"
            className="w-full rounded-lg border border-outline-variant px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-secondary px-6 py-2 font-bold text-on-secondary"
        >
          Buscar
        </button>
      </form>

      {error && <p className="mb-4 text-error">{error}</p>}
      {loading && <p className="text-on-surface-variant">Carregando…</p>}

      {!loading && data && (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.content.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
              >
                <h2 className="font-bold text-primary">
                  {p.headline || "Profissional"}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-on-surface-variant">
                  {p.description || "—"}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {p.skills.slice(0, 5).map((s) => (
                    <span
                      key={s}
                      className="rounded-md bg-surface-container px-2 py-0.5 text-[10px] font-bold text-primary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <Link
                  href={`/app/professionals/${p.id}`}
                  className="mt-4 inline-block text-sm font-bold text-secondary hover:underline"
                >
                  Ver perfil
                </Link>
              </li>
            ))}
          </ul>
          {data.content.length === 0 && (
            <p className="text-on-surface-variant">Nenhum resultado.</p>
          )}
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-outline-variant px-4 py-2 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-sm text-on-surface-variant">
              Página {data.number + 1} de {Math.max(1, data.totalPages)} (
              {data.totalElements} perfis)
            </span>
            <button
              type="button"
              disabled={page >= data.totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-outline-variant px-4 py-2 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
}
