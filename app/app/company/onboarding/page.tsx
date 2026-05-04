"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LinkedInIcon, InstagramIcon } from "@/components/SocialIcons";
import { api, ApiError } from "@/lib/api";
import { getRoleFromToken, getToken, decodeJwtPayload } from "@/lib/auth";
import type { CompanyProfileResponse } from "@/lib/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const role = getRoleFromToken();

  const [profile, setProfile] = useState<CompanyProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [location, setLocation] = useState("");

  const token = typeof window !== "undefined" ? getToken() : null;
  const payload = token ? decodeJwtPayload(token) : null;
  const tokenName = payload?.name || payload?.fullName || "";
  const emailName = payload?.sub ? payload.sub.split("@")[0] : "";
  const profileName = profile?.name || tokenName || emailName || "Minha Empresa";
  const avatarInitial = profileName.charAt(0).toUpperCase();
  const profileCompleted = !!profile?.name && !!profile?.description && !!profile?.contactEmail;

  useEffect(() => {
    if (role !== "COMPANY") {
      setLoading(false);
      return;
    }
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  async function fetchProfile() {
    try {
      const data = await api<CompanyProfileResponse>("/companies/me");
      setProfile(data);
      setName(data.name || tokenName);
      setDescription(data.description || "");
      setContactEmail(data.contactEmail || payload?.sub || "");
      setLocation(data.location || "");
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) {
        toast.error("Erro ao carregar dados da empresa.");
      } else {
        setName(tokenName);
        setContactEmail(payload?.sub || "");
      }
    } finally {
      setLoading(false);
    }
  }

  async function createOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("O nome é obrigatório!");
    
    setSaving(true);
    try {
      const isUpdate = !!profile;
      const method = isUpdate ? "PUT" : "POST";
      const res = await api<CompanyProfileResponse>("/companies", {
        method,
        json: { name, description, contactEmail, location },
      });
      setProfile(res);
      toast.success(isUpdate ? "Perfil da empresa atualizado!" : "Conta de empresa criada com sucesso!");
      setShowEditModal(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
      </div>
    );
  }

  if (role !== "COMPANY") {
    return (
      <div className="mx-auto max-w-lg mt-20 p-8 text-center bg-card rounded-3xl shadow-sm border border-border dark:shadow-none">
        <span className="material-symbols-outlined text-[48px] text-error/80 mb-4 animate-bounce">lock</span>
        <h2 className="font-headline text-xl font-bold text-primary dark:text-white mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground dark:text-gray-300">Apenas contas do tipo EMPRESA podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-6xl px-4 pb-20 content-fade-in">
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
              <h1 className="font-headline text-xl text-primary dark:text-white font-bold capitalize">{profileName}</h1>
              <p className="text-sm text-muted-foreground dark:text-gray-300 mt-0.5">{profile?.location || "Sede não informada"}</p>

              {profileCompleted && (
                <span className="mt-3 inline-flex items-center gap-1.5 bg-secondary/10 text-secondary text-[11px] font-bold px-3 py-1.5 rounded-full border border-secondary/20">
                  <span className="material-symbols-outlined text-[14px]">verified</span> Empresa Verificada
                </span>
              )}

              <div className="flex items-center gap-1 mt-4 mb-6 text-sm">
                <span className="text-amber-400 text-base">★★★★★</span>
                <span className="text-muted-foreground dark:text-gray-300 text-xs ml-1">(0 avaliações de profissionais)</span>
              </div>

              {/* Actions */}
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full bg-card border border-black/10 hover:bg-surface-container-low dark:bg-card/40 text-primary dark:text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span> Editar Perfil
              </button>
            </div>

            {/* Sobre */}
            <div className="bg-card rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-base text-primary dark:text-white font-bold mb-3">Sobre</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-300 leading-relaxed">
                {profile?.description || "Clique em \"Editar Empresa\" para adicionar a descrição, missão e visão da sua empresa."}
              </p>
            </div>

            {/* Contato */}
            <div className="bg-card rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-base text-primary dark:text-white font-bold mb-4">Contato</h3>
              <div className="flex flex-col gap-3 text-sm text-muted-foreground dark:text-gray-300">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-muted-foreground/70 dark:text-gray-400">mail</span>
                  {profile?.contactEmail || "Não configurado"}
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-muted-foreground/70 dark:text-gray-400">location_on</span>
                  {profile?.location || "Não configurado"}
                </div>
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="bg-card rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-base text-primary dark:text-white font-bold mb-4">Redes Sociais</h3>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-lg bg-surface-container-low dark:bg-card/40 border border-black/[0.06] flex items-center justify-center hover:bg-surface-container-low text-primary dark:text-white transition-colors"><LinkedInIcon size={16} /></a>
                <a href="#" className="w-9 h-9 rounded-lg bg-surface-container-low dark:bg-card/40 border border-black/[0.06] flex items-center justify-center hover:bg-surface-container-low text-primary dark:text-white transition-colors"><InstagramIcon size={16} /></a>
              </div>
            </div>
          </aside>

          {/* ═══════════════════════════════════════════
              RIGHT CONTENT
              ═══════════════════════════════════════════ */}
          <div className="w-full lg:w-[70%] flex flex-col gap-6">

            {/* Onboarding Banner (if profile not completed) */}
            {!profileCompleted && (
              <div className="bg-card rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-amber-200/60 flex items-start gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <span className="material-symbols-outlined text-[22px]">domain</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-primary dark:text-white mb-1">Complete o perfil da Empresa</h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-300 leading-relaxed">
                    Preencha o nome oficial, descrição, e-mail de contato e localização para passar mais credibilidade aos profissionais.
                  </p>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="mt-3 text-sm font-bold text-secondary hover:underline inline-flex items-center gap-1"
                  >
                    Completar agora <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}

            {/* Atividade Recente */}
            <div className="bg-card rounded-3xl p-8 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-6">Atividade Recente</h3>
              <div className="flex flex-col items-center py-10 text-center bg-surface-container-low dark:bg-card/40 rounded-2xl border border-dashed border-black/10">
                 <span className="material-symbols-outlined text-[48px] text-secondary mb-4 opacity-40">work_history</span>
                 <p className="text-sm font-bold text-primary dark:text-white mb-1">Nenhuma contratação finalizada ainda.</p>
                 <p className="text-sm text-muted-foreground dark:text-gray-300 max-w-sm">Quando sua empresa começar a enviar propostas e finalizar projetos com profissionais da base, o histórico aparecerá aqui.</p>
                 <Link href="/app/professionals" className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-secondary px-6 text-sm font-bold text-white transition-colors hover:bg-secondary/90">
                    Buscar Profissionais
                 </Link>
              </div>
            </div>

            {/* Avaliações */}
            <div className="bg-card rounded-3xl p-8 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-5">Avaliações de Profissionais</h3>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-amber-400 text-lg">★★★★★</span>
                <span className="text-muted-foreground dark:text-gray-300 text-sm">(0 avaliações)</span>
              </div>
              <div className="flex flex-col items-center py-6 text-center">
                <span className="material-symbols-outlined text-[40px] text-muted-foreground/25 dark:text-gray-400 mb-2">rate_review</span>
                <p className="text-sm text-muted-foreground dark:text-gray-300">Sua empresa ainda não possui avaliações. Conclua projetos para recebê-las!</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          EDIT PROFILE MODAL
          ═══════════════════════════════════════════ */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-start justify-center pt-16 pb-10 px-4 backdrop-blur-[2px] overflow-y-auto" onClick={() => setShowEditModal(false)}>
          <div className="bg-card rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-border dark:shadow-none relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline text-xl text-primary dark:text-white font-bold">Dados da Empresa</h3>
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

            <form onSubmit={createOrUpdate} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">Nome da Empresa</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={150}
                  className="w-full rounded-xl border border-outline-variant/40 bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 dark:text-gray-400 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Nome fantasia ou razão social"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-outline-variant/40 bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 dark:text-gray-400 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Fale sobre o que a empresa faz..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">E-mail Comercial</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 dark:text-gray-400 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="contato@suaempresa.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">Sede (Localização)</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 dark:text-gray-400 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Ex.: São Paulo, SP (ou Remoto)"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? "Salvando..." : profile ? "Salvar Alterações" : "Criar Perfil"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
