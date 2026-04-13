"use client";

import type {
  ProfessionalProfileResponse,
  SkillResponse,
} from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function ProfessionalOnboardingPage() {
  const router = useRouter();
  const role = getRoleFromToken();

  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [skills, setSkills] = useState<SkillResponse[]>([]);
  const [mySkillIds, setMySkillIds] = useState<Set<string>>(new Set());
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "PROFESSIONAL") {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const all = await api<SkillResponse[]>("/skills");
        setSkills(all);
      } catch {
        setError("Não foi possível carregar habilidades.");
      }
      try {
        const me = await api<ProfessionalProfileResponse>("/professionals/me");
        setHasProfile(true);
        setHeadline(me.headline || "");
        setDescription(me.description || "");
        setContactEmail(me.contactEmail || "");
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 404)) {
          setError("Erro ao carregar perfil.");
        }
      }
      try {
        const mine = await api<{ id: string; name: string }[]>(
          "/professionals/me/skills"
        );
        setMySkillIds(new Set(mine.map((s) => s.id)));
      } catch {
        /* sem perfil ainda */
      } finally {
        setLoading(false);
      }
    })();
  }, [role]);

  async function createOrUpdate(e: FormEvent) {
    e.preventDefault();
    if (role !== "PROFESSIONAL") return;
    setError(null);
    setStatus(null);
    setSaving(true);
    try {
      if (!hasProfile) {
        await api("/professionals", {
          method: "POST",
          json: { headline, description, contactEmail },
        });
        setHasProfile(true);
      } else {
        await api("/professionals", {
          method: "PUT",
          json: { headline, description, contactEmail },
        });
      }
      setStatus("Perfil salvo.");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSkill(skillId: string) {
    if (role !== "PROFESSIONAL" || !hasProfile) {
      setError("Salve o perfil antes de adicionar habilidades.");
      return;
    }
    setError(null);
    const has = mySkillIds.has(skillId);
    try {
      if (has) {
        await api(`/professionals/me/skills/${skillId}`, {
          method: "DELETE",
        });
        setMySkillIds((prev) => {
          const n = new Set(prev);
          n.delete(skillId);
          return n;
        });
      } else {
        await api("/professionals/me/skills", {
          method: "POST",
          json: { skillId },
        });
        setMySkillIds((prev) => new Set(prev).add(skillId));
      }
      await api<ProfessionalProfileResponse>("/professionals/me").then((me) => {
        if (me.profileCompleted) {
          setStatus("Perfil completo. Você aparece nas buscas.");
        }
      });
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    }
  }

  if (role !== "PROFESSIONAL") {
    return (
      <p className="text-on-surface-variant">
        Apenas contas de profissional podem acessar esta página.
      </p>
    );
  }

  if (loading) {
    return <p className="text-on-surface-variant">Carregando…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-headline mb-2 text-2xl text-primary">
        Perfil profissional
      </h1>
      <p className="mb-6 text-sm text-on-surface-variant">
        Preencha os dados e escolha ao menos uma habilidade para concluir o
        perfil.
      </p>

      <form
        onSubmit={createOrUpdate}
        className="mb-8 space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Headline</label>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            maxLength={150}
            className="w-full rounded-lg border border-outline-variant px-3 py-2"
            placeholder="Ex.: Desenvolvedor Full Stack"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-outline-variant px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            E-mail de contato
          </label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full rounded-lg border border-outline-variant px-3 py-2"
          />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        {status && <p className="text-sm text-secondary">{status}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-primary px-6 py-2 font-bold text-on-primary disabled:opacity-50"
        >
          {saving ? "Salvando…" : hasProfile ? "Atualizar" : "Criar perfil"}
        </button>
      </form>

      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
        <h2 className="font-headline mb-4 text-lg text-primary">Habilidades</h2>
        {!hasProfile && (
          <p className="mb-4 text-sm text-on-surface-variant">
            Crie o perfil acima para habilitar a seleção.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => {
            const on = mySkillIds.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                disabled={!hasProfile}
                onClick={() => toggleSkill(s.id)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                  on
                    ? "bg-secondary text-on-secondary"
                    : "bg-surface-container text-primary hover:bg-surface-container-high"
                } disabled:opacity-40`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-8">
        <Link href="/app" className="text-secondary hover:underline">
          Voltar ao painel
        </Link>
      </p>
    </div>
  );
}
