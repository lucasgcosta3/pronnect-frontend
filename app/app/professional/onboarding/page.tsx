"use client";

import type {
  ProfessionalProfileResponse,
  ProposalResponse,
  ServiceContractResponse,
  ConversationResponse,
} from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import { FormEvent, useEffect, useState, useCallback, useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

// ─── Helper: profile photo from localStorage ───
const PHOTO_KEY = "pronnect_profile_photo";

function getSavedPhoto(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PHOTO_KEY);
}
function savePhoto(dataUrl: string) {
  localStorage.setItem(PHOTO_KEY, dataUrl);
}

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
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // Completed projects
  const [completedProjects, setCompletedProjects] = useState<
    { proposalId: string; otherPartyName: string; price: number; completedAt: string }[]
  >([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Load profile data ───
  const loadProfile = useCallback(async () => {
    try {
      const me = await api<ProfessionalProfileResponse>("/professionals/me");
      setProfile(me);
      setProfileName(me.name || "");
      setHeadline(me.headline || "");
      setDescription(me.description || "");
      setContactEmail(me.contactEmail || "");

      setMySkills(me.skills || []);
    } catch {
      // not created yet
    }

    try {
    const skills = await api<{ id: string; name: string }[]>("/skills");
    setAvailableSkills(skills);
  } catch (err) {
    console.error("Erro ao carregar skills:", err);
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
  }, []);

  useEffect(() => {
    if (role !== "PROFESSIONAL") {
      setLoading(false);
      return;
    }
    loadProfile();
    setProfilePhoto(getSavedPhoto());
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
    // 1. Salvar campos do perfil
    if (!profile) {
      await api("/professionals", {
        method: "POST",
        json: { name: profileName, headline, description, contactEmail },
      });
    } else {
      await api("/professionals", {
        method: "PUT",
        json: { name: profileName, headline, description, contactEmail },
      });
    }

    // 2. Resolver nomes de skill → UUIDs
    const skillsNoApi = profile?.skills ?? [];             // string[] de nomes
    const skillsParaAdicionar = mySkills.filter((s) => !skillsNoApi.includes(s));
    const skillsParaRemover   = skillsNoApi.filter((s) => !mySkills.includes(s));

    for (const skillName of skillsParaAdicionar) {
      const found = availableSkills.find(
        (s) => s.name.toLowerCase() === skillName.toLowerCase()
      );
      if (!found) continue; // skill digitada não existe no catálogo
      try {
        await api("/professionals/me/skills", {   // ← rota correta
          method: "POST",
          json: { skillId: found.id },            // ← payload correto
        });
      } catch { /* ignora duplicata */ }
    }

    for (const skillName of skillsParaRemover) {
      const found = availableSkills.find(
        (s) => s.name.toLowerCase() === skillName.toLowerCase()
      );
      if (!found) continue;
      try {
        await api(`/professionals/me/skills/${found.id}`, {  // ← UUID no path
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

  // ─── Photo upload ───
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo: 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      savePhoto(result);
      setProfilePhoto(result);
      toast.success("Foto de perfil atualizada!");
    };
    reader.readAsDataURL(file);
  }


  // ─── Completion info ───
  const completion = getCompletionInfo(profile, mySkills.length, profileName);

  // ─── Display name ───
  const displayName = profileName || profile?.name || "Profissional";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  if (role !== "PROFESSIONAL") {
    return <p className="text-on-surface-variant text-center mt-20">Acesso negado.</p>;
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
            <div className="bg-white rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-black/[0.04]">
              {/* Avatar with upload */}
              <div className="relative w-28 h-28 mb-5 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {profilePhoto ? (
                  <div className="w-28 h-28 rounded-full overflow-hidden border-[3px] border-white shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profilePhoto} alt={displayName} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <Avatar className="w-28 h-28 shadow-md border-[3px] border-white">
                    <AvatarFallback className="bg-primary text-white text-4xl font-bold">
                      {avatarInitial}
                    </AvatarFallback>
                  </Avatar>
                )}
                {/* Camera overlay */}
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[24px] opacity-0 group-hover:opacity-100 transition-opacity">
                    photo_camera
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              <h1 className="font-headline text-xl text-primary font-bold capitalize">{displayName}</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {profile?.headline || <span className="italic text-on-surface-variant/50">Adicione seu cargo / função</span>}
              </p>

              {profile?.profileCompleted && (
                <span className="mt-3 inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-3 py-1.5 rounded-full border border-emerald-200">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> Disponível para Trabalho
                </span>
              )}

              {/* Actions */}
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full mt-5 bg-white border border-black/10 hover:bg-surface-container-lowest text-primary font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span> Editar Perfil
              </button>
            </div>

            {/* Sobre */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-black/[0.04]">
              <h3 className="font-headline text-base text-primary font-bold mb-3">Sobre</h3>
              {profile?.description ? (
                <p className="text-sm text-on-surface-variant leading-relaxed">{profile.description}</p>
              ) : (
                <p className="text-sm text-on-surface-variant/50 italic">
                  Clique em &quot;Editar Perfil&quot; para adicionar sua descrição.
                </p>
              )}
            </div>

            {/* Contato */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-black/[0.04]">
              <h3 className="font-headline text-base text-primary font-bold mb-4">Contato</h3>
              <div className="flex flex-col gap-3 text-sm text-on-surface-variant">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant/70">mail</span>
                  {profile?.contactEmail || <span className="italic text-on-surface-variant/50">Não configurado</span>}
                </div>
              </div>
            </div>

            {/* Habilidades */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-black/[0.04]">
              <h3 className="font-headline text-base text-primary font-bold mb-4">Habilidades</h3>
              <div className="flex flex-wrap gap-2">
                {mySkills.length > 0 ? (
                  mySkills.map((s) => (
                    <span key={s} className="bg-primary/5 text-primary px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/10">
                      {s}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant/50 italic">Nenhuma skill configurada. Edite seu perfil para adicionar.</p>
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
              <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-amber-200/60">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <span className="material-symbols-outlined text-[22px]">info</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-primary mb-1">Complete seu perfil</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      Preencha os campos obrigatórios para que seu perfil apareça nas buscas e empresas possam te encontrar.
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-on-surface-variant">{completion.completed}/{completion.total} campos preenchidos</span>
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
                    <div key={field.label} className={`flex items-center gap-2 text-xs ${field.done ? "text-emerald-600" : "text-on-surface-variant/50"}`}>
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
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-black/[0.04]">
              <h3 className="font-headline text-lg text-primary font-bold mb-2">Projetos Finalizados</h3>
              <p className="text-sm text-on-surface-variant mb-6">{completedProjects.length} projeto(s)</p>

              {completedProjects.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20 mb-3">work_history</span>
                  <p className="text-sm text-on-surface-variant">Nenhum projeto finalizado ainda.</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">Projetos concluídos e aprovados aparecerão aqui.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {completedProjects.map((project) => (
                    <div key={project.proposalId} className="bg-emerald-50/40 border border-emerald-200/40 rounded-2xl p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-sm font-bold text-primary">{project.otherPartyName}</h4>
                          <p className="text-xs text-on-surface-variant mt-0.5">
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
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-black/[0.04]">
              <h3 className="font-headline text-lg text-primary font-bold mb-2">Propostas Recebidas</h3>
              <p className="text-sm text-on-surface-variant mb-6">{proposals.length} proposta(s) no total</p>

              {proposals.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-3">inbox</span>
                  <p className="text-sm text-on-surface-variant">Nenhuma proposta recebida ainda.</p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">Complete seu perfil para aparecer nas buscas.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {/* Pending first */}
                  {pendingProposals.map((p) => (
                    <div key={p.id} className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-base font-bold text-primary">R$ {Number(p.price).toFixed(2)}</span>
                        <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wider bg-amber-100 text-amber-700 border border-amber-200">
                          Pendente
                        </span>
                      </div>
                      <p className="text-sm text-on-surface-variant line-clamp-2 mb-4">{p.message}</p>
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
                    <div key={p.id} className="bg-surface-container-lowest border border-black/[0.06] rounded-2xl p-5">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-base font-bold text-primary">R$ {Number(p.price).toFixed(2)}</span>
                        <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full tracking-wider ${
                          p.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>{p.status === "ACCEPTED" ? "Aceita" : p.status === "REJECTED" ? "Recusada" : p.status}</span>
                      </div>
                      <p className="text-sm text-on-surface-variant line-clamp-2">{p.message}</p>
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
          className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4 backdrop-blur-[2px]"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-black/[0.05] relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline text-xl text-primary font-bold">Editar Perfil</h3>
              <button onClick={() => setShowEditModal(false)} className="text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* Photo upload in modal */}
            <div className="flex justify-center mb-6">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {profilePhoto ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-[3px] border-surface-container shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profilePhoto} alt="Perfil" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <Avatar className="w-20 h-20 shadow-md border-[3px] border-surface-container">
                    <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                      {avatarInitial}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[20px] opacity-0 group-hover:opacity-100 transition-opacity">
                    photo_camera
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-center text-on-surface-variant/60 mb-6">Clique na foto para alterar</p>

            <form onSubmit={createOrUpdate} className="space-y-5 mb-8">
              {/* Name (Required) */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-on-surface">
                  Nome <span className="text-error">*</span>
                </label>
                <input
                  value={profileName}
                  onChange={(e) => { setProfileName(e.target.value); setValidationErrors((v) => ({ ...v, name: false })); }}
                  maxLength={100}
                  className={`w-full rounded-xl border ${validationErrors.name ? "border-error" : "border-outline-variant/40"} bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary`}
                  placeholder="Seu nome completo"
                />
                {validationErrors.name && <p className="text-xs text-error mt-1">Campo obrigatório</p>}
              </div>

              {/* Headline (Required) */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-on-surface">
                  Cargo / Função <span className="text-error">*</span>
                </label>
                <input
                  value={headline}
                  onChange={(e) => { setHeadline(e.target.value); setValidationErrors((v) => ({ ...v, headline: false })); }}
                  maxLength={150}
                  className={`w-full rounded-xl border ${validationErrors.headline ? "border-error" : "border-outline-variant/40"} bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary`}
                  placeholder="Ex.: Desenvolvedor Full Stack"
                />
                {validationErrors.headline && <p className="text-xs text-error mt-1">Campo obrigatório</p>}
              </div>

              {/* Description (Required) */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-on-surface">
                  Descrição <span className="text-error">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setValidationErrors((v) => ({ ...v, description: false })); }}
                  rows={4}
                  className={`w-full rounded-xl border ${validationErrors.description ? "border-error" : "border-outline-variant/40"} bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary`}
                  placeholder="Fale sobre você, experiência e interesses..."
                />
                {validationErrors.description && <p className="text-xs text-error mt-1">Campo obrigatório</p>}
              </div>

              {/* Contact Email (Required) */}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-on-surface">
                  E-mail de Contato <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => { setContactEmail(e.target.value); setValidationErrors((v) => ({ ...v, contactEmail: false })); }}
                  className={`w-full rounded-xl border ${validationErrors.contactEmail ? "border-error" : "border-outline-variant/40"} bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary`}
                  placeholder="seuemail@gmail.com"
                />
                {validationErrors.contactEmail && <p className="text-xs text-error mt-1">Campo obrigatório</p>}
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Salvando..." : profile ? "Salvar Alterações" : "Criar Perfil"}
              </button>
            </form>

            {/* Skills Manager — Free text tags */}
            <div className="border-t border-black/[0.06] pt-6">
              <h4 className="font-headline text-base text-primary font-bold mb-2">
                Gerenciar Habilidades <span className="text-error">*</span>
              </h4>
              <p className="text-xs text-on-surface-variant/60 mb-3">
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
              <div className="flex items-center gap-2 rounded-xl bg-[#f0f2f5] px-3 py-2.5">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50">add</span>
                <input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Ex.: React, TypeScript, Figma..."
                  className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
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
          </div>
        </div>
      )}
    </>
  );
}
