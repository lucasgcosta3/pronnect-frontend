"use client";

import type { CompanyProfileResponse } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const role = getRoleFromToken();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [location, setLocation] = useState("");
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "COMPANY") {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const me = await api<CompanyProfileResponse>("/companies/me");
        setHasProfile(true);
        setName(me.name || "");
        setDescription(me.description || "");
        setContactEmail(me.contactEmail || "");
        setLocation(me.location || "");
      } catch (e) {
        if (!(e instanceof ApiError && e.status === 404)) {
          setError("Erro ao carregar empresa.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [role]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (role !== "COMPANY") return;
    setError(null);
    setStatus(null);
    setSaving(true);
    try {
      if (!hasProfile) {
        await api("/companies", {
          method: "POST",
          json: { name, description, contactEmail, location },
        });
        setHasProfile(true);
      } else {
        await api("/companies", {
          method: "PUT",
          json: { name, description, contactEmail, location },
        });
      }
      setStatus("Dados salvos.");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (role !== "COMPANY") {
    return (
      <p className="text-on-surface-variant">
        Apenas contas de empresa podem acessar esta página.
      </p>
    );
  }

  if (loading) {
    return <p className="text-on-surface-variant">Carregando…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-headline mb-6 text-2xl text-primary">
        Dados da empresa
      </h1>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Nome</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-outline-variant px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Descrição</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-outline-variant px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            E-mail de contato
          </label>
          <input
            type="email"
            required
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full rounded-lg border border-outline-variant px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Localização</label>
          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-lg border border-outline-variant px-3 py-2"
            placeholder="Cidade / remoto"
          />
        </div>
        {error && <p className="text-sm text-error">{error}</p>}
        {status && <p className="text-sm text-secondary">{status}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-primary px-6 py-2 font-bold text-on-primary disabled:opacity-50"
        >
          {saving ? "Salvando…" : hasProfile ? "Atualizar" : "Criar empresa"}
        </button>
      </form>
      <p className="mt-8">
        <Link href="/app" className="text-secondary hover:underline">
          Voltar ao painel
        </Link>
      </p>
    </div>
  );
}
