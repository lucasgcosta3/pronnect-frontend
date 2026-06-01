"use client";

import type {
  PaymentResponse,
  ServiceContractResponse,
  ProposalResponse,
  ProfessionalProfileResponse,
  CompanyProfileResponse,
  ReviewResponse,
} from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { PixPayment } from "@/components/PixPayment";
import { ReviewForm } from "@/components/ReviewForm";

export default function ContractDetailPage() {
  const params = useParams();
  const contractId = params.id as string;
  const role = getRoleFromToken();
  const router = useRouter();

  const [contract, setContract] = useState<ServiceContractResponse | null>(null);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentOptionsModal, setShowPaymentOptionsModal] = useState(false);
  const [counterpartyAccountId, setCounterpartyAccountId] = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const c = await api<ServiceContractResponse>(`/contracts/${contractId}`);
      setContract(c);
      // Try to load payment
      try {
        const p = await api<PaymentResponse>(`/payments/contract/${c.id}`);
        setPayment(p);
      } catch {
        setPayment(null);
      }
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Contrato não encontrado.");
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    load();
  }, [load]);

  // ─── Load counterparty accountId for reviews ───
  useEffect(() => {
    if (!contract || !role) return;
    (async () => {
      try {
        const proposal = await api<ProposalResponse>(`/proposals/${contract.proposalId}`);
        if (role === "COMPANY") {
          const prof = await api<ProfessionalProfileResponse>(
            `/professionals/${proposal.professionalId}`,
          );
          setCounterpartyAccountId(prof.accountId);
        } else {
          const comp = await api<CompanyProfileResponse>(`/companies/${proposal.companyId}`);
          setCounterpartyAccountId(comp.accountId);
        }
      } catch {
        setCounterpartyAccountId(null);
      }
    })();
  }, [contract, role]);

  // ─── Check if user already reviewed this contract ───
  useEffect(() => {
    if (contract?.status !== "VALIDATED" || !counterpartyAccountId) return;
    (async () => {
      try {
        const reviews = await api<ReviewResponse[]>(`/reviews/account/${counterpartyAccountId}`);
        const found = reviews.some((r) => r.serviceContractId === contract.id);
        setAlreadyReviewed(found);
      } catch {
        setAlreadyReviewed(false);
      }
    })();
  }, [contract, counterpartyAccountId]);

  async function markComplete() {
    setActionMsg(null);
    try {
      const c = await api<ServiceContractResponse>(`/contracts/${contractId}/complete`, {
        method: "PATCH",
      });
      setContract(c);
      setActionMsg("Serviço marcado como concluído.");
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    }
  }

  async function validate() {
    setActionMsg(null);
    try {
      const c = await api<ServiceContractResponse>(`/contracts/${contractId}/validate`, {
        method: "PATCH",
      });
      setContract(c);
      // Release payment
      try {
        const p = await api<PaymentResponse>(`/payments/contract/${contractId}/release`, {
          method: "PATCH",
        });
        setPayment(p);
      } catch {
        /* payment release may fail silently */
      }
      setActionMsg("Entrega aprovada e pagamento liberado!");
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    }
  }

  async function handlePayment() {
    setPaying(true);
    setError(null);
    setActionMsg(null);
    try {
      const p = await api<PaymentResponse>("/payments", {
        method: "POST",
        json: { serviceContractId: contractId },
      });
      setPayment(p);
      if (p.status === "PENDING") {
        setShowPaymentOptionsModal(true);
      } else {
        setActionMsg("Pagamento realizado e em escrow!");
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setPaying(false);
    }
  }

  function getStatusLabel(status: string) {
    const map: Record<string, { label: string; color: string; icon: string }> = {
      IN_PROGRESS: {
        label: "Em Andamento",
        color:
          "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
        icon: "engineering",
      },
      COMPLETED: {
        label: "Entrega Realizada",
        color:
          "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700",
        icon: "task_alt",
      },
      VALIDATED: {
        label: "Aprovado & Pago",
        color:
          "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
        icon: "verified",
      },
      CANCELLED: {
        label: "Cancelado",
        color:
          "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700",
        icon: "cancel",
      },
    };
    return (
      map[status] ?? {
        label: status,
        color: "bg-muted text-muted-foreground border-border",
        icon: "info",
      }
    );
  }

  function getPaymentStatusLabel(status: string) {
    const map: Record<string, { label: string; color: string }> = {
      PENDING: {
        label: "Aguardando PIX",
        color: "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
      },
      HELD: {
        label: "Em Escrow",
        color: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
      },
      RELEASED: {
        label: "Liberado",
        color: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
      },
      CANCELLED: {
        label: "Cancelado",
        color: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300",
      },
      REFUNDED: {
        label: "Reembolsado",
        color: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300",
      },
    };
    return map[status] ?? { label: status, color: "bg-muted text-muted-foreground" };
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <span className="material-symbols-outlined text-[48px] text-destructive/40 mb-3 block">
          error
        </span>
        <p className="text-destructive font-bold">{error || "Não encontrado."}</p>
        <Link href="/app" className="text-sm text-primary hover:underline mt-4 inline-block">
          Voltar ao painel
        </Link>
      </div>
    );
  }

  const statusInfo = getStatusLabel(contract.status);

  return (
    <div className="mx-auto max-w-2xl py-6 px-4">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Voltar
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-headline text-2xl font-bold text-primary dark:text-white">
            Contrato de Serviço
          </h1>
          <p className="mt-1 text-xs text-muted-foreground font-mono">{contract.proposalId}</p>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusInfo.color}`}
        >
          <span className="material-symbols-outlined text-[14px]">{statusInfo.icon}</span>
          {statusInfo.label}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <h2 className="text-sm font-bold text-foreground mb-3">Cronologia</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">play_circle</span>
            Início:{" "}
            <span className="text-foreground font-medium">
              {new Date(contract.startedAt).toLocaleString("pt-BR")}
            </span>
          </li>
          {contract.completedAt && (
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-amber-500">task_alt</span>
              Concluído:{" "}
              <span className="text-foreground font-medium">
                {new Date(contract.completedAt).toLocaleString("pt-BR")}
              </span>
            </li>
          )}
          {contract.validatedAt && (
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-emerald-500">
                verified
              </span>
              Validado:{" "}
              <span className="text-foreground font-medium">
                {new Date(contract.validatedAt).toLocaleString("pt-BR")}
              </span>
            </li>
          )}
        </ul>
      </div>

      {/* Payment info */}
      {payment && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground">Pagamento</h2>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${getPaymentStatusLabel(payment.status).color}`}
            >
              {getPaymentStatusLabel(payment.status).label}
            </span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Valor profissional</span>
              <span className="font-bold text-foreground">
                R$ {payment.professionalAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Taxa Pronnect</span>
              <span className="font-bold text-foreground">R$ {payment.platformFee.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-1.5 mt-1.5 flex justify-between font-bold text-foreground">
              <span>Total</span>
              <span className="text-primary">R$ {payment.amount.toFixed(2)}</span>
            </div>
          </div>

          {/* Show PIX button if PENDING */}
          {role === "COMPANY" && payment.status === "PENDING" && (
            <button
              onClick={() => setShowPaymentOptionsModal(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
              Pagar (Escolher método)
            </button>
          )}
        </div>
      )}

      {/* Feedback messages */}
      {actionMsg && (
        <div className="mb-6 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {actionMsg}
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="space-y-4 mb-8">
        {/* Company: Create payment (when IN_PROGRESS and no payment exists) */}
        {role === "COMPANY" && contract.status === "IN_PROGRESS" && !payment && (
          <button
            type="button"
            onClick={handlePayment}
            disabled={paying}
            className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold py-3 rounded-xl text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">account_balance</span>
            {paying ? "Processando..." : "Realizar Pagamento (Escrow)"}
          </button>
        )}

        {/* Professional: Mark complete */}
        {role === "PROFESSIONAL" &&
          contract.status === "IN_PROGRESS" &&
          payment?.status === "HELD" && (
            <button
              type="button"
              onClick={markComplete}
              className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold py-3 rounded-xl text-sm hover:bg-accent/90 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">task_alt</span>
              Marcar como Concluído
            </button>
          )}

        {/* Company: Validate & release (when COMPLETED) */}
        {role === "COMPANY" && contract.status === "COMPLETED" && (
          <button
            type="button"
            onClick={validate}
            className="w-full flex items-center justify-center gap-2 bg-accent text-accent-foreground font-bold py-3 rounded-xl text-sm hover:bg-accent/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">verified</span>
            Aprovar Entrega e Liberar Pagamento
          </button>
        )}

        {/* Waiting states */}
        {role === "COMPANY" && contract.status === "IN_PROGRESS" && payment?.status === "HELD" && (
          <div className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold py-3 rounded-xl text-sm border border-amber-200 dark:border-amber-700">
            <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
            Aguardando entrega do profissional
          </div>
        )}
        {role === "PROFESSIONAL" &&
          contract.status === "IN_PROGRESS" &&
          (!payment || payment.status === "PENDING") && (
            <div className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold py-3 rounded-xl text-sm border border-amber-200 dark:border-amber-700">
              <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
              Aguardando pagamento da empresa
            </div>
          )}
        {role === "PROFESSIONAL" && contract.status === "COMPLETED" && (
          <div className="flex items-center justify-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-bold py-3 rounded-xl text-sm border border-amber-200 dark:border-amber-700">
            <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
            Aguardando aprovação da empresa
          </div>
        )}

        {/* Done state */}
        {contract.status === "VALIDATED" && (
          <div className="flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold py-3 rounded-xl text-sm border border-emerald-200 dark:border-emerald-700">
            <span className="material-symbols-outlined text-[18px]">celebration</span>
            Projeto Finalizado com Sucesso!
          </div>
        )}
      </div>

      {/* Review form when contract is VALIDATED */}
      {contract.status === "VALIDATED" && counterpartyAccountId && !alreadyReviewed && (
        <div className="mb-8">
          <ReviewForm
            reviewedAccountId={counterpartyAccountId}
            serviceContractId={contract.id}
            onSuccess={() => setAlreadyReviewed(true)}
          />
        </div>
      )}
      {contract.status === "VALIDATED" && alreadyReviewed && (
        <div className="mb-8 flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold py-3 rounded-xl text-sm border border-emerald-200 dark:border-emerald-700">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Você já avaliou este contrato.
        </div>
      )}

      <p className="mt-6 text-center">
        <Link href="/app" className="text-sm text-primary hover:underline">
          Voltar ao Painel
        </Link>
      </p>

      {/* ═══════════ PIX PAYMENT MODAL ═══════════ */}
      {/* ═══════════ PAYMENT OPTIONS MODAL ═══════════ */}
      {showPaymentOptionsModal && payment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
          onClick={() => setShowPaymentOptionsModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-card rounded-3xl border border-border p-8 shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowPaymentOptionsModal(false)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-destructive hover:scale-105 active:scale-95 transition-all"
              aria-label="Fechar"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>

            {/* Header */}
            <div className="mb-6">
              <h3 className="font-headline text-xl font-bold text-primary dark:text-white">
                Método de Pagamento
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Escolha como deseja realizar o pagamento de segurança (escrow).
              </p>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {/* PIX (Recommended) */}
              <button
                className="w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-300 hover:-translate-y-0.5 border-primary/30 bg-primary/[0.02] hover:bg-primary/[0.05] shadow-sm shadow-primary/5 group"
                onClick={() => {
                  setShowPaymentOptionsModal(false);
                  setShowPaymentModal(true);
                }}
              >
                {/* Logo PIX */}
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-primary/20 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                  <svg className="w-7 h-7" viewBox="0 0 48 48" fill="none">
                    <path d="M30.27 36.27l-5.34-5.34a1.33 1.33 0 0 0-1.86 0l-5.34 5.34a3.98 3.98 0 0 1-2.81 1.16h-1.2l6.75 6.75a4.64 4.64 0 0 0 6.56 0l6.82-6.75h-1.33a3.98 3.98 0 0 1-2.81-1.16h-.44Z" fill="#32BCAD"/>
                    <path d="M17.72 11.73l5.34 5.34a1.33 1.33 0 0 0 1.86 0l5.34-5.34a3.98 3.98 0 0 1 2.81-1.16h1.33l-6.82-6.75a4.64 4.64 0 0 0-6.56 0l-6.75 6.75h1.2a3.98 3.98 0 0 1 2.81 1.16h-.46Z" fill="#32BCAD"/>
                    <path d="M40.18 17.72l-4.18-4.18a.44.44 0 0 1-.15.03h-2.78a2.65 2.65 0 0 0-1.87.78l-5.34 5.34a2.66 2.66 0 0 1-3.72 0l-5.34-5.34a2.65 2.65 0 0 0-1.87-.78h-2.93a.44.44 0 0 1-.15-.03l-4.18 4.18a4.64 4.64 0 0 0 0 6.56l4.18 4.18a.44.44 0 0 1 .15-.03h2.93a2.65 2.65 0 0 0 1.87-.78l5.34-5.34a2.76 2.76 0 0 1 3.72 0l5.34 5.34a2.65 2.65 0 0 0 1.87.78h2.78a.44.44 0 0 1 .15.03l4.18-4.18a4.64 4.64 0 0 0 0-6.56Z" fill="#32BCAD"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-foreground">PIX</span>
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] uppercase font-black px-1.5 py-0.5 rounded">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    Geração instantânea e liberação imediata.
                  </p>
                </div>
                <span className="material-symbols-outlined text-muted-foreground/60 text-[20px] transition-transform group-hover:translate-x-0.5">
                  chevron_right
                </span>
              </button>

              {/* Cartão de Crédito */}
              <button
                className="w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-300 hover:-translate-y-0.5 border-border hover:border-primary/20 hover:bg-muted/50 group"
                onClick={() => {
                  toast.info("Pagamento via Cartão de Crédito é uma simulação (apenas PIX disponível).");
                }}
              >
                {/* Logo Cartão */}
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-border flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="4" width="20" height="16" rx="3" stroke="#6366f1" strokeWidth="1.8"/>
                    <rect x="2" y="8" width="20" height="3" fill="#6366f1" opacity="0.9"/>
                    <rect x="5" y="14" width="4" height="2.5" rx="0.5" fill="#6366f1" opacity="0.4"/>
                    <rect x="11" y="14" width="3" height="2.5" rx="0.5" fill="#6366f1" opacity="0.25"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-foreground">Cartão de Crédito</span>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    Pague em até 12x com taxas de parcelamento.
                  </p>
                </div>
                <span className="material-symbols-outlined text-muted-foreground/60 text-[20px] transition-transform group-hover:translate-x-0.5">
                  chevron_right
                </span>
              </button>

              {/* PayPal */}
              <button
                className="w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-300 hover:-translate-y-0.5 border-border hover:border-primary/20 hover:bg-muted/50 group"
                onClick={() => {
                  toast.info("Pagamento via PayPal é uma simulação (apenas PIX disponível).");
                }}
              >
                {/* Logo PayPal */}
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-border flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.649h6.392c2.118 0 3.768.506 4.748 1.602.46.514.765 1.107.934 1.767.177.692.204 1.522.063 2.534l-.013.087v.755l.588.332c.496.266.892.572 1.192.923.496.582.756 1.32.825 2.195.071.896-.055 1.962-.373 3.167-.365 1.38-.96 2.582-1.766 3.558-.745.901-1.658 1.614-2.712 2.12-.999.478-2.144.72-3.404.72h-.808a.963.963 0 0 0-.953.814l-.049.26-.774 4.888-.04.207H7.076Z" fill="#003087"/>
                    <path d="M19.443 8.07c-.013.086-.027.173-.044.264-.575 2.944-2.547 3.964-5.061 3.964h-1.28a.622.622 0 0 0-.615.527l-.655 4.147-.186 1.178a.327.327 0 0 0 .324.38h2.274a.547.547 0 0 0 .54-.462l.022-.114.428-2.71.028-.15a.547.547 0 0 1 .54-.462h.34c2.2 0 3.922-.893 4.427-3.476.211-.1079.324-2.069.148-2.73a2.339 2.339 0 0 0-.93-1.357Z" fill="#009cde"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-foreground">PayPal</span>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    Pagamento seguro com saldo ou cartão internacional.
                  </p>
                </div>
                <span className="material-symbols-outlined text-muted-foreground/60 text-[20px] transition-transform group-hover:translate-x-0.5">
                  chevron_right
                </span>
              </button>

              {/* Mercado Pago */}
              <button
                className="w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-300 hover:-translate-y-0.5 border-border hover:border-primary/20 hover:bg-muted/50 group"
                onClick={() => {
                  toast.info("Pagamento via Mercado Pago é uma simulação (apenas PIX disponível).");
                }}
              >
                {/* Logo Mercado Pago */}
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-border flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#009EE3" opacity="0.12"/>
                    <path d="M12 5C8.134 5 5 8.134 5 12s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7Z" stroke="#009EE3" strokeWidth="1.5" fill="none"/>
                    <path d="M8.5 13.5c0-1.933 1.567-3.5 3.5-3.5s3.5 1.567 3.5 3.5" stroke="#009EE3" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                    <circle cx="10" cy="11" r="0.75" fill="#009EE3"/>
                    <circle cx="14" cy="11" r="0.75" fill="#009EE3"/>
                    <path d="M9.5 7.5C10.2 6.5 11 6 12 6s1.8.5 2.5 1.5" stroke="#009EE3" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-foreground">Mercado Pago</span>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    Carteira virtual, boleto ou Pix integrado.
                  </p>
                </div>
                <span className="material-symbols-outlined text-muted-foreground/60 text-[20px] transition-transform group-hover:translate-x-0.5">
                  chevron_right
                </span>
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-5 leading-normal bg-muted/40 p-2.5 rounded-xl border border-border/40">
              * Para fins de demonstração, a aprovação do PIX é simulada automaticamente em até 5 segundos após a geração do QR Code.
            </p>
          </div>
        </div>
      )}
      {showPaymentModal && payment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="relative w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-lg"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
            <PixPayment
              payment={payment}
              onPaymentApproved={(updatedPayment) => {
                setPayment(updatedPayment);
                setShowPaymentModal(false);
                toast.success("Pagamento confirmado! O valor está em escrow.");
                load();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
