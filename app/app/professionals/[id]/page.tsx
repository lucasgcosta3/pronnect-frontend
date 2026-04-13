"use client";

import type { ProfessionalProfileResponse, ProposalResponse } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export default function ProfessionalDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const role = getRoleFromToken();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfessionalProfileResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [proposalOk, setProposalOk] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await api<ProfessionalProfileResponse>(`/professionals/${id}`);
        setProfile(p);
      } catch (e) {
        if (e instanceof ApiError) setError(e.message);
        else setError("Perfil não encontrado.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function sendProposal(e: FormEvent) {
    e.preventDefault();
    if (role !== "COMPANY") return;
    setSubmitting(true);
    setProposalOk(null);
    setError(null);
    try {
      const res = await api<ProposalResponse>("/proposals", {
        method: "POST",
        json: {
          professionalId: id,
          message,
          price: Number(price),
        },
      });
      setProposalOk(`Proposta enviada (status: ${res.status}).`);
      setMessage("");
      setPrice("");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Falha ao enviar proposta.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-on-surface-variant">Carregando…</p>;
  }

  if (!profile) {
    return <p className="text-error">{error || "Não encontrado."}</p>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-4 text-sm text-secondary hover:underline"
      >
        Voltar
      </button>
      <h1 className="font-headline text-3xl text-primary">
        {profile.headline || "Profissional"}
      </h1>
      <p className="mt-4 whitespace-pre-wrap text-on-surface-variant">
        {profile.description || "—"}
      </p>
      <p className="mt-4 text-sm">
        <span className="font-medium text-on-surface">Contato: </span>
        {profile.contactEmail || "—"}
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {profile.skills.map((s) => (
          <span
            key={s}
            className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold text-primary"
          >
            {s}
          </span>
        ))}
      </div>

      {role === "COMPANY" && (
        <div className="mt-10 rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
          <h2 className="font-headline mb-4 text-lg text-primary">
            Enviar proposta
          </h2>
          <form onSubmit={sendProposal} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Mensagem</label>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-outline-variant px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Valor (R$)
              </label>
              <input
                type="number"
                required
                min={0}
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-outline-variant px-3 py-2"
              />
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
            {proposalOk && (
              <p className="text-sm text-secondary">{proposalOk}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-primary px-6 py-2 font-bold text-on-primary disabled:opacity-50"
            >
              {submitting ? "Enviando…" : "Enviar proposta"}
            </button>
          </form>
        </div>
      )}

      <p className="mt-8">
        <Link href="/app/professionals" className="text-secondary hover:underline">
          Lista de profissionais
        </Link>
      </p>
    </div>
  );
}
