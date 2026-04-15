"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LinkedInIcon, InstagramIcon } from "@/components/SocialIcons";
import { api, ApiError } from "@/lib/api";
import { getRoleFromToken } from "@/lib/auth";
import type { CompanyProfileResponse } from "@/lib/types";

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

  const emailName = typeof window !== "undefined" ? localStorage.getItem("pronnect_email")?.split("@")[0] || "" : "";
  const avatarUrl = profile?.id ? `https://i.pravatar.cc/150?u=${profile.id}` : `https://i.pravatar.cc/150?u=${emailName}`;
  const profileName = profile?.name || emailName || "Minha Empresa";
  const profileCompleted = !!profile?.name && !!profile?.description && !!profile?.contactEmail;

  useEffect(() => {
    if (role !== "COMPANY") {
      setLoading(false);
      return;
    }
    fetchProfile();
  }, [role]);

  async function fetchProfile() {
    try {
      const data = await api<CompanyProfileResponse>("/companies/me");
      setProfile(data);
      setName(data.name || "");
      setDescription(data.description || "");
      setContactEmail(data.contactEmail || "");
      setLocation(data.location || "");
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) {
        toast.error("Erro ao carregar dados da empresa.");
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
      <div className="mx-auto max-w-lg mt-20 p-8 text-center bg-white rounded-3xl shadow-sm border border-black/5">
        <span className="material-symbols-outlined text-[48px] text-error/80 mb-4 animate-bounce">lock</span>
        <h2 className="font-headline text-xl font-bold text-primary mb-2">Acesso Restrito</h2>
        <p className="text-on-surface-variant">Apenas contas do tipo EMPRESA podem acessar esta página.</p>
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
            <div className="bg-white rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-black/[0.04]">
              <div className="relative w-28 h-28 mb-5 rounded-full overflow-hidden border-[3px] border-white shadow-md">
                <Image src={avatarUrl} alt={profileName} fill className="object-cover" />
              </div>
              <h1 className="font-headline text-xl text-primary font-bold capitalize">{profileName}</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">{profile?.location || "Sede não informada"}</p>

              {profileCompleted && (
                <span className="mt-3 inline-flex items-center gap-1.5 bg-secondary/10 text-secondary text-[11px] font-bold px-3 py-1.5 rounded-full border border-secondary/20">
                  <span className="material-symbols-outlined text-[14px]">verified</span> Empresa Verificada
                </span>
              )}

              <div className="flex items-center gap-1 mt-4 mb-6 text-sm">
                <span className="text-amber-400 text-base">★★★★★</span>
                <span className="text-on-surface-variant text-xs ml-1">(0 avaliações de profissionais)</span>
              </div>

              {/* Actions */}
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full bg-white border border-black/10 hover:bg-surface-container-lowest text-primary font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span> Editar Empresa
              </button>
            </div>

            {/* Sobre */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-black/[0.04]">
              <h3 className="font-headline text-base text-primary font-bold mb-3">Sobre a Empresa</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {profile?.description || "Clique em \"Editar Empresa\" para adicionar a descrição, missão e visão da sua empresa."}
              </p>
            </div>

            {/* Contato */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-black/[0.04]">
              <h3 className="font-headline text-base text-primary font-bold mb-4">Contato Oficial</h3>
              <div className="flex flex-col gap-3 text-sm text-on-surface-variant">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant/70">mail</span>
                  {profile?.contactEmail || "Não configurado"}
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant/70">location_on</span>
                  {profile?.location || "Não configurado"}
                </div>
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-black/[0.04]">
              <h3 className="font-headline text-base text-primary font-bold mb-4">Redes Sociais</h3>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-lg bg-surface-container-lowest border border-black/[0.06] flex items-center justify-center hover:bg-surface-container-low text-primary transition-colors"><LinkedInIcon size={16} /></a>
                <a href="#" className="w-9 h-9 rounded-lg bg-surface-container-lowest border border-black/[0.06] flex items-center justify-center hover:bg-surface-container-low text-primary transition-colors"><InstagramIcon size={16} /></a>
              </div>
            </div>
          </aside>

          {/* ═══════════════════════════════════════════
              RIGHT CONTENT
              ═══════════════════════════════════════════ */}
          <div className="w-full lg:w-[70%] flex flex-col gap-6">

            {/* Onboarding Banner (if profile not completed) */}
            {!profileCompleted && (
              <div className="bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-amber-200/60 flex items-start gap-4">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <span className="material-symbols-outlined text-[22px]">domain</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-primary mb-1">Complete o perfil da Empresa</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
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

            {/* Projetos em Andamento / Vagas Fechadas (Placeholders to match Professional style) */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-black/[0.04]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-headline text-lg text-primary font-bold">Projetos Executados</h3>
                 <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full">Histórico</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { title: "E-commerce B2B Redesign", desc: "Redesign completo da plataforma de compras corporativa com foco em conversão.", prof: "Gabriel S." },
                  { title: "App Mobile de Logística", desc: "Aplicativo para rastreamento de frotas e controle de estoque em tempo real.", prof: "Marina F." },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col gap-3 group cursor-pointer">
                    <div className="w-full h-44 rounded-2xl overflow-hidden relative border border-black/[0.06] shadow-sm bg-surface-container-lowest">
                      <Image src={`https://picsum.photos/seed/company_${i + 1}/500/300`} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-primary text-sm transition-colors inline-flex items-center gap-1">
                        {item.title}
                      </h4>
                      <p className="text-[13px] text-on-surface-variant leading-relaxed mt-1 line-clamp-2">
                        {item.desc}
                      </p>
                      <p className="text-[11px] font-bold text-secondary mt-2">
                        Desenvolvido por {item.prof}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Atividade Recente */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-black/[0.04]">
              <h3 className="font-headline text-lg text-primary font-bold mb-6">Atividade Recente</h3>
              <div className="flex flex-col items-center py-10 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-black/10">
                 <span className="material-symbols-outlined text-[48px] text-secondary mb-4 opacity-40">work_history</span>
                 <p className="text-sm font-bold text-primary mb-1">Nenhuma contratação finalizada ainda.</p>
                 <p className="text-sm text-on-surface-variant max-w-sm">Quando sua empresa começar a enviar propostas e finalizar projetos com profissionais da base, o histórico aparecerá aqui.</p>
                 <Link href="/app/professionals" className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-secondary px-6 text-sm font-bold text-white transition-colors hover:bg-secondary/90">
                    Buscar Profissionais
                 </Link>
              </div>
            </div>

            {/* Avaliações */}
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-black/[0.04]">
              <h3 className="font-headline text-lg text-primary font-bold mb-5">Avaliações de Profissionais</h3>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-amber-400 text-lg">★★★★★</span>
                <span className="text-on-surface-variant text-sm">(0 avaliações)</span>
              </div>
              <div className="flex flex-col items-center py-6 text-center">
                <span className="material-symbols-outlined text-[40px] text-on-surface-variant/25 mb-2">rate_review</span>
                <p className="text-sm text-on-surface-variant">Sua empresa ainda não possui avaliações. Conclua projetos para recebê-las!</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          EDIT PROFILE MODAL
          ═══════════════════════════════════════════ */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4 backdrop-blur-[2px]" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-black/[0.05] relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline text-xl text-primary font-bold">Dados da Empresa</h3>
              <button onClick={() => setShowEditModal(false)} className="text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            <form onSubmit={createOrUpdate} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-on-surface">Nome da Empresa</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={150}
                  className="w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Nome fantasia ou razão social"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-on-surface">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Fale sobre o que a empresa faz..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-on-surface">E-mail Comercial</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="contato@suaempresa.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-on-surface">Sede (Localização)</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary"
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
