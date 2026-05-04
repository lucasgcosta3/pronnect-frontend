"use client";

import type { ProfessionalProfileResponse, ProposalResponse } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function ProfessionalDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const role = getRoleFromToken();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfessionalProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Proposal State
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center">
        <p className="text-lg font-medium text-destructive mb-4">{error || "Não encontrado."}</p>
        <button onClick={() => router.back()} className="text-accent hover:underline">Voltar</button>
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
            <Avatar className="w-36 h-36 mb-4 shadow-md border-[3px] border-border">
              <AvatarFallback className="bg-primary text-primary-foreground text-5xl font-bold">
                {avatarInitial}
              </AvatarFallback>
            </Avatar>
            <h1 className="font-headline text-2xl text-primary dark:text-white font-bold capitalize">{profileName}</h1>
              <h2 className="text-[15px] text-muted-foreground dark:text-gray-300 font-medium mt-1">{profile.headline}</h2>

            {profile.profileCompleted && (
              <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold px-3 py-1.5 rounded-full mt-3 flex items-center gap-1.5 shadow-sm border border-emerald-200 dark:border-emerald-700">
                <span className="material-symbols-outlined text-[16px]">check_circle</span> Disponível para Trabalho
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full mt-6 flex flex-col gap-3">
              {role === "COMPANY" ? (
                <button onClick={() => setShowProposalForm(true)} className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5">
                  <span className="material-symbols-outlined text-[18px]">work</span> Contrate-me
                </button>
              ) : (
                <button disabled className="w-full bg-muted opacity-50 text-muted-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                  Contrate-me <span className="text-[10px] uppercase ml-1">(Apenas Empresas)</span>
                </button>
              )}
              <Link href="/app/messages" className="w-full bg-card border border-border hover:bg-muted text-primary font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">chat</span> Mensagem
              </Link>
            </div>
          </div>

          {/* About */}
          <div className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border text-left dark:shadow-none">
            <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-3">Sobre</h3>
            {profile.description ? (
              <p className="text-sm text-muted-foreground dark:text-gray-300 leading-relaxed">{profile.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">Nenhuma descrição disponível.</p>
            )}
          </div>

          {/* Contact */}
          <div className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border text-left dark:shadow-none">
            <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-4">Contato</h3>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px] text-muted-foreground/80 dark:text-gray-400">mail</span>
                {profile.contactEmail || <span className="italic text-muted-foreground/50">Não informado</span>}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-card rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border text-left lg:mb-0 dark:shadow-none">
            <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-4">Habilidades</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill) => (
                  <span key={skill} className="bg-primary/10 text-primary dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/15">{skill}</span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">Nenhuma habilidade listada.</p>
              )}
            </div>
          </div>

        </aside>

        {/* Right Area (2/3) */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">

          {/* Info notice if profile not completed */}
          {!profile.profileCompleted && (
            <div className="bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/30 rounded-3xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <span className="material-symbols-outlined text-[22px]">info</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary dark:text-white mb-1">Perfil incompleto</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Este profissional ainda não completou seu perfil. Algumas informações podem estar indisponíveis.
                </p>
              </div>
            </div>
          )}

          {/* Empty state for sections that come from user input */}
          <div className="bg-card rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
            <h3 className="font-headline text-xl text-primary dark:text-white font-bold mb-6">Experiência de Trabalho</h3>
            <div className="flex flex-col items-center py-8 text-center">
              <span className="material-symbols-outlined text-[40px] text-muted-foreground/20 mb-3">work_history</span>
              <p className="text-sm text-muted-foreground">Nenhuma experiência adicionada.</p>
            </div>
          </div>

          {/* Portfolio */}
          <div className="bg-card rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
            <h3 className="font-headline text-xl text-primary dark:text-white font-bold mb-6">Portfólio de Projetos</h3>
            <div className="flex flex-col items-center py-8 text-center">
              <span className="material-symbols-outlined text-[40px] text-muted-foreground/20 mb-3">folder_open</span>
              <p className="text-sm text-muted-foreground">Nenhum projeto no portfólio ainda.</p>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-card rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
            <h3 className="font-headline text-xl text-primary dark:text-white font-bold mb-5">Avaliações</h3>
            <div className="flex flex-col items-center py-8 text-center">
              <span className="material-symbols-outlined text-[40px] text-muted-foreground/20 mb-3">rate_review</span>
              <p className="text-sm text-muted-foreground">Sem avaliações por enquanto.</p>
            </div>
          </div>

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
              <h4 className="font-headline text-xl text-primary dark:text-white font-bold">Enviar Proposta</h4>
              <button onClick={() => setShowProposalForm(false)} className="text-muted-foreground hover:text-destructive transition-colors">
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
                <label className="mb-1.5 block text-sm font-bold text-foreground">Valor Fixo Sugerido (R$)</label>
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
                      <span className="font-bold text-foreground">R$ {Number(price).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Taxa Pronnect (10%)</span>
                      <span className="font-bold text-foreground">R$ {(Number(price) * 0.10).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-border pt-1.5 flex justify-between text-foreground font-bold text-sm">
                      <span>Total cobrado</span>
                      <span className="text-accent">R$ {(Number(price) * 1.10).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-primary mt-2 py-3.5 text-sm font-bold flex justify-center items-center gap-2 text-primary-foreground transition-all hover:bg-primary/95 disabled:opacity-50"
              >
                {submitting ? "Enviando…" : <><span className="material-symbols-outlined text-[18px]">send</span> Enviar Proposta</>}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
