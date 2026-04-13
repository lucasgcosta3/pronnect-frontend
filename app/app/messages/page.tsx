"use client";

import type { ConversationResponse } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function ConversationsListPage() {
  const [items, setItems] = useState<ConversationResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api<ConversationResponse[]>("/conversations/me");
      setItems(list);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Erro ao carregar conversas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <p className="text-on-surface-variant">Carregando…</p>;
  }

  return (
    <div>
      <h1 className="font-headline mb-6 text-2xl text-primary">Mensagens</h1>
      {error && <p className="mb-4 text-error">{error}</p>}
      <ul className="space-y-3">
        {items.map((c) => (
          <li key={c.id}>
            <Link
              href={`/app/messages/${c.id}`}
              className="block rounded-xl border border-outline-variant bg-surface-container-lowest p-4 transition-colors hover:bg-surface-container"
            >
              <p className="font-bold text-primary">{c.otherPartyName}</p>
              <p className="text-sm text-on-surface-variant">
                Proposta: R$ {Number(c.proposalPrice).toFixed(2)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {items.length === 0 && (
        <p className="text-on-surface-variant">
          Nenhuma conversa. Aceite uma proposta para abrir o chat.
        </p>
      )}
    </div>
  );
}
