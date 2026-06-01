"use client";

import type { ConversationResponse } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OpenProposalConversationPage() {
  const params = useParams();
  const proposalId = params.proposalId as string;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const c = await api<ConversationResponse>(`/conversations/proposal/${proposalId}`);
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("pronnect-active-conversation-id", c.id);
        }
        router.replace("/app/messages");
      } catch (e) {
        if (e instanceof ApiError) setError(e.message);
        else setError("Não foi possível abrir a conversa.");
      }
    })();
  }, [proposalId, router]);

  if (error) {
    return <p className="text-error">{error}</p>;
  }

  return <p className="text-on-surface-variant">Abrindo conversa…</p>;
}
