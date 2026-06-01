"use client";

import type {
  ProfessionalProfileResponse,
  ProposalResponse,
  ServiceContractResponse,
  ConversationResponse,
  ProfileSummaryResponse,
} from "@/lib/types";
import { ApiError, api, avatarUrl as buildAvatarUrl, resolveBackendUrl } from "@/lib/api";
import { getRoleFromToken, getToken, decodeJwtPayload } from "@/lib/auth";
import Link from "next/link";
import { FormEvent, useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ReviewSection } from "@/components/ReviewSection";
import { ZoomableAvatar } from "@/components/ZoomableAvatar";

// ─── Completion progress helper ─────────────────────────────────────────────
function getCompletionInfo(
  profile: ProfessionalProfileResponse | null,
  skillCount: number,
  profileName: string,
) {
  const fields = [
    { label: "Nome", done: !!profileName.trim() || !!profile?.name },
    { label: "Cargo / Função", done: !!profile?.headline },
    { label: "Descrição", done: !!profile?.description },
    { label: "E-mail de Contato", done: !!profile?.contactEmail },
    { label: "Habilidades", done: skillCount > 0 },
  ];
  const completed = fields.filter((f) => f.done).length;
  return {
    fields,
    completed,
    total: fields.length,
    percent: Math.round((completed / fields.length) * 100),
  };
}

export default function ProfessionalProfilePage() {
  const role = getRoleFromToken();
  const token = getToken();
  const payload = token ? decodeJwtPayload(token) : null;
  const tokenName = payload?.name || payload?.fullName || "";

  const [profileName, setProfileName] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [availableSkills, setAvailableSkills] = useState<{ id: string; name: string }[]>([]);
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [profile, setProfile] = useState<ProfessionalProfileResponse | null>(null);
  const [profileSummary, setProfileSummary] = useState<ProfileSummaryResponse | null>(null);
  const [avatarVersion, setAvatarVersion] = useState<number>(Date.now());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [proposals, setProposals] = useState<ProposalResponse[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  const [recentActivities, setRecentActivities] = useState<
    { id: string; otherPartyName: string; status: string; price: number; date: string }[]
  >([]);
  const [activityLoading, setActivityLoading] = useState(true);

  // ─── Load profile data ───────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    try {
      const me = await api<ProfessionalProfileResponse>("/professionals/me");
      setProfile(me);
      setProfileName(me.name || tokenName);
      setHeadline(me.headline || "");
      setDescription(me.description || "");
      setContactEmail(me.contactEmail || payload?.sub || "");
      setMySkills(me.skills || []);

      if (me.avatarUrl) {
        const resolvedUrl = resolveBackendUrl(me.avatarUrl);
        if (resolvedUrl) {
          window.localStorage.setItem("pronnect-avatar-url", resolvedUrl);
          window.dispatchEvent(new Event("pronnect-avatar-updated"));
        }
      }

      if (me.accountId) {
        try {
          const summaryData = await api<ProfileSummaryResponse>(
            `/contracts/account/${me.accountId}/summary`,
          );
          setProfileSummary(summaryData);
        } catch {
          setProfileSummary(null);
        }
      }
    } catch {
      setProfileName(tokenName);
      setContactEmail(payload?.sub || "");
    }

    try {
      const skills = await api<{ id: string; name: string }[]>("/skills");
      setAvailableSkills(skills);
    } catch {
      // Silently handle skill loading failure
    }

    try {
      const list = await api<ProposalResponse[]>("/proposals/me");
      setProposals(list);
    } catch {}

    // Load recent activities (same pattern as company profile)
    const loadRecentActivities = async () => {
      setActivityLoading(true);
      try {
        const [contracts, conversations] = await Promise.all([
          api<ServiceContractResponse[]>(`/contracts/me`),
          api<ConversationResponse[]>(`/conversations/me`),
        ]);

        const activities = contracts
          .map((contract) => {
            const conv = conversations.find((item) => item.proposalId === contract.proposalId);
            const date = contract.validatedAt || contract.completedAt || contract.startedAt;
            return {
              id: contract.id,
              otherPartyName: conv?.otherPartyName || "Cliente",
              status: contract.status,
              price: conv?.proposalPrice ?? 0,
              date: date || "",
            };
          })
          .filter((item) => item.date)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 4);

        setRecentActivities(activities);
      } catch {
        setRecentActivities([]);
      } finally {
        setActivityLoading(false);
      }
    };

    loadRecentActivities();

    setLoading(false);
  }, [tokenName, payload?.sub]);

  useEffect(() => {
    if (role !== "PROFESSIONAL") {
      setLoading(false);
      return;
    }
    loadProfile();
  }, [role, loadProfile]);

  // Avatar preview object URL management
  useEffect(() => {
    if (!selectedAvatar) {
      setAvatarPreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(selectedAvatar);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedAvatar]);

  // ─── Form submission ─────────────────────────────────────────────────────
  async function createOrUpdate(e: FormEvent) {
    e.preventDefault();

    const errors: Record<string, boolean> = {};
    if (!profileName.trim()) errors.name = true;
    if (!headline.trim()) errors.headline = true;
    if (!description.trim()) errors.description = true;
    if (!contactEmail.trim()) errors.contactEmail = true;
    if (mySkills.length === 0) errors.skills = true;
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        name: profileName,
        headline,
        description,
        contactEmail,
        avatarUrl: profile?.avatarUrl || null,
      };

      if (!profile) {
        try {
          await api("/professionals", { method: "POST", json: profileData });
        } catch (err) {
          if (err instanceof ApiError && (err.status === 400 || err.status === 409)) {
            await api("/professionals", { method: "PUT", json: profileData });
          } else {
            throw err;
          }
        }
      } else {
        await api("/professionals", { method: "PUT", json: profileData });
      }

      // Upload avatar if one was selected
      if (selectedAvatar) {
        const formData = new FormData();
        formData.append("file", selectedAvatar);
        await api<ProfessionalProfileResponse>("/professionals/me/avatar", {
          method: "POST",
          body: formData,
        });
      }

      // Reload profile to get latest state
      const currentProfile = await api<ProfessionalProfileResponse>("/professionals/me");
      setProfile(currentProfile);

      if (currentProfile.avatarUrl) {
        const newVersion = Date.now();
        setAvatarVersion(newVersion);
        const resolvedUrl = resolveBackendUrl(currentProfile.avatarUrl);
        if (resolvedUrl) {
          const bustedUrl = `${resolvedUrl}?v=${newVersion}`;
          window.localStorage.setItem("pronnect-avatar-url", bustedUrl);
          window.dispatchEvent(new Event("pronnect-avatar-updated"));
        }
      }

      // Sync skills
      const serverSkills = currentProfile.skills ?? profile?.skills ?? [];
      const toAdd = mySkills.filter((s) => !serverSkills.includes(s));
      const toRemove = serverSkills.filter((s) => !mySkills.includes(s));

      for (const skillName of toAdd) {
        const found = availableSkills.find(
          (s) => s.name.toLowerCase() === skillName.toLowerCase(),
        );
        if (!found) continue;
        try {
          await api("/professionals/me/skills", { method: "POST", json: { skillId: found.id } });
        } catch {}
      }

      for (const skillName of toRemove) {
        const found = availableSkills.find(
          (s) => s.name.toLowerCase() === skillName.toLowerCase(),
        );
        if (!found) continue;
        try {
          await api(`/professionals/me/skills/${found.id}`, { method: "DELETE" });
        } catch {}
      }

      toast.success("Perfil atualizado com sucesso!");
      setSelectedAvatar(null);
      setAvatarPreview(null);
      setValidationErrors({});
      setShowEditModal(false);
      await loadProfile();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error("Falha ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  // ─── Skill management ────────────────────────────────────────────────────
  function addSkill(text: string) {
    const clean = text.trim();
    if (!clean) return;
    if (mySkills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      toast.error("Essa habilidade já foi adicionada.");
      return;
    }
    setMySkills((prev) => [...prev, clean]);
    setSkillInput("");
    setValidationErrors((v) => ({ ...v, skills: false }));
  }

  function removeSkill(skillName: string) {
    setMySkills((prev) => prev.filter((s) => s !== skillName));
  }

  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    }
    if (e.key === "Backspace" && !skillInput && mySkills.length > 0) {
      setMySkills((prev) => prev.slice(0, -1));
    }
  }

  // ─── Proposal response ───────────────────────────────────────────────────
  async function respondProposal(id: string, action: "accept" | "reject") {
    try {
      await api(`/proposals/${id}/${action}`, { method: "PATCH" });
      toast.success(`Proposta ${action === "accept" ? "aceita" : "recusada"}.`);
      await loadProfile();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
      else toast.error("Falha ao processar proposta.");
    }
  }

  // ─── Derived state ───────────────────────────────────────────────────────
  const completion = getCompletionInfo(profile, mySkills.length, profileName);
  const displayName = profileName || profile?.name || tokenName || "Profissional";
  const avatarInitial = displayName.charAt(0).toUpperCase();
  const resolvedAvatarUrl = buildAvatarUrl(profile?.avatarUrl, avatarVersion);

  const pendingProposals = proposals.filter((p) => p.status === "PENDING");
  const otherProposals = proposals.filter((p) => p.status !== "PENDING");

  // ─── Guards ──────────────────────────────────────────────────────────────
  if (role !== "PROFESSIONAL") {
    return (
      <div className="mx-auto max-w-lg mt-20 p-8 text-center bg-card rounded-3xl shadow-sm border border-border">
        <span className="material-symbols-outlined text-[48px] text-destructive/80 mb-4">lock</span>
        <h2 className="font-headline text-xl font-bold text-primary dark:text-white mb-2">
          Acesso Restrito
        </h2>
        <p className="text-muted-foreground">
          Apenas contas do tipo Profissional podem acessar esta página.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-20 content-fade-in">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
          <aside className="w-full lg:w-[30%] flex flex-col gap-5 lg:sticky lg:top-28">
            {/* Profile Card */}
            <div className="bg-card rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <ZoomableAvatar
                src={avatarPreview || resolvedAvatarUrl}
                alt={displayName}
                fallbackText={avatarInitial}
                className="w-28 h-28 mb-5"
                fallbackClassName="text-4xl"
              />

              <h1 className="font-headline text-xl text-primary dark:text-white font-bold capitalize">
                {displayName}
              </h1>
              <p className="text-sm text-muted-foreground dark:text-gray-300 mt-0.5">
                {profile?.headline || (
                  <span className="italic text-muted-foreground/50 dark:text-gray-400">
                    Adicione seu cargo / função
                  </span>
                )}
              </p>

              {profile?.profileCompleted && (
                <span className="mt-3 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>{" "}
                  Disponível para Trabalho
                </span>
              )}

              <button
                onClick={() => setShowEditModal(true)}
                className="w-full mt-5 bg-card border border-black/10 hover:bg-muted dark:bg-card/40 text-primary dark:text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span> Editar Perfil
              </button>
            </div>

            {/* Resumo de Projetos */}
            {profileSummary && (
              <div className="bg-card rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
                <h3 className="font-headline text-base text-primary dark:text-white font-bold mb-4">
                  Resumo dos Projetos
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-muted p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                      Projetos ativos
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {profileSummary.activeContracts}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                      Saldo em carteira
                    </p>
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

            {/* Sobre */}
            <div className="bg-card rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-base text-primary dark:text-white font-bold mb-3">
                Sobre
              </h3>
              {profile?.description ? (
                <p className="text-sm text-muted-foreground dark:text-gray-300 leading-relaxed">
                  {profile.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/50 dark:text-gray-400 italic">
                  Clique em &quot;Editar Perfil&quot; para adicionar sua descrição.
                </p>
              )}
            </div>

            {/* Contato */}
            <div className="bg-card rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-base text-primary dark:text-white font-bold mb-4">
                Contato
              </h3>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground dark:text-gray-300">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-muted-foreground/60">
                    mail
                  </span>
                  {profile?.contactEmail || (
                    <span className="italic text-muted-foreground/40">Não configurado</span>
                  )}
                </div>
              </div>
            </div>

            {/* Habilidades */}
            <div className="bg-card rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-base text-primary dark:text-white font-bold mb-4">
                Habilidades
              </h3>
              <div className="flex flex-wrap gap-2">
                {mySkills.length > 0 ? (
                  mySkills.map((s) => (
                    <span
                      key={s}
                      className="bg-primary/5 text-primary dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/10"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground/50 dark:text-gray-400 italic">
                    Nenhuma habilidade configurada. Edite seu perfil para adicionar.
                  </p>
                )}
              </div>
            </div>
          </aside>

          {/* ═══════════════ RIGHT CONTENT ═══════════════ */}
          <div className="w-full lg:w-[70%] flex flex-col gap-6">
            {/* Onboarding Banner */}
            {(!profile || !profile.profileCompleted) && (
              <div className="bg-card rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-amber-200/60">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <span className="material-symbols-outlined text-[22px]">info</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-primary dark:text-white mb-1">
                      Complete seu perfil
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-gray-300 leading-relaxed">
                      Preencha os campos obrigatórios para que seu perfil apareça nas buscas e
                      empresas possam te encontrar.
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-muted-foreground dark:text-gray-300">
                      {completion.completed}/{completion.total} campos preenchidos
                    </span>
                    <span className="text-secondary">{completion.percent}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all duration-500"
                      style={{ width: `${completion.percent}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {completion.fields.map((field) => (
                    <div
                      key={field.label}
                      className={`flex items-center gap-2 text-xs ${
                        field.done ? "text-emerald-600" : "text-muted-foreground/50 dark:text-gray-400"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {field.done ? "check_circle" : "radio_button_unchecked"}
                      </span>
                      {field.label}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowEditModal(true)}
                  className="text-sm font-bold text-secondary hover:underline inline-flex items-center gap-1"
                >
                  Completar agora{" "}
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            )}

            {/* Atividade Recente */}
            <div className="bg-card rounded-3xl p-8 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-6">
                Atividade Recente
              </h3>
              {activityLoading ? (
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
                      <div
                        key={activity.id}
                        className="rounded-2xl bg-muted p-4 border border-border"
                      >
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

            {/* Propostas Recebidas */}
            <div className="bg-card rounded-3xl p-8 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-1">
                Propostas Recebidas
              </h3>
              <p className="text-sm text-muted-foreground dark:text-gray-300 mb-6">
                {proposals.length} proposta(s) no total
              </p>

              {proposals.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center bg-muted/30 rounded-2xl border border-dashed border-black/10">
                  <span className="material-symbols-outlined text-[48px] text-muted-foreground/25 mb-3">
                    inbox
                  </span>
                  <p className="text-sm font-bold text-primary dark:text-white mb-1">
                    Nenhuma proposta recebida ainda.
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                    Complete seu perfil para aparecer nas buscas.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {pendingProposals.map((p) => (
                    <div
                      key={p.id}
                      className="bg-amber-30/50 border border-amber-200/50 rounded-2xl p-5"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-base font-bold text-primary dark:text-white">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(p.price)}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                          Pendente
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground dark:text-gray-300 line-clamp-2 mb-4">
                        {p.message}
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => respondProposal(p.id, "accept")}
                          className="bg-secondary hover:bg-secondary/90 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">check</span>{" "}
                          Aceitar
                        </button>
                        <button
                          onClick={() => respondProposal(p.id, "reject")}
                          className="bg-transparent border border-destructive/30 text-destructive hover:bg-destructive/5 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>{" "}
                          Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                  {otherProposals.map((p) => (
                    <div
                      key={p.id}
                      className="bg-muted/40 border border-black/[0.06] rounded-2xl p-5"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-base font-bold text-primary dark:text-white">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(p.price)}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wider ${
                            p.status === "ACCEPTED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-muted text-muted-foreground border border-border"
                          }`}
                        >
                          {p.status === "ACCEPTED"
                            ? "Aceita"
                            : p.status === "REJECTED"
                              ? "Recusada"
                              : p.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground dark:text-gray-300 line-clamp-2">
                        {p.message}
                      </p>
                      {p.status === "ACCEPTED" && (
                        <Link
                          href="/app/messages"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:underline"
                        >
                          <span className="material-symbols-outlined text-[16px]">chat</span> Abrir
                          Chat
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Avaliações */}
            {profile?.accountId ? (
              <ReviewSection accountId={profile.accountId} />
            ) : (
              <div className="bg-card rounded-3xl p-8 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none animate-fade-in">
                <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-5">
                  Avaliações
                </h3>
                <div className="flex flex-col items-center py-8 text-center bg-muted/30 rounded-2xl border border-dashed border-black/10">
                  <span className="material-symbols-outlined text-[40px] text-muted-foreground/25 mb-3">
                    rate_review
                  </span>
                  <p className="text-sm text-muted-foreground dark:text-gray-300">
                    Você ainda não possui avaliações. Conclua projetos para recebê-las!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════ EDIT PROFILE MODAL ═══════════════ */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-start justify-center pt-16 pb-10 px-4 backdrop-blur-[2px] overflow-y-auto"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-card rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-border dark:shadow-none relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline text-xl text-primary dark:text-white font-bold">
                Editar Perfil
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-4 mb-6">
              <Avatar className="w-20 h-20 shadow-md border-[3px] border-muted">
                {avatarPreview || resolvedAvatarUrl ? (
                  <AvatarImage
                    src={avatarPreview || resolvedAvatarUrl || ""}
                    alt={displayName}
                  />
                ) : (
                  <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                    {avatarInitial}
                  </AvatarFallback>
                )}
              </Avatar>
              <label
                htmlFor="professional-avatar-upload"
                className="group flex w-full max-w-xs cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-border/60 bg-card px-5 py-4 text-center text-sm text-muted-foreground transition hover:border-primary hover:bg-muted hover:text-primary"
              >
                <span className="material-symbols-outlined text-4xl transition group-hover:text-primary">
                  photo_camera
                </span>
                <span className="font-medium">
                  {selectedAvatar ? selectedAvatar.name : "Escolher imagem de perfil"}
                </span>
                <span className="text-xs text-muted-foreground/50">JPG, PNG ou WebP • Máx. 5 MB</span>
                <input
                  id="professional-avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file && file.size > 5 * 1024 * 1024) {
                      toast.error("Imagem muito grande. Máximo permitido: 5 MB.");
                      return;
                    }
                    setSelectedAvatar(file);
                  }}
                  className="sr-only"
                />
              </label>
            </div>

            <form id="professionalProfileForm" onSubmit={createOrUpdate} className="space-y-5 mb-8">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">
                  Nome <span className="text-destructive">*</span>
                </label>
                <input
                  value={profileName}
                  onChange={(e) => {
                    setProfileName(e.target.value);
                    setValidationErrors((v) => ({ ...v, name: false }));
                  }}
                  maxLength={100}
                  className={`w-full rounded-xl border ${
                    validationErrors.name ? "border-destructive" : "border-border/60"
                  } bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary`}
                  placeholder="Seu nome completo"
                />
                {validationErrors.name && (
                  <p className="text-xs text-destructive mt-1">Campo obrigatório</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">
                  Cargo / Função <span className="text-destructive">*</span>
                </label>
                <input
                  value={headline}
                  onChange={(e) => {
                    setHeadline(e.target.value);
                    setValidationErrors((v) => ({ ...v, headline: false }));
                  }}
                  maxLength={150}
                  className={`w-full rounded-xl border ${
                    validationErrors.headline ? "border-destructive" : "border-border/60"
                  } bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary`}
                  placeholder="Ex.: Desenvolvedor Full Stack"
                />
                {validationErrors.headline && (
                  <p className="text-xs text-destructive mt-1">Campo obrigatório</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">
                  Descrição <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setValidationErrors((v) => ({ ...v, description: false }));
                  }}
                  rows={4}
                  className={`w-full rounded-xl border ${
                    validationErrors.description ? "border-destructive" : "border-border/60"
                  } bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary resize-none`}
                  placeholder="Fale sobre você, experiências e interesses..."
                />
                {validationErrors.description && (
                  <p className="text-xs text-destructive mt-1">Campo obrigatório</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">
                  E-mail de Contato <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => {
                    setContactEmail(e.target.value);
                    setValidationErrors((v) => ({ ...v, contactEmail: false }));
                  }}
                  className={`w-full rounded-xl border ${
                    validationErrors.contactEmail ? "border-destructive" : "border-border/60"
                  } bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary`}
                  placeholder="seuemail@exemplo.com"
                />
                {validationErrors.contactEmail && (
                  <p className="text-xs text-destructive mt-1">Campo obrigatório</p>
                )}
              </div>
            </form>

            {/* Skills Manager */}
            <div className="border-t border-border/40 pt-6">
              <h4 className="font-headline text-base text-primary dark:text-white font-bold mb-1">
                Habilidades <span className="text-destructive">*</span>
              </h4>
              <p className="text-xs text-muted-foreground/60 mb-3">
                Digite e pressione{" "}
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd>{" "}
                para adicionar.
              </p>
              {validationErrors.skills && (
                <p className="text-xs text-destructive mb-2">Adicione pelo menos uma habilidade.</p>
              )}

              {mySkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {mySkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 bg-secondary text-white pl-3 pr-1.5 py-1.5 rounded-full text-xs font-bold"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
                        aria-label={`Remover ${s}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5">
                <span className="material-symbols-outlined text-[18px] text-muted-foreground/50">
                  add
                </span>
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Ex.: React, TypeScript, Figma..."
                  className="w-full bg-transparent text-sm text-foreground dark:text-white outline-none placeholder:text-muted-foreground/40"
                />
                {skillInput.trim() && (
                  <button
                    type="button"
                    onClick={() => addSkill(skillInput)}
                    className="shrink-0 text-xs font-bold text-secondary hover:text-secondary/80 transition-colors px-2 py-1 rounded-lg hover:bg-secondary/10"
                  >
                    Adicionar
                  </button>
                )}
              </div>
            </div>

            <button
              form="professionalProfileForm"
              type="submit"
              disabled={saving}
              className="mt-8 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
            >
              {saving ? "Salvando..." : profile ? "Salvar Alterações" : "Criar Perfil"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}