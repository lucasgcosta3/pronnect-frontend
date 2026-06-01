"use client";

import type {
  ProfessionalProfileResponse,
  ProposalResponse,
  ProfileSummaryResponse,
  ConversationResponse,
  ServiceContractResponse,
} from "@/lib/types";
import { ApiError, api, resolveBackendUrl } from "@/lib/api";
import { getAccountIdFromToken, getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ReviewSection } from "@/components/ReviewSection";
import { ZoomableAvatar } from "@/components/ZoomableAvatar";

export default function ProfessionalDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const role = getRoleFromToken();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfessionalProfileResponse | null>(null);
  const [profileSummary, setProfileSummary] = useState<ProfileSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [recentActivities, setRecentActivities] = useState<
    { id: string; otherPartyName: string; status: string; price: number; date: string }[]
  >([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);

  // Proposal State
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCurrentAccountId(getAccountIdFromToken());
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

  useEffect(() => {
    if (!profile?.accountId) {
      setProfileSummary(null);
      return;
    }

    setSummaryLoading(true);
    api<ProfileSummaryResponse>(`/contracts/account/${profile.accountId}/summary`)
      .then(setProfileSummary)
      .catch(() => setProfileSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [profile]);

  useEffect(() => {
    if (!profile?.accountId) {
      setRecentActivities([]);
      setActivitiesLoading(false);
      return;
    }

    const loadActivities = async () => {
      setActivitiesLoading(true);
      try {
        const contracts = await api<ServiceContractResponse[]>(
          `/contracts/account/${profile.accountId}`,
        );

        let conversations: ConversationResponse[] = [];
        try {
          conversations = await api<ConversationResponse[]>(
            `/conversations/account/${profile.accountId}`,
          );
        } catch {
          try {
            conversations = await api<ConversationResponse[]>(`/conversations/professional/${id}`);
          } catch {
            conversations = [];
          }
        }

        const conversationsByProposal = new Map(
          conversations.map((conversation) => [conversation.proposalId, conversation]),
        );

        const activities = contracts
          .filter((contract) => contract.status !== "CANCELLED")
          .map((contract) => {
            const conversation = conversationsByProposal.get(contract.proposalId);
            return {
              id: contract.id,
              otherPartyName: conversation?.otherPartyName || "Cliente",
              status: contract.status,
              price: conversation?.proposalPrice ?? 0,
              date: contract.completedAt || contract.validatedAt || contract.startedAt || "",
            };
          })
          .filter((item) => item.date)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 4);

        setRecentActivities(activities);
      } catch {
        setRecentActivities([]);
      } finally {
        setActivitiesLoading(false);
      }
    };

    loadActivities();
  }, [profile, id]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showProposalForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showProposalForm]);

  async function sendProposal(e: FormEvent) {
    e.preventDefault();
    if (role !== "COMPANY") return;

    // Block proposals for example/invalid profiles
    if (!profile) {
      toast.error("Perfil inválido.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api<ProposalResponse>("/proposals", {
        method: "POST",
        json: {
          professionalId: id,
          message,
          price: Number(price),
        },
      });
      toast.success(`Proposta enviada com sucesso! (ID: ${res.id})`);
      setMessage("");
      setPrice("");
      setShowProposalForm(false);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Falha ao enviar proposta.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <svg
          className="animate-spin h-10 w-10 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center">
        <p className="text-lg font-medium text-destructive mb-4">{error || "Não encontrado."}</p>
        <button onClick={() => router.back()} className="text-accent hover:underline">
          Voltar
        </button>
      </div>
    );
  }

  const profileName = profile.name || profile.headline || "Profissional";
  const avatarInitial = profileName.charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-6xl pb-20 pt-8 px-4">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar (1/3) */}
        <aside className="w-full lg:w-1/3 flex flex-col gap-6">
          {/* Profile Card */}
          <div className="bg-card rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
            <ZoomableAvatar
              src={profile.avatarUrl ? resolveBackendUrl(profile.avatarUrl) : null}
              alt={profileName}
              fallbackText={avatarInitial}
              className="w-36 h-36 mb-4"
              fallbackClassName="text-5xl"
            />
            <h1 className="font-headline text-2xl text-primary dark:text-white font-bold capitalize">
              {profileName}
            </h1>
            <h2 className="text-[15px] text-muted-foreground dark:text-gray-300 font-medium mt-1">
              {profile.headline}
            </h2>

            {profile.profileCompleted && (
              <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold px-3 py-1.5 rounded-full mt-3 flex items-center gap-1.5 shadow-sm border border-emerald-200 dark:border-emerald-700">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>{" "}
                Disponível para Trabalho
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full mt-6 flex flex-col gap-3">
              {role === "COMPANY" ? (
                <button
                  onClick={() => setShowProposalForm(true)}
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  <span className="material-symbols-outlined text-[18px]">work</span> Contrate-me
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-muted opacity-50 text-muted-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  Contrate-me <span className="text-[10px] uppercase ml-1">(Apenas Empresas)</span>
                </button>
              )}
              <Link
                href="/app/messages"
                className="w-full bg-card border border-border hover:bg-muted text-primary font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span> Mensagem
              </Link>
            </div>
          </div>

          {/* About */}
          <div className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border text-left dark:shadow-none">
            <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-3">
              Sobre
            </h3>
            {profile.description ? (
              <p className="text-sm text-muted-foreground dark:text-gray-300 leading-relaxed">
                {profile.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">
                Nenhuma descrição disponível.
              </p>
            )}
          </div>

          {/* Contact */}
          <div className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border text-left dark:shadow-none">
            <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-4">
              Contato
            </h3>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px] text-muted-foreground/80 dark:text-gray-400">
                  mail
                </span>
                {profile.contactEmail || (
                  <span className="italic text-muted-foreground/50">Não informado</span>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border text-left lg:mb-0 dark:shadow-none">
            <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-4">
              Habilidades
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-primary/10 text-primary dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/15"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">
                  Nenhuma habilidade listada.
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Right Area (2/3) */}
        <div className="w-full lg:w-2/3 flex flex-col gap-4">
          {/* Info notice if profile not completed */}
          {!profile.profileCompleted && (
            <div className="bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 rounded-3xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <span className="material-symbols-outlined text-[22px]">info</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary dark:text-white mb-1">
                  Perfil incompleto
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Este profissional ainda não completou seu perfil. Algumas informações podem estar
                  indisponíveis.
                </p>
              </div>
            </div>
          )}

          {/* Ongoing project + escrow summary – visible only to the profile owner */}
          {currentAccountId && currentAccountId === profile.accountId && profileSummary && (
            <div className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-4">
                Resumo do Projeto
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Projetos ativos</p>
                  <p className="text-xl font-bold text-foreground">
                    {profileSummary.activeContracts}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Saldo em carteira</p>
                  <p className="text-xl font-bold text-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(profileSummary.escrowBalance)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Atividade Recente */}
          <div className="bg-card rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
            <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-6">
              Atividade Recente
            </h3>
            {activitiesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const statusLabel =
                    activity.status === "VALIDATED" ? "Concluído"
                    : activity.status === "COMPLETED" ? "Aguardando Validação"
                    : "Em andamento";
                  return (
                    <div key={activity.id} className="rounded-2xl bg-muted p-4 border border-border">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{activity.otherPartyName}</p>
                          <p className="text-sm font-semibold text-foreground">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(activity.price)}
                          </p>
                        </div>
                        <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                          {statusLabel}
                        </span>
                      </div>
                      <p className="mt-3 text-[12px] text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center bg-muted/30 rounded-2xl border border-dashed border-black/10">
                <span className="material-symbols-outlined text-[48px] text-muted-foreground/25 mb-3">
                  work_history
                </span>
                <p className="text-sm font-bold text-primary dark:text-white mb-1">
                  Nenhuma atividade recente encontrada.
                </p>
                <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                  Projetos concluídos e em andamento aparecerão aqui.
                </p>
              </div>
            )}
          </div>

          {/* Portfolio */}
          <div className="bg-card rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
            <h3 className="font-headline text-xl text-primary dark:text-white font-bold mb-6">
              Portfólio de Projetos
            </h3>
            <div className="flex flex-col items-center py-8 text-center">
              <span className="material-symbols-outlined text-[40px] text-muted-foreground/20 mb-3">
                folder_open
              </span>
              <p className="text-sm text-muted-foreground">Nenhum projeto no portfólio ainda.</p>
            </div>
          </div>

          {/* Reviews */}
          <ReviewSection accountId={profile.accountId} />
        </div>
      </div>

      {/* ═══════ Proposal Modal (centered) ═══════ */}
      {showProposalForm && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4 backdrop-blur-[2px]"
          onClick={() => setShowProposalForm(false)}
        >
          <div
            className="bg-card rounded-3xl p-8 max-w-md w-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border relative max-h-[90vh] overflow-y-auto dark:shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-headline text-xl text-primary dark:text-white font-bold">
                Enviar Proposta
              </h4>
              <button
                onClick={() => setShowProposalForm(false)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <form onSubmit={sendProposal} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground">Mensagem</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Descreva o escopo, projeto e necessidades..."
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-all placeholder:text-muted-foreground/40 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground">
                  Valor Fixo Sugerido (R$)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  placeholder="Ex.: 1500.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                />
                {price && Number(price) > 0 && (
                  <div className="mt-3 rounded-xl bg-muted/50 border border-border p-4 text-xs space-y-1.5">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Valor do profissional</span>
                      <span className="font-bold text-foreground">
                        R$ {Number(price).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Taxa Pronnect (10%)</span>
                      <span className="font-bold text-foreground">
                        R$ {(Number(price) * 0.1).toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-border pt-1.5 flex justify-between text-foreground font-bold text-sm">
                      <span>Total cobrado</span>
                      <span className="text-accent">R$ {(Number(price) * 1.1).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-primary mt-2 py-3.5 text-sm font-bold flex justify-center items-center gap-2 text-primary-foreground transition-all hover:bg-primary/95 disabled:opacity-50"
              >
                {submitting ? (
                  "Enviando…"
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span> Enviar
                    Proposta
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
