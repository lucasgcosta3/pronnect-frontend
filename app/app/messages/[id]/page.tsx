"use client";

import type { MessageResponse, SpringPage } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { decodeJwtPayload, getToken } from "@/lib/auth";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

export default function ConversationThreadPage() {
  const params = useParams();
  const conversationId = params.id as string;
  const router = useRouter();

  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const myAccountId = (() => {
    const t = getToken();
    if (!t) return null;
    return decodeJwtPayload(t)?.accountId ?? null;
  })();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<SpringPage<MessageResponse>>(
        `/conversations/${conversationId}/messages?page=0&size=200&sort=createdAt,asc`
      );
      setMessages(res.content);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Erro ao carregar mensagens.");
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api<MessageResponse>(`/conversations/${conversationId}/messages`, {
        method: "POST",
        json: { content: content.trim() },
      });
      setContent("");
      await load();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex max-h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => router.push("/app/messages")}
          className="text-sm text-secondary hover:underline"
        >
          Todas as conversas
        </button>
      </div>
      <h1 className="font-headline mb-4 text-xl text-primary">Conversa</h1>
      {error && <p className="mb-2 text-sm text-error">{error}</p>}

      <div className="mb-4 flex max-h-[50vh] flex-col gap-2 overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest p-4 sm:max-h-[60vh]">
        {loading && messages.length === 0 && (
          <p className="text-on-surface-variant">Carregando…</p>
        )}
        {messages.map((m) => {
          const mine =
            !!myAccountId && String(m.senderId) === String(myAccountId);
          return (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                mine
                  ? "ml-auto bg-secondary text-on-secondary"
                  : "bg-surface-container text-on-surface"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
              <p className="mt-1 text-[10px] opacity-70">
                {new Date(m.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          placeholder="Sua mensagem"
          className="flex-1 rounded-lg border border-outline-variant px-3 py-2"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-xl bg-primary px-4 py-2 font-bold text-on-primary disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
      <p className="mt-4 text-center">
        <Link href="/app" className="text-sm text-secondary hover:underline">
          Painel
        </Link>
      </p>
    </div>
  );
}
