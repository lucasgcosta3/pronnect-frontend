"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LinkedInIcon, InstagramIcon } from "@/components/SocialIcons";
import { ReviewSection } from "@/components/ReviewSection";
import { api, ApiError, avatarUrl as buildAvatarUrl, resolveBackendUrl } from "@/lib/api";
import { getRoleFromToken, getToken, decodeJwtPayload } from "@/lib/auth";
import type {
  CompanyProfileResponse,
  ProfileSummaryResponse,
  ConversationResponse,
  ServiceContractResponse,
} from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ZoomableAvatar } from "@/components/ZoomableAvatar";

export default function CompanyOnboardingPage() {
  const router = useRouter();
  const role = getRoleFromToken();

  const [profile, setProfile] = useState<CompanyProfileResponse | null>(null);
  const [profileSummary, setProfileSummary] = useState<ProfileSummaryResponse | null>(null);
  const [avatarVersion, setAvatarVersion] = useState<number>(Date.now());
  const [recentActivities, setRecentActivities] = useState<
    {
      id: string;
      otherPartyName: string;
      status: string;
      price: number;
      date: string;
    }[]
  >([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
  const resolvedAvatarUrl = buildAvatarUrl(profile?.avatarUrl, avatarVersion);

  useEffect(() => {
    if (role !== "COMPANY") {
      setLoading(false);
      return;
    }
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    if (!selectedAvatar) {
      setAvatarPreview(null);
      return;
    }
    const previewUrl = URL.createObjectURL(selectedAvatar);
    setAvatarPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [selectedAvatar]);

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

  useEffect(() => {
    if (!profile?.accountId) {
      setProfileSummary(null);
      setRecentActivities([]);
      setActivityLoading(false);
      return;
    }

    api<ProfileSummaryResponse>(`/contracts/account/${profile.accountId}/summary`)
      .then(setProfileSummary)
      .catch(() => setProfileSummary(null));

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
              otherPartyName: conv?.otherPartyName || "Profissional",
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
  }, [profile]);

  async function createOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("O nome da empresa é obrigatório.");

    setSaving(true);
    try {
      const isUpdate = !!profile;
      const body = { name, description, contactEmail, location, avatarUrl: profile?.avatarUrl || null };

      if (!profile) {
        try {
          await api<CompanyProfileResponse>("/companies", { method: "POST", json: body });
        } catch (err) {
          if (err instanceof ApiError && (err.status === 400 || err.status === 409)) {
            await api<CompanyProfileResponse>("/companies", { method: "PUT", json: body });
          } else {
            throw err;
          }
        }
      } else {
        await api<CompanyProfileResponse>("/companies", { method: "PUT", json: body });
      }

      // Upload avatar if selected
      if (selectedAvatar) {
        const formData = new FormData();
        formData.append("file", selectedAvatar);
        await api<CompanyProfileResponse>("/companies/me/avatar", {
          method: "POST",
          body: formData,
        });
      }

      const res = await api<CompanyProfileResponse>("/companies/me");
      setProfile(res);

      if (res.avatarUrl) {
        const newVersion = Date.now();
        setAvatarVersion(newVersion);
        const resolvedUrl = resolveBackendUrl(res.avatarUrl);
        if (resolvedUrl) {
          const bustedUrl = `${resolvedUrl}?v=${newVersion}`;
          window.localStorage.setItem("pronnect-avatar-url", bustedUrl);
          window.dispatchEvent(new Event("pronnect-avatar-updated"));
        }
      }

      toast.success(isUpdate ? "Perfil da empresa atualizado!" : "Perfil criado com sucesso!");
      setSelectedAvatar(null);
      setAvatarPreview(null);
      setShowEditModal(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao salvar perfil. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  // ─── Guards ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-secondary border-t-transparent" />
      </div>
    );
  }

  if (role !== "COMPANY") {
    return (
      <div className="mx-auto max-w-lg mt-20 p-8 text-center bg-card rounded-3xl shadow-sm border border-border">
        <span className="material-symbols-outlined text-[48px] text-destructive/80 mb-4">lock</span>
        <h2 className="font-headline text-xl font-bold text-primary dark:text-white mb-2">
          Acesso Restrito
        </h2>
        <p className="text-muted-foreground">
          Apenas contas do tipo Empresa podem acessar esta página.
        </p>
      </div>
    );
  }

  const activityStatusLabel = (status: string) => {
    if (status === "VALIDATED") return "Concluído";
    if (status === "COMPLETED") return "Aguardando Validação";
    return "Em andamento";
  };

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
                alt={profileName}
                fallbackText={avatarInitial}
                className="w-28 h-28 mb-5"
                fallbackClassName="text-4xl"
              />
              <h1 className="font-headline text-xl text-primary dark:text-white font-bold capitalize">
                {profileName}
              </h1>
              <p className="text-sm text-muted-foreground dark:text-gray-300 mt-0.5">
                {profile?.location || "Sede não informada"}
              </p>

              {profileCompleted && (
                <span className="mt-3 inline-flex items-center gap-1.5 bg-secondary/10 text-secondary text-[11px] font-bold px-3 py-1.5 rounded-full border border-secondary/20">
                  <span className="material-symbols-outlined text-[14px]">verified</span> Empresa
                  Verificada
                </span>
              )}

              <button
                onClick={() => setShowEditModal(true)}
                className="w-full mt-5 bg-card border border-black/10 hover:bg-muted dark:bg-card/40 text-primary dark:text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span> Editar Perfil
              </button>
            </div>

            {/* Project summary */}
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
              <p className="text-sm text-muted-foreground dark:text-gray-300 leading-relaxed">
                {profile?.description || (
                  <span className="italic text-muted-foreground/50">
                    Clique em &quot;Editar Perfil&quot; para adicionar a descrição da sua empresa.
                  </span>
                )}
              </p>
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
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px] text-muted-foreground/60">
                    location_on
                  </span>
                  {profile?.location || (
                    <span className="italic text-muted-foreground/40">Não configurado</span>
                  )}
                </div>
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="bg-card rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
              <h3 className="font-headline text-base text-primary dark:text-white font-bold mb-4">
                Redes Sociais
              </h3>
              <div className="flex gap-3">
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="w-9 h-9 rounded-lg bg-muted border border-black/[0.06] flex items-center justify-center hover:bg-muted/80 text-primary dark:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <LinkedInIcon size={16} />
                </a>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="w-9 h-9 rounded-lg bg-muted border border-black/[0.06] flex items-center justify-center hover:bg-muted/80 text-primary dark:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <InstagramIcon size={16} />
                </a>
              </div>
            </div>
          </aside>

          {/* ═══════════════ RIGHT CONTENT ═══════════════ */}
          <div className="w-full lg:w-[70%] flex flex-col gap-6">
            {/* Onboarding Banner */}
            {!profileCompleted && (
              <div className="bg-card rounded-3xl p-6 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-amber-200/60">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <span className="material-symbols-outlined text-[22px]">domain</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-primary dark:text-white mb-1">
                      Complete o perfil da Empresa
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-gray-300 leading-relaxed">
                      Preencha o nome oficial, descrição, e-mail de contato e localização para
                      transmitir mais credibilidade aos profissionais.
                    </p>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="mt-3 text-sm font-bold text-secondary hover:underline inline-flex items-center gap-1"
                    >
                      Completar agora{" "}
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
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
                  {recentActivities.map((activity) => (
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
                          {activityStatusLabel(activity.status)}
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
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-10 text-center bg-muted/30 rounded-2xl border border-dashed border-black/10">
                  <span className="material-symbols-outlined text-[48px] text-secondary opacity-30 mb-4">
                    work_history
                  </span>
                  <p className="text-sm font-bold text-primary dark:text-white mb-1">
                    Nenhuma atividade recente encontrada.
                  </p>
                  <p className="text-sm text-muted-foreground dark:text-gray-300 max-w-sm">
                    Conclua projetos para ver o histórico atualizado aqui.
                  </p>
                  <Link
                    href="/app/professionals"
                    className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-secondary px-6 text-sm font-bold text-white transition-colors hover:bg-secondary/90"
                  >
                    Buscar Profissionais
                  </Link>
                </div>
              )}
            </div>

            {/* Avaliações */}
            {profile?.accountId ? (
              <ReviewSection accountId={profile.accountId} />
            ) : (
              <div className="bg-card rounded-3xl p-8 shadow-[0_4px_24px_rgb(0,0,0,0.04)] border border-border dark:shadow-none">
                <h3 className="font-headline text-lg text-primary dark:text-white font-bold mb-5">
                  Avaliações de Profissionais
                </h3>
                <div className="flex flex-col items-center py-8 text-center bg-muted/30 rounded-2xl border border-dashed border-black/10">
                  <span className="material-symbols-outlined text-[40px] text-muted-foreground/25 mb-3">
                    rate_review
                  </span>
                  <p className="text-sm text-muted-foreground dark:text-gray-300">
                    Sua empresa ainda não possui avaliações. Conclua projetos para recebê-las!
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
                Dados da Empresa
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
                    alt={profileName}
                  />
                ) : (
                  <AvatarFallback className="bg-primary text-white text-2xl font-bold">
                    {avatarInitial}
                  </AvatarFallback>
                )}
              </Avatar>
              <label
                htmlFor="company-avatar-upload"
                className="group flex w-full max-w-xs cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border border-border/60 bg-card px-5 py-4 text-center text-sm text-muted-foreground transition hover:border-primary hover:bg-muted hover:text-primary"
              >
                <span className="material-symbols-outlined text-4xl transition group-hover:text-primary">
                  photo_camera
                </span>
                <span className="font-medium">
                  {selectedAvatar ? selectedAvatar.name : "Escolher logotipo / foto"}
                </span>
                <span className="text-xs text-muted-foreground/50">JPG, PNG ou WebP • Máx. 5 MB</span>
                <input
                  id="company-avatar-upload"
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

            <form onSubmit={createOrUpdate} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">
                  Nome da Empresa <span className="text-destructive">*</span>
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={150}
                  className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Nome fantasia ou razão social"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  placeholder="Fale sobre o que a empresa faz..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">
                  E-mail Comercial
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="contato@suaempresa.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground dark:text-white">
                  Sede / Localização
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-card px-4 py-3 text-sm text-foreground dark:text-white outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="Ex.: São Paulo, SP — ou Remoto"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="mt-6 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition-all hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
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