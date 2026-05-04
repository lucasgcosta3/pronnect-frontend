"use client";

import type { ConversationResponse, MessageResponse, ServiceContractResponse, PaymentResponse, SpringPage } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { decodeJwtPayload, getToken, getRoleFromToken } from "@/lib/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Contract status step mapping ───
const CONTRACT_STEPS = [
  { key: "IN_PROGRESS", label: "Proposta Aceita", icon: "handshake" },
  { key: "PAYMENT_HELD", label: "Pagamento em Escrow", icon: "account_balance" },
  { key: "COMPLETED", label: "Entrega Realizada", icon: "task_alt" },
  { key: "VALIDATED", label: "Aprovado & Pago", icon: "verified" },
];

function getStepIndex(contractStatus: string, paymentStatus: string | null): number {
  if (contractStatus === "VALIDATED") return 3;
  if (contractStatus === "COMPLETED") return 2;
  if (paymentStatus === "HELD") return 1;
  return 0;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [content, setContent] = useState("");
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showContractPanel, setShowContractPanel] = useState(false);

  // Contract state
  const [contract, setContract] = useState<ServiceContractResponse | null>(null);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [role, setRole] = useState<string | null>(null);
  const [myAccountId, setMyAccountId] = useState<string | null>(null);

  useEffect(() => {
    setRole(getRoleFromToken());
    const t = getToken();
    if (t) setMyAccountId(decodeJwtPayload(t)?.accountId ?? null);
  }, []);

  // ─── Load conversations ───
  const loadConversations = useCallback(async () => {
    try {
      const list = await api<ConversationResponse[]>("/conversations/me");
      setConversations(list);
    } catch {
      setConversations([]);
    } finally {
      setLoadingConvos(false);
    }
  }, []);

  // ─── Load messages ───
  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const res = await api<SpringPage<MessageResponse>>(
        `/conversations/${convId}/messages?page=0&size=200&sort=createdAt,asc`
      );
      setMessages(res.content);
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // ─── Load contract for active conversation ───
  const loadContract = useCallback(async (proposalId: string) => {
    // Loading contract
    try {
      const c = await api<ServiceContractResponse>(`/contracts/proposal/${proposalId}`);
      setContract(c);
      // Try to load payment
      try {
        const p = await api<PaymentResponse>(`/payments/contract/${c.id}`);
        setPayment(p);
      } catch {
        setPayment(null);
      }
    } catch {
      setContract(null);
      setPayment(null);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!activeId) { setMessages([]); setContract(null); setPayment(null); return; }
    loadMessages(activeId);
    const conv = conversations.find((c) => c.id === activeId);
    if (conv) loadContract(conv.proposalId);

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => { loadMessages(activeId); }, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeId, loadMessages, loadContract, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Actions ───
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !activeId) return;
    setSending(true);
    try {
      await api<MessageResponse>(`/conversations/${activeId}/messages`, { method: "POST", json: { content: content.trim() } });
      setContent("");
      await loadMessages(activeId);
    } catch (err) { if (err instanceof ApiError) toast.error(err.message); }
    finally { setSending(false); }
  }

  async function deleteConversation(convId: string) {
    try {
      await api(`/conversations/${convId}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (activeId === convId) { setActiveId(null); setMessages([]); }
      setDeleteConfirmId(null);
      toast.success("Conversa excluída.");
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Não foi possível excluir a conversa.");
    }
  }

  async function handlePayment() {
    if (!contract) return;
    setActionLoading(true);
    try {
      const p = await api<PaymentResponse>("/payments", { method: "POST", json: { serviceContractId: contract.id } });
      setPayment(p);
      toast.success("Pagamento realizado e em escrow!");
    } catch (err) { if (err instanceof ApiError) toast.error(err.message); }
    finally { setActionLoading(false); }
  }

  async function handleComplete() {
    if (!contract) return;
    setActionLoading(true);
    try {
      const c = await api<ServiceContractResponse>(`/contracts/${contract.id}/complete`, { method: "PATCH" });
      setContract(c);
      toast.success("Serviço marcado como concluído!");
    } catch (err) { if (err instanceof ApiError) toast.error(err.message); }
    finally { setActionLoading(false); }
  }

  async function handleValidateAndRelease() {
    if (!contract) return;
    setActionLoading(true);
    try {
      const c = await api<ServiceContractResponse>(`/contracts/${contract.id}/validate`, { method: "PATCH" });
      setContract(c);
      // Release payment
      try {
        const p = await api<PaymentResponse>(`/payments/contract/${contract.id}/release`, { method: "PATCH" });
        setPayment(p);
      } catch { /* payment release may fail silently if no payment */ }
      toast.success("Entrega aprovada e pagamento liberado!");
    } catch (err) { if (err instanceof ApiError) toast.error(err.message); }
    finally { setActionLoading(false); }
  }

  const activeConversation = conversations.find((c) => c.id === activeId);
  const filteredConversations = searchQuery.trim()
    ? conversations.filter((c) => c.otherPartyName.toLowerCase().includes(searchQuery.toLowerCase()))
    : conversations;

  const currentStep = contract ? getStepIndex(contract.status, payment?.status ?? null) : 0;

  // ─── Helpers ───
  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Hoje";
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Ontem";
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }
  function getInitials(name: string) {
    return name.split(" ").slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join("");
  }
  function isMine(senderId: string) {
    return !!myAccountId && String(senderId) === String(myAccountId);
  }

  return (
    <div className="flex h-[calc(100vh-4.5rem)] overflow-hidden">
      {/* ═══════════ LEFT PANEL ═══════════ */}
      <div className="flex w-full max-w-[360px] flex-col border-r border-border bg-card">
        <div className="flex h-16 items-center justify-between border-b border-border px-5 shrink-0">
          <h1 className="font-headline text-lg font-bold text-primary dark:text-white">Mensagens</h1>
          <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{conversations.length}</span>
        </div>
        <div className="px-3 py-3 shrink-0">
          <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5">
            <span className="material-symbols-outlined text-[20px] text-muted-foreground/50">search</span>
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar conversa..." className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingConvos ? (
            <div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary border-t-transparent" /></div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="material-symbols-outlined text-[40px] text-muted-foreground/25 mb-2">forum</span>
              <p className="text-sm text-muted-foreground">{searchQuery ? "Nenhuma conversa encontrada." : "Nenhuma conversa ainda."}</p>
              {!searchQuery && <p className="text-xs text-muted-foreground/60 mt-1">Aceite uma proposta para iniciar um chat.</p>}
            </div>
          ) : (
            filteredConversations.map((c) => (
              <div key={c.id} className={`relative flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors group ${activeId === c.id ? "bg-primary/5 border-l-[3px] border-primary" : "hover:bg-muted/50 border-l-[3px] border-transparent"}`}
                onClick={() => { setActiveId(c.id); setDeleteConfirmId(null); setShowContractPanel(false); }}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">{getInitials(c.otherPartyName)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-primary dark:text-white truncate">{c.otherPartyName}</p>
                    <span className="text-[10px] text-muted-foreground/60 shrink-0 ml-2">{formatDate(c.createdAt)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">Proposta: R$ {Number(c.proposalPrice).toFixed(2)}</p>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(deleteConfirmId === c.id ? null : c.id); }}
                  className="shrink-0 p-1 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 transition-colors opacity-0 group-hover:opacity-100" title="Excluir conversa">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
                {deleteConfirmId === c.id && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 bg-card border border-destructive/20 rounded-xl px-3 py-2 shadow-lg" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-destructive font-medium whitespace-nowrap">Excluir?</span>
                    <button onClick={() => deleteConversation(c.id)} className="text-[11px] font-bold text-white bg-destructive rounded-lg px-2.5 py-1 hover:bg-destructive/90 transition-colors">Sim</button>
                    <button onClick={() => setDeleteConfirmId(null)} className="text-[11px] font-bold text-muted-foreground bg-muted rounded-lg px-2.5 py-1 hover:bg-muted/80 transition-colors">Não</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═══════════ RIGHT PANEL ═══════════ */}
      <div className="flex flex-1 flex-col bg-muted/30 dark:bg-background">
        {!activeId ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-8 bg-muted/50 dark:bg-background">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-[40px] text-primary/40">chat</span>
            </div>
            <h2 className="font-headline text-xl font-bold text-primary dark:text-white mb-2">Pronnect Chat</h2>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">Selecione uma conversa ao lado para visualizar e enviar mensagens.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-border px-6 h-16 shrink-0 bg-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {activeConversation ? getInitials(activeConversation.otherPartyName) : "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary dark:text-white truncate">{activeConversation?.otherPartyName || "Conversa"}</p>
                <p className="text-[11px] text-muted-foreground/70">
                  Proposta: R$ {activeConversation ? Number(activeConversation.proposalPrice).toFixed(2) : "—"}
                </p>
              </div>
              {/* Contract panel toggle */}
              <button
                onClick={() => setShowContractPanel(!showContractPanel)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${showContractPanel ? "bg-primary text-primary-foreground" : "bg-muted text-primary hover:bg-muted/80"}`}
              >
                <span className="material-symbols-outlined text-[16px]">assignment</span>
                Contrato
              </button>
            </div>

            {/* ─── Contract Status Panel (collapsible) ─── */}
            {showContractPanel && contract && (
              <div className="bg-card border-b border-border px-6 py-5 shrink-0 content-fade-in">
                {/* Progress stepper */}
                <div className="flex items-center justify-between mb-5">
                  {CONTRACT_STEPS.map((step, i) => (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center text-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm mb-1.5 transition-colors ${
                          i <= currentStep ? "bg-accent text-accent-foreground shadow-sm" : "bg-muted text-muted-foreground/40"
                        }`}>
                          <span className="material-symbols-outlined text-[20px]">{i < currentStep ? "check" : step.icon}</span>
                        </div>
                        <span className={`text-[10px] font-bold leading-tight max-w-[80px] ${i <= currentStep ? "text-accent" : "text-muted-foreground/40"}`}>
                          {step.label}
                        </span>
                      </div>
                      {i < CONTRACT_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 mt-[-18px] rounded-full ${i < currentStep ? "bg-accent" : "bg-muted"}`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Financial summary */}
                <div className="bg-muted/50 rounded-xl p-4 border border-border mb-4">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Valor do profissional</span>
                    <span className="font-bold text-foreground">R$ {activeConversation ? Number(activeConversation.proposalPrice).toFixed(2) : "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Taxa Pronnect (10%)</span>
                    <span className="font-bold text-foreground">R$ {activeConversation ? (Number(activeConversation.proposalPrice) * 0.10).toFixed(2) : "—"}</span>
                  </div>
                  <div className="border-t border-border pt-1 mt-1 flex justify-between text-xs font-bold text-foreground">
                    <span>Total</span>
                    <span className="text-accent">R$ {activeConversation ? (Number(activeConversation.proposalPrice) * 1.10).toFixed(2) : "—"}</span>
                  </div>
                  {payment && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${payment.status === "RELEASED" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"}`}>
                        <span className="material-symbols-outlined text-[12px]">{payment.status === "RELEASED" ? "check_circle" : "schedule"}</span>
                        {payment.status === "HELD" ? "Em Escrow" : "Liberado"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action buttons based on role and status */}
                <div className="flex gap-2">
                  {/* Company: Pay (when IN_PROGRESS and no payment) */}
                  {role === "COMPANY" && contract.status === "IN_PROGRESS" && !payment && (
                    <button onClick={handlePayment} disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold py-3 rounded-xl text-sm hover:bg-accent/90 transition-colors disabled:opacity-50">
                      <span className="material-symbols-outlined text-[18px]">account_balance</span>
                      {actionLoading ? "Processando..." : "Realizar Pagamento (Escrow)"}
                    </button>
                  )}

                  {/* Professional: Mark complete (when IN_PROGRESS and payment HELD) */}
                  {role === "PROFESSIONAL" && contract.status === "IN_PROGRESS" && payment?.status === "HELD" && (
                    <button onClick={handleComplete} disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold py-3 rounded-xl text-sm hover:bg-accent/90 transition-colors disabled:opacity-50">
                      <span className="material-symbols-outlined text-[18px]">task_alt</span>
                      {actionLoading ? "Processando..." : "Marcar como Concluído"}
                    </button>
                  )}

                  {/* Company: Validate & release (when COMPLETED) */}
                  {role === "COMPANY" && contract.status === "COMPLETED" && (
                    <button onClick={handleValidateAndRelease} disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold py-3 rounded-xl text-sm hover:bg-accent/90 transition-colors disabled:opacity-50">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      {actionLoading ? "Processando..." : "Aprovar Entrega e Liberar Pagamento"}
                    </button>
                  )}

                  {/* Done state */}
                  {contract.status === "VALIDATED" && (
                    <div className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold py-3 rounded-xl text-sm border border-emerald-200 dark:border-emerald-700">
                      <span className="material-symbols-outlined text-[18px]">celebration</span>
                      Projeto Finalizado com Sucesso!
                    </div>
                  )}

                  {/* Waiting states */}
                  {role === "COMPANY" && contract.status === "IN_PROGRESS" && payment?.status === "HELD" && (
                    <div className="flex-1 flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold py-3 rounded-xl text-sm border border-amber-200 dark:border-amber-700">
                      <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                      Aguardando entrega do profissional
                    </div>
                  )}
                  {role === "PROFESSIONAL" && contract.status === "IN_PROGRESS" && !payment && (
                    <div className="flex-1 flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold py-3 rounded-xl text-sm border border-amber-200 dark:border-amber-700">
                      <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                      Aguardando pagamento da empresa
                    </div>
                  )}
                  {role === "PROFESSIONAL" && contract.status === "COMPLETED" && (
                    <div className="flex-1 flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold py-3 rounded-xl text-sm border border-amber-200 dark:border-amber-700">
                      <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                      Aguardando aprovação da empresa
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {loadingMessages && messages.length === 0 ? (
                <div className="flex items-center justify-center py-16"><div className="h-6 w-6 animate-spin rounded-full border-[3px] border-primary border-t-transparent" /></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <span className="material-symbols-outlined text-[36px] text-muted-foreground/20 mb-2">chat_bubble_outline</span>
                  <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda. Comece a conversa!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {messages.map((m) => {
                    const mine = isMine(m.senderId);
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`relative max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${mine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card text-foreground border border-border rounded-bl-md"}`}>
                          <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                          <p className={`mt-1 text-[10px] text-right ${mine ? "text-primary-foreground/60" : "text-muted-foreground/50"}`}>{formatTime(m.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input area */}
            <form onSubmit={send} className="flex items-end gap-3 border-t border-border px-5 py-3 bg-card shrink-0">
              <div className="flex-1 flex items-center rounded-2xl bg-muted px-4 py-3">
                <input value={content} onChange={(e) => setContent(e.target.value)} maxLength={2000} placeholder="Digite uma mensagem..."
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }} />
              </div>
              <button type="submit" disabled={sending || !content.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40">
                <span className="material-symbols-outlined text-[22px]">send</span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
