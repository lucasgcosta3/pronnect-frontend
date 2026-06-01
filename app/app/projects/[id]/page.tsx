"use client";

import type { ProjectResponse, BidResponse } from "@/lib/types";
import { ApiError, api, resolveBackendUrl } from "@/lib/api";
import { getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Briefcase, DollarSign, Clock, Calendar, FileText, Globe, Check, X, AlertTriangle, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const role = getRoleFromToken();

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [bids, setBids] = useState<BidResponse[]>([]);
  const [myBid, setMyBid] = useState<BidResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bid form state (for professionals)
  const [bidAmount, setBidAmount] = useState<number | "">("");
  const [bidDeliveryDays, setBidDeliveryDays] = useState<number | "">("");
  const [bidCoverLetter, setBidCoverLetter] = useState("");
  const [bidPortfolioUrl, setBidPortfolioUrl] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);

  // General action loading state
  const [actionLoading, setActionLoading] = useState(false);

  const loadProjectData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const proj = await api<ProjectResponse>(`/projects/${projectId}`);
      setProject(proj);

      if (role === "COMPANY") {
        // Companies can fetch bids for their own projects
        try {
          const projectBids = await api<BidResponse[]>(`/projects/${projectId}/bids`);
          setBids(projectBids);
        } catch {
          // Might not be the owner
          setBids([]);
        }
      } else if (role === "PROFESSIONAL") {
        // Professionals can check if they already bid
        try {
          const professionalBids = await api<BidResponse[]>("/projects/bids/my");
          const found = professionalBids.find((b) => b.projectId === projectId);
          if (found) {
            setMyBid(found);
          }
        } catch {
          setMyBid(null);
        }
      }
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Não foi possível carregar os detalhes do projeto.");
    } finally {
      setLoading(false);
    }
  }, [projectId, role]);

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId, loadProjectData]);

  async function handleCloseProject() {
    if (!project) return;
    if (!confirm("Tem certeza que deseja fechar este projeto para novas propostas?")) return;

    setActionLoading(true);
    try {
      await api<void>(`/projects/${project.id}/close`, { method: "PATCH" });
      toast.success("Projeto fechado com sucesso!");
      loadProjectData();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error("Erro ao fechar projeto.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePlaceBid(e: React.FormEvent) {
    e.preventDefault();
    if (!project) return;
    if (bidAmount === "" || bidDeliveryDays === "" || !bidCoverLetter.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setSubmittingBid(true);
    try {
      const newBid = await api<BidResponse>(`/projects/${project.id}/bids`, {
        method: "POST",
        json: {
          amount: Number(bidAmount),
          deliveryDays: Number(bidDeliveryDays),
          coverLetter: bidCoverLetter.trim(),
          portfolioUrl: bidPortfolioUrl.trim() || null,
        },
      });
      toast.success("Lance enviado com sucesso!");
      setMyBid(newBid);
      loadProjectData();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error("Erro ao enviar proposta.");
    } finally {
      setSubmittingBid(false);
    }
  }

  async function handleAcceptBid(bidId: string) {
    if (!confirm("Ao aceitar este lance, o projeto passará para o status 'Em Progresso' e as demais propostas serão ignoradas. Confirmar?")) return;

    setActionLoading(true);
    try {
      await api<void>(`/projects/bids/${bidId}/accept`, { method: "PATCH" });
      toast.success("Lance aceito com sucesso! O projeto agora está em andamento.");
      loadProjectData();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error("Erro ao aceitar lance.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRejectBid(bidId: string) {
    if (!confirm("Tem certeza que deseja rejeitar esta proposta?")) return;

    setActionLoading(true);
    try {
      await api<void>(`/projects/bids/${bidId}/reject`, { method: "PATCH" });
      toast.success("Proposta rejeitada.");
      loadProjectData();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error("Erro ao rejeitar proposta.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 mt-16">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-2xl py-20 px-4 text-center mt-16">
        <AlertTriangle className="mx-auto text-destructive mb-4" size={48} />
        <p className="text-destructive font-bold mb-4">{error || "Projeto não encontrado."}</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-xl bg-muted px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">Aberto</span>;
      case "CLOSED":
        return <span className="rounded-full bg-red-50 dark:bg-red-950/30 px-3 py-1 text-xs font-bold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">Fechado</span>;
      case "IN_PROGRESS":
        return <span className="rounded-full bg-amber-50 dark:bg-amber-950/30 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">Em Progresso</span>;
      case "COMPLETED":
        return <span className="rounded-full bg-blue-50 dark:bg-blue-950/30 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900">Concluído</span>;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 mt-16">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.push("/app/projects")}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Voltar para Projetos
      </button>

      {/* Main Content Layout */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl bg-card p-6 shadow-sm border border-border">
            <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
              <span className="text-sm font-semibold text-muted-foreground">{project.companyName}</span>
              {getStatusBadge(project.status)}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4 leading-tight">
              {project.title}
            </h1>

            {/* Metas */}
            <div className="flex flex-wrap gap-x-6 gap-y-3 mb-6 pb-6 border-b border-border text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-2">
                {project.paymentType === "FIXED_PRICE" ? (
                  <>
                    <DollarSign size={16} className="text-accent" />
                    <span>Valor Fechado</span>
                  </>
                ) : (
                  <>
                    <Clock size={16} className="text-accent" />
                    <span>Por Hora</span>
                  </>
                )}
              </div>

              {(project.budgetMin !== null || project.budgetMax !== null) && (
                <div className="flex items-center gap-1 text-foreground font-bold">
                  <span>
                    {project.budgetMin !== null && project.budgetMax !== null
                      ? `R$ ${project.budgetMin.toLocaleString("pt-BR")} - R$ ${project.budgetMax.toLocaleString("pt-BR")}`
                      : project.budgetMin !== null
                      ? `A partir de R$ ${project.budgetMin.toLocaleString("pt-BR")}`
                      : project.budgetMax !== null
                      ? `Até R$ ${project.budgetMax.toLocaleString("pt-BR")}`
                      : "A combinar"}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Publicado em {new Date(project.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground">Descrição do Projeto</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {project.description}
              </p>
            </div>

            {/* Skills */}
            <div className="mt-8 space-y-3">
              <h2 className="text-sm font-bold text-foreground">Habilidades Necessárias</h2>
              <div className="flex flex-wrap gap-2">
                {project.skills && project.skills.length > 0 ? (
                  project.skills.map((s) => (
                    <span key={s} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-bold text-muted-foreground uppercase">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic text-muted-foreground">Sem especificações</span>
                )}
              </div>
            </div>

            {/* AI Recommendation Alert */}
            {project.aiJustification && (
              <div className="mt-8 rounded-2xl border border-secondary/20 bg-secondary/5 p-4 text-sm text-foreground flex gap-3">
                <div className="text-secondary shrink-0">✨</div>
                <div>
                  <span className="font-bold text-secondary">Modalidade sugerida pela IA:</span> {project.aiJustification}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Actions / Bids */}
        <div className="space-y-6">
          {/* Professional Action Area */}
          {role === "PROFESSIONAL" && (
            <div className="rounded-3xl bg-card p-6 shadow-sm border border-border">
              {myBid ? (
                /* Professional already submitted a bid */
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Check className="text-emerald-500" size={20} />
                      Seu Lance Enviado
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Você já enviou uma proposta para este projeto. O status atual do seu lance é:
                    </p>

                    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3 text-sm">
                      <div className="flex justify-between font-bold">
                        <span>Valor do Lance:</span>
                        <span className="text-primary">R$ {myBid.amount.toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>Tempo de Entrega:</span>
                        <span>{myBid.deliveryDays} dias</span>
                      </div>
                      {myBid.portfolioUrl && (
                        <div className="flex justify-between font-bold">
                          <span>Portfólio:</span>
                          <a href={myBid.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline flex items-center gap-1">
                            <Globe size={12} /> Ver link
                          </a>
                        </div>
                      )}
                      <div className="flex justify-between font-bold items-center">
                        <span>Status:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                          myBid.status === "PENDING"
                            ? "bg-amber-500/10 text-amber-600"
                            : myBid.status === "ACCEPTED"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-red-500/10 text-red-600"
                        }`}>
                          {myBid.status === "PENDING" ? "Pendente" : myBid.status === "ACCEPTED" ? "Aceito" : "Rejeitado"}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-muted/20 p-3 border border-border text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      <span className="font-bold block mb-1 text-foreground">Carta de Apresentação:</span>
                      {myBid.coverLetter}
                    </div>

                    {myBid.status === "ACCEPTED" && myBid.proposalId && (
                      <div className="pt-2">
                        <Link
                          href={`/app/messages/open-proposal/${myBid.proposalId}`}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground shadow-sm hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[18px]">chat</span>
                          Abrir Chat
                        </Link>
                      </div>
                    )}
                  </div>
                ) : project.status === "OPEN" ? (
                  /* Form to place a bid */
                  <form onSubmit={handlePlaceBid} className="space-y-4">
                    <h2 className="text-lg font-bold text-foreground">Enviar Proposta</h2>
                    <p className="text-xs text-muted-foreground">
                      Defina suas condições e envie sua carta de apresentação para o cliente.
                    </p>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-foreground">Valor da Proposta (R$)*</label>
                      <input
                        type="number"
                        required
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Ex: 3500"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-foreground">Tempo de Entrega (dias)*</label>
                      <input
                        type="number"
                        required
                        value={bidDeliveryDays}
                        onChange={(e) => setBidDeliveryDays(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="Ex: 10"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-foreground">Link do Portfólio (opcional)</label>
                      <input
                        type="url"
                        value={bidPortfolioUrl}
                        onChange={(e) => setBidPortfolioUrl(e.target.value)}
                        placeholder="https://github.com/seuperfil"
                        className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary transition-colors"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold text-foreground">Carta de Apresentação*</label>
                      <textarea
                        required
                        rows={4}
                        value={bidCoverLetter}
                        onChange={(e) => setBidCoverLetter(e.target.value)}
                        placeholder="Explique por que você é a pessoa ideal para este projeto..."
                        className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingBid}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40"
                    >
                      {submittingBid ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                          Enviando...
                        </>
                      ) : (
                        "Enviar Lance"
                      )}
                    </button>
                  </form>
              ) : (
                <p className="text-sm text-muted-foreground text-center">
                  Este projeto não está mais aceitando propostas.
                </p>
              )}
            </div>
          )}

          {/* Company Action Area (Project owner) */}
          {role === "COMPANY" && project.status === "OPEN" && (
            <div className="rounded-3xl bg-card p-6 shadow-sm border border-border text-center space-y-4">
              <h2 className="text-lg font-bold text-foreground">Ações da Empresa</h2>
              <p className="text-xs text-muted-foreground">
                Você pode fechar o projeto se decidir não contratar mais profissionais.
              </p>
              <button
                onClick={handleCloseProject}
                disabled={actionLoading}
                className="w-full rounded-xl bg-destructive text-destructive-foreground py-3 text-sm font-bold shadow-sm hover:bg-destructive/95 transition-colors disabled:opacity-50"
              >
                Fechar Projeto
              </button>
            </div>
          )}

          {/* Bids List for Company Owner */}
          {role === "COMPANY" && (
            <div className="rounded-3xl bg-card p-6 shadow-sm border border-border space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Briefcase size={20} />
                Propostas Recebidas ({bids.length})
              </h2>

              {bids.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum lance recebido para este projeto.
                </p>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {bids.map((bid) => {
                    const initials = bid.professionalName ? bid.professionalName.charAt(0).toUpperCase() : "P";
                    return (
                      <div key={bid.id} className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border">
                            {bid.professionalAvatarUrl ? (
                              <AvatarImage src={resolveBackendUrl(bid.professionalAvatarUrl) || ""} alt={bid.professionalName} />
                            ) : (
                              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                                {initials}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="min-w-0">
                            <span className="block text-sm font-bold text-foreground truncate">{bid.professionalName}</span>
                            <span className="block text-xs text-muted-foreground truncate">{bid.professionalHeadline || "Freelancer"}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold bg-background p-2 rounded-lg border border-border">
                          <div>
                            <span className="text-muted-foreground">Valor: </span>
                            <span className="text-primary font-bold">R$ {bid.amount.toLocaleString("pt-BR")}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tempo: </span>
                            <span className="text-foreground font-bold">{bid.deliveryDays} dias</span>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/40 p-2.5 rounded-lg border border-border/40">
                          {bid.coverLetter}
                        </p>

                        {bid.portfolioUrl && (
                          <a href={bid.portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-accent hover:underline">
                            <Globe size={12} /> Ver Portfólio
                          </a>
                        )}

                        {/* Bid status and actions */}
                        <div className="pt-2 flex items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${
                            bid.status === "PENDING"
                              ? "bg-amber-500/10 text-amber-600"
                              : bid.status === "ACCEPTED"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-red-500/10 text-red-600"
                          }`}>
                            {bid.status === "PENDING" ? "Pendente" : bid.status === "ACCEPTED" ? "Aceito" : "Rejeitado"}
                          </span>

                          {bid.status === "PENDING" && project.status === "OPEN" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleRejectBid(bid.id)}
                                disabled={actionLoading}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                title="Rejeitar Proposta"
                              >
                                <X size={14} />
                              </button>
                              <button
                                onClick={() => handleAcceptBid(bid.id)}
                                disabled={actionLoading}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                                title="Aceitar Proposta"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          )}

                          {bid.status === "ACCEPTED" && bid.proposalId && (
                            <Link
                              href={`/app/messages/open-proposal/${bid.proposalId}`}
                              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[10px] font-bold text-accent-foreground shadow-sm hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-95"
                            >
                              <span className="material-symbols-outlined text-[14px]">chat</span>
                              Abrir Chat
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
