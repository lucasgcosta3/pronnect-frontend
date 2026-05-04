"use client";

import type {
  ProfessionalProfileResponse,
  ProposalResponse,
  ServiceContractResponse,
  ConversationResponse,
} from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { getRoleFromToken, getToken, decodeJwtPayload } from "@/lib/auth";
import Link from "next/link";
import { FormEvent, useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

// ─── Helper: completion progress ───
function getCompletionInfo(
  profile: ProfessionalProfileResponse | null,
  skillCount: number,
  profileName: string
) {
  const fields = [
    { label: "Nome", done: !!profileName.trim() || !!profile?.name },
    { label: "Cargo / Função", done: !!profile?.headline },
    { label: "Descrição", done: !!profile?.description },
    { label: "E-mail de Contato", done: !!profile?.contactEmail },
    { label: "Habilidades", done: skillCount > 0 },
  ];
  const completed = fields.filter((f) => f.done).length;
  return { fields, completed, total: fields.length, percent: Math.round((completed / fields.length) * 100) };
}

export default function ProfessionalProfilePage() {
  const role = getRoleFromToken();
  const token = getToken();
  const payload = token ? decodeJwtPayload(token) : null;
  const tokenName = payload?.name || payload?.fullName || "";

  const [profileName, setProfileName] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [availableSkills, setAvailableSkills] = useState<{ id: string; name: string }[]>([]);
  const [contactEmail, setContactEmail] = useState("");
  const [mySkills, setMySkills] = useState<string[]>([]);
  const [profile, setProfile] = useState<ProfessionalProfileResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [proposals, setProposals] = useState<ProposalResponse[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // Completed projects
  const [completedProjects, setCompletedProjects] = useState<
    { proposalId: string; otherPartyName: string; price: number; completedAt: string }[]
  >([]);

  // ─── Load profile data ───
  const loadProfile = useCallback(async () => {
    try {
      const me = await api<ProfessionalProfileResponse>("/professionals/me");
      setProfile(me);
      setProfileName(me.name || tokenName);
      setHeadline(me.headline || "");
      setDescription(me.description || "");
      setContactEmail(me.contactEmail || payload?.sub || "");

      setMySkills(me.skills || []);
    } catch {
      // not created yet
      setProfileName(tokenName);
      setContactEmail(payload?.sub || "");
    }

    try {
    const skills = await api<{ id: string; name: string }[]>("/skills");
    setAvailableSkills(skills);
  } catch (err) {
    console.warn("Aviso ao carregar skills:", err instanceof Error ? err.message : String(err));
  }

    try {
      const list = await api<ProposalResponse[]>("/proposals/me");
      setProposals(list);
    } catch {}

    // Load completed projects from conversations + contracts
    try {
      const convos = await api<ConversationResponse[]>("/conversations/me");
      const projects: typeof completedProjects = [];
      for (const conv of convos) {
        try {
          const contract = await api<ServiceContractResponse>(`/contracts/proposal/${conv.proposalId}`);
          if (contract.status === "VALIDATED" && contract.validatedAt) {
            projects.push({
              proposalId: conv.proposalId,
              otherPartyName: conv.otherPartyName,
              price: conv.proposalPrice,
              completedAt: contract.validatedAt,
            });
          }
        } catch {}
      }
      setCompletedProjects(projects);
    } catch {}

    setLoading(false);
  }, [tokenName, payload?.sub]);

  useEffect(() => {
    if (role !== "PROFESSIONAL") {
      setLoading(false);
      return;
    }
    loadProfile();
  }, [role, loadProfile]);

  // ─── Form submission ───
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
    const profileData = { name: profileName, headline, description, contactEmail };

    // 1. Criar ou atualizar perfil
    if (!profile) {
      try {
        await api("/professionals", {
          method: "POST",
          json: profileData,
        });
      } catch (err) {
        // Se já existe (ex.: criação anterior parcial), faz PUT como fallback
        if (err instanceof ApiError && (err.status === 400 || err.status === 409)) {
          await api("/professionals", {
            method: "PUT",
            json: profileData,
          });
        } else {
          throw err;
        }
      }
    } else {
      await api("/professionals", {
        method: "PUT",
        json: profileData,
      });
    }

    // 2. Recarregar perfil para ter o estado atualizado antes de salvar skills
    let currentProfile: ProfessionalProfileResponse | null = null;
    try {
      currentProfile = await api<ProfessionalProfileResponse>("/professionals/me");
      setProfile(currentProfile);
    } catch { /* continua mesmo sem recarregar */ }

    // 3. Resolver nomes de skill → UUIDs
    const skillsNoApi = currentProfile?.skills ?? profile?.skills ?? [];
    const skillsParaAdicionar = mySkills.filter((s) => !skillsNoApi.includes(s));
    const skillsParaRemover   = skillsNoApi.filter((s) => !mySkills.includes(s));

    for (const skillName of skillsParaAdicionar) {
      const found = availableSkills.find(
        (s) => s.name.toLowerCase() === skillName.toLowerCase()
      );
      if (!found) continue; // skill digitada não existe no catálogo
      try {
        await api("/professionals/me/skills", {
          method: "POST",
          json: { skillId: found.id },
        });
      } catch { /* ignora duplicata */ }
    }

    for (const skillName of skillsParaRemover) {
      const found = availableSkills.find(
        (s) => s.name.toLowerCase() === skillName.toLowerCase()
      );
      if (!found) continue;
      try {
        await api(`/professionals/me/skills/${found.id}`, {
          method: "DELETE",
        });
      } catch { /* ignora */ }
    }

    toast.success("Perfil atualizado com sucesso!");
    await loadProfile();
    setShowEditModal(false);
    setValidationErrors({});
  } catch (err) {
    if (err instanceof ApiError) toast.error(err.message);
    else toast.error("Falha ao salvar.");
  } finally {
    setSaving(false);
  }
}

  // ─── Add skill (free text) ───
  function addSkill(text: string) {
    const clean = text.trim();
    if (!clean) return;
    if (mySkills.some((s) => s.toLowerCase() === clean.toLowerCase())) {
      toast.error("Essa habilidade já foi adicionada.");
      return;
    }
    const updated = [...mySkills, clean];
    setMySkills(updated);
    setSkillInput("");
    setValidationErrors((v) => ({ ...v, skills: false }));
  }

  // ─── Remove skill ───
  function removeSkill(skillName: string) {
    const updated = mySkills.filter((s) => s !== skillName);
    setMySkills(updated);
  }

  // ─── Handle skill input keydown ───
  function handleSkillKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(skillInput);
    }
    if (e.key === "Backspace" && !skillInput && mySkills.length > 0) {
      // Remove last skill on backspace when input is empty
      const updated = mySkills.slice(0, -1);
      setMySkills(updated);
    }
  }

  // ─── Respond to proposal ───
  async function respondProposal(id: string, action: "accept" | "reject") {
    try {
      await api(`/proposals/${id}/${action}`, { method: "PATCH" });
      toast.success(`Proposta ${action === "accept" ? "aceita" : "recusada"}.`);
      await loadProfile();
    } catch (e) {
      if (e instanceof ApiError) toast.error(e.message);
    }
  }



  // ─── Completion info ───
  const completion = getCompletionInfo(profile, mySkills.length, profileName);

  // ─── Display name ───
  const displayName = profileName || profile?.name || tokenName || "Profissional";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  if (role !== "PROFESSIONAL") {
    return <p className="text-muted-foreground dark:text-gray-300 text-center mt-20">Acesso negado.</p>;
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  const pendingProposals = proposals.filter((p) => p.status === "PENDING");
  const otherProposals = proposals.filter((p) => p.status !== "PENDING");

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* ═══════════════════════════════════════════
              LEFT SIDEBAR
              ═══════════════════════════════════════════ */}
          <aside className="w-full lg:w-[30%] flex flex-col gap-5 lg:sticky lg:top-28">

            {/* Profile Card */}
            <div className="bg-card rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <Avatar className="w-28 h-28 mb-5 shadow-md border-[3px] border-white">
                <AvatarFallback className="bg-primary text-white text-4xl font-bold">
                  {avatarInitial}
                </AvatarFallback>
              </Avatar>

              <h1 className="font-headline text-xl text-primary dark:text-white font-bold capitalize">{displayName}</h1>
              <p className="text-sm text-muted-foreground dark:text-gray-300 mt-0.5">
                {profile?.headline || <span className="italic text-muted-foreground/50 dark:text-gray-400">Adicione seu cargo / função</span>}
              </p>

              {profile?.profileCompleted && (
                <span className="mt-3 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> Disponível para Trabalho
                </span>
              )}

              {/* Actions */}
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full mt-5 bg-card border border-black/10 hover:bg-surface-container-low dark:bg-card/40 text-primary dark:text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span> Editar Perfil
              </button>
            </div>

            {/* Sobre */}
            <div className="bg-card rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-base text-primary dark:text-white font-bold mb-3">Sobre</h3>
              {profile?.description ? (
                <p className="text-sm text-muted-foreground dark:text-gray-300 leading-relaxed">{profile.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground/50 dark:text-gray-400 italic">
                  Clique em &quot;Editar Perfil&quot; para adicionar sua descrição.
                </p>
              )}
            </div>

            {/* Contato */}
            <div className="bg-card rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-base text-primary dark:text-white font-bold mb-4">Contato</h3>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground dark:text-gray-300">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-muted-foreground/70 dark:text-gray-400">mail</span>
                  {profile?.contactEmail || <span className="italic text-muted-foreground/50 dark:text-gray-400">Não configurado</span>}
                </div>
              </div>
            </div>

            {/* Habilidades */}
            <div className="bg-card rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-base text-primary dark:text-white font-bold mb-4">Habilidades</h3>
              <div className="flex flex-wrap gap-2">
                {mySkills.length > 0 ? (
                  mySkills.map((s) => (
                    <span key={s} className="bg-primary/5 text-primary dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/10">
                      {s}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground/50 dark:text-gray-400 italic">Nenhuma skill configurada. Edite seu perfil para adicionar.</p>
                )}
              </div>
            </div>
          </aside>

          {/* ═══════════════════════════════════════════
              RIGHT CONTENT
              ═══════════════════════════════════════════ */}
          <div className="w-full lg:w-[70%] flex flex-col gap-6">

            {/* Onboarding Banner (if profile not completed) */}
            {(!profile || !profile.profileCompleted) && (
              <div className="bg-card rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-amber-200/60">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <span className="material-symbols-outlined text-[22px]">info</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-primary dark:text-white mb-1">Complete seu perfil</h3>
                    <p className="text-sm text-muted-foreground dark:text-gray-300 leading-relaxed">
                      Preencha os campos obrigatórios para que seu perfil apareça nas buscas e empresas possam te encontrar.
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-muted-foreground dark:text-gray-300">{completion.completed}/{completion.total} campos preenchidos</span>
                    <span className="text-secondary">{completion.percent}%</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all duration-500"
                      style={{ width: `${completion.percent}%` }}
                    />
                  </div>
                </div>

                {/* Checklist */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {completion.fields.map((field) => (
                    <div key={field.label} className={`flex items-center gap-2 text-xs ${field.done ? "text-emerald-600" : "text-muted-foreground/50 dark:text-gray-400"}`}>
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
                  Completar agora <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            )}

            {/* Projetos Finalizados */}
            <div className="bg-card rounded-3xl p-8 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-2">Projetos Finalizados</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-300 mb-6">{completedProjects.length} projeto(s)</p>

              {completedProjects.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="material-symbols-outlined text-[48px] text-muted-foreground/20 dark:text-gray-400 mb-3">work_history</span>
                  <p className="text-sm text-muted-foreground dark:text-gray-300">Nenhum projeto finalizado ainda.</p>
                  <p className="text-xs text-muted-foreground/60 dark:text-gray-400 mt-1">Projetos concluídos e aprovados aparecerão aqui.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {completedProjects.map((project) => (
                    <div key={project.proposalId} className="bg-emerald-50/40 border border-emerald-200/40 rounded-2xl p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-primary dark:text-white">{project.otherPartyName}</h4>
                          <p className="text-xs text-muted-foreground dark:text-gray-300 mt-0.5">
                            Concluído em {new Date(project.completedAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <span className="text-base font-bold text-emerald-700">
                          R$ {Number(project.price).toFixed(2)}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        Finalizado
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Propostas Recebidas */}
            <div className="bg-card rounded-3xl p-8 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-2">Propostas Recebidas</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-300 mb-6">{proposals.length} proposta(s) no total</p>

              {proposals.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="material-symbols-outlined text-[48px] text-muted-foreground/30 dark:text-gray-400 mb-3">inbox</span>
                  <p className="text-sm text-muted-foreground dark:text-gray-300">Nenhuma proposta recebida ainda.</p>
                  <p className="text-xs text-muted-foreground/60 dark:text-gray-400 mt-1">Complete seu perfil para aparecer nas buscas.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Pending first */}
                  {pendingProposals.map((p) => (
                    <div key={p.id} className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-base font-bold text-primary dark:text-white">R$ {Number(p.price).toFixed(2)}</span>
                        <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                          Pendente
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground dark:text-gray-300 line-clamp-2 mb-4">{p.message}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => respondProposal(p.id, "accept")} className="bg-secondary hover:bg-secondary/90 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                          <span className="material-symbols-outlined text-[16px]">check</span> Aceitar
                        </button>
                        <button onClick={() => respondProposal(p.id, "reject")} className="bg-transparent border border-error/30 text-error hover:bg-error/5 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                          <span className="material-symbols-outlined text-[16px]">close</span> Recusar
                        </button>
                      </div>
                    </div>
                  ))}
                  {/* Other proposals */}
                  {otherProposals.map((p) => (
                    <div key={p.id} className="bg-surface-container-low dark:bg-card/40 border border-black/[0.06] rounded-2xl p-5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-base font-bold text-primary dark:text-white">R$ {Number(p.price).toFixed(2)}</span>
                        <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wider ${
                          p.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>{p.status === "ACCEPTED" ? "Aceita" : p.status === "REJECTED" ? "Recusada" : p.status}</span>
                      </div>
                      <p className="text-sm text-muted-foreground dark:text-gray-300 line-clamp-2">{p.message}</p>
                      {p.status === "ACCEPTED" && (
                        <Link href="/app/messages" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-secondary hover:underline">
                          <span className="material-symbols-outlined text-[16px]">chat</span> Abrir Chat
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          EDIT PROFILE MODAL
          ═══════════════════════════════════════════ */}
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
              <h3 className="font-headline text-xl text-primary dark:text-white font-bold">Editar Perfil</h3>
              <button onClick={() => setShowEditModal(false)} className="text-muted-foreground dark:text-gray-300 hover:text-error transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <div className="flex justify-center mb-6">
              <Avatar className="w-20 h-20 shadow-md border-[3px] border-surface-container">
                <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                  {avatarInitial}
                </AvatarFallback>
              </Avatar>
            </div>

            <form id="profileForm" onSubmit={createOrUpdate} className="space-y-5 mb-8">
              {/* Name (Required) */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">
                  Nome <span className="text-error">*</span>
                </label>
                <input
                  value={profileName}
                  onChange={(e) => { setProfileName(e.target.value); setValidationErrors((v) => ({ ...v, name: false })); }}
                  maxLength={100}
                  className={`w-full rounded-xl border ${validationErrors.name ? "border-error" : "border-outline-variant/40"} bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 dark:text-gray-400 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary`}
                  placeholder="Seu nome completo"
                />
                {validationErrors.name && <p className="text-xs text-error mt-1">Campo obrigatório</p>}
              </div>

              {/* Headline (Required) */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">
                  Cargo / Função <span className="text-error">*</span>
                </label>
                <input
                  value={headline}
                  onChange={(e) => { setHeadline(e.target.value); setValidationErrors((v) => ({ ...v, headline: false })); }}
                  maxLength={150}
                  className={`w-full rounded-xl border ${validationErrors.headline ? "border-error" : "border-outline-variant/40"} bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 dark:text-gray-400 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary`}
                  placeholder="Ex.: Desenvolvedor Full Stack"
                />
                {validationErrors.headline && <p className="text-xs text-error mt-1">Campo obrigatório</p>}
              </div>

              {/* Description (Required) */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">
                  Descrição <span className="text-error">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setValidationErrors((v) => ({ ...v, description: false })); }}
                  rows={4}
                  className={`w-full rounded-xl border ${validationErrors.description ? "border-error" : "border-outline-variant/40"} bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 dark:text-gray-400 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary`}
                  placeholder="Fale sobre você, experiência e interesses..."
                />
                {validationErrors.description && <p className="text-xs text-error mt-1">Campo obrigatório</p>}
              </div>

              {/* Contact Email (Required) */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">
                  E-mail de Contato <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => { setContactEmail(e.target.value); setValidationErrors((v) => ({ ...v, contactEmail: false })); }}
                  className={`w-full rounded-xl border ${validationErrors.contactEmail ? "border-error" : "border-outline-variant/40"} bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 dark:text-gray-400 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary`}
                  placeholder="seuemail@gmail.com"
                />
                {validationErrors.contactEmail && <p className="text-xs text-error mt-1">Campo obrigatório</p>}
              </div>

            </form>

            {/* Skills Manager — Free text tags */}
            <div className="border-t border-black/[0.06] pt-6">
              <h4 className="font-headline text-base text-primary dark:text-white font-bold mb-2">
                Gerenciar Habilidades <span className="text-error">*</span>
              </h4>
              <p className="text-xs text-muted-foreground/60 dark:text-gray-400 mb-3">
                Digite uma habilidade e pressione <kbd className="px-1.5 py-0.5 bg-surface-container rounded text-[10px] font-mono">Enter</kbd> para adicionar.
              </p>
              {validationErrors.skills && (
                <p className="text-xs text-error mb-2">Adicione pelo menos uma habilidade.</p>
              )}

              {/* Selected skills as removable chips */}
              {mySkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {mySkills.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1.5 bg-secondary text-white pl-3 pr-1.5 py-1.5 rounded-full text-xs font-bold shadow-sm"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="w-5 h-5 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors"
                        title={`Remover ${s}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2.5">
                <span className="material-symbols-outlined text-[18px] text-muted-foreground/50 dark:text-gray-400">add</span>
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Ex.: React, TypeScript, Figma..."
                  className="w-full bg-transparent text-sm text-foreground dark:text-white outline-none placeholder:text-muted-foreground/40 dark:text-gray-400"
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
              form="profileForm"
              type="submit"
              disabled={saving}
              className="mt-8 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "Salvando..." : profile ? "Salvar Alterações" : "Criar Perfil"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
