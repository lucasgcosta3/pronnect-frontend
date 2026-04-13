"use client";

import type { ProposalResponse } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function ProposalsInboxPage() {
  const role = getRoleFromToken();
  const [items, setItems] = useState<ProposalResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api<ProposalResponse[]>("/proposals/me");
      setItems(list);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function accept(id: string) {
    try {
      await api(`/proposals/${id}/accept`, { method: "PATCH" });
      await load();
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    }
  }

  async function reject(id: string) {
    try {
      await api(`/proposals/${id}/reject`, { method: "PATCH" });
      await load();
    } catch (e) {
      if (e instanceof ApiError) alert(e.message);
    }
  }

  if (role !== "PROFESSIONAL") {
    return (
      <p className="text-on-surface-variant">
        Apenas profissionais recebem propostas aqui.
      </p>
    );
  }

  if (loading) {
    return <p className="text-on-surface-variant">Carregando…</p>;
  }

  return (
    <div>
      <h1 className="font-headline mb-6 text-2xl text-primary">
        Propostas recebidas
      </h1>
      {error && <p className="mb-4 text-error">{error}</p>}
      <ul className="space-y-4">
        {items.map((p) => (
          <li
            key={p.id}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
          >
            <p className="text-sm text-on-surface-variant">
              Status:{" "}
              <span className="font-bold text-primary">{p.status}</span>
            </p>
            <p className="mt-2 font-medium text-primary">
              Valor: R$ {Number(p.price).toFixed(2)}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-on-surface">
              {p.message}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.status === "PENDING" && (
                <>
                  <button
                    type="button"
                    onClick={() => accept(p.id)}
                    className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-on-secondary"
                  >
                    Aceitar
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(p.id)}
                    className="rounded-lg border border-error px-4 py-2 text-sm font-bold text-error"
                  >
                    Recusar
                  </button>
                </>
              )}
              {p.contractId && (
                <Link
                  href={`/app/contracts/${p.contractId}`}
                  className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-bold text-secondary"
                >
                  Ver contrato
                </Link>
              )}
              {p.status === "ACCEPTED" && (
                <Link
                  href={`/app/messages/open-proposal/${p.id}`}
                  className="rounded-lg bg-secondary px-4 py-2 text-sm font-bold text-on-secondary"
                >
                  Abrir conversa
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
      {items.length === 0 && (
        <p className="text-on-surface-variant">Nenhuma proposta ainda.</p>
      )}
    </div>
  );
}
