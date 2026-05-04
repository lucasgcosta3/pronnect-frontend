"use client";

import type { ProposalResponse } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

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
      toast.success("Proposta aceita!");
      await load();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error("Erro ao aceitar proposta.");
    }
  }

  async function reject(id: string) {
    try {
      await api(`/proposals/${id}/reject`, { method: "PATCH" });
      toast.success("Proposta recusada.");
      await load();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error("Erro ao recusar proposta.");
    }
  }

  if (role !== "PROFESSIONAL") {
    return (
      <p className="text-muted-foreground">
        Apenas profissionais recebem propostas aqui.
      </p>
    );
  }

  if (loading) {
    return <p className="text-muted-foreground">Carregando…</p>;
  }

  return (
    <div>
      <h1 className="font-headline mb-6 text-2xl text-primary dark:text-white">
        Propostas recebidas
      </h1>
      {error && <p className="mb-4 text-destructive">{error}</p>}
      <ul className="space-y-4">
        {items.map((p) => (
          <li
            key={p.id}
            className="rounded-xl border border-border bg-card p-4"
          >
            <p className="text-sm text-muted-foreground">
              Status:{" "}
              <span className="font-bold text-primary dark:text-white">{p.status}</span>
            </p>
            <p className="mt-2 font-medium text-primary dark:text-white">
              Valor: R$ {Number(p.price).toFixed(2)}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-foreground">
              {p.message}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {p.status === "PENDING" && (
                <>
                  <button
                    type="button"
                    onClick={() => accept(p.id)}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground"
                  >
                    Aceitar
                  </button>
                  <button
                    type="button"
                    onClick={() => reject(p.id)}
                    className="rounded-lg border border-destructive px-4 py-2 text-sm font-bold text-destructive"
                  >
                    Recusar
                  </button>
                </>
              )}
              {p.contractId && (
                <Link
                  href={`/app/contracts/${p.contractId}`}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-accent"
                >
                  Ver contrato
                </Link>
              )}
              {p.status === "ACCEPTED" && (
                <Link
                  href={`/app/messages/open-proposal/${p.id}`}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground"
                >
                  Abrir conversa
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
      {items.length === 0 && (
        <p className="text-muted-foreground">Nenhuma proposta ainda.</p>
      )}
    </div>
  );
}
