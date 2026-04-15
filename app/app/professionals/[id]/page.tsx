"use client";

import type { ProfessionalProfileResponse } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { getRoleFromToken } from "@/lib/auth";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { ProposalResponse } from "@/lib/types";

// ─── Example profiles (same as in search) ───
interface ExampleProfile extends ProfessionalProfileResponse {
  photoUrl: string;
}

const EXAMPLE_PROFILES_LIST: ExampleProfile[] = [
  {
    id: "example-1",
    name: "Ana Carolina Silva",
    headline: "Desenvolvedora Full Stack",
    description: "Especialista em React, Node.js e TypeScript com 5 anos de experiência construindo aplicações web de alta performance. Apaixonada por interfaces modernas, arquitetura limpa e APIs escaláveis. Já atuei em projetos de e-commerce com +100k usuários, fintechs (processamento de pagamentos) e plataformas SaaS B2B. Certificação AWS Solutions Architect e experiência com metodologias ágeis (Scrum/Kanban).",
    contactEmail: "ana.silva@email.com",
    profileCompleted: true,
    skills: ["React", "TypeScript", "Node.js", "Next.js", "PostgreSQL", "Docker", "AWS"],
    createdAt: "2025-01-15T10:00:00Z",
    photoUrl: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: "example-2",
    name: "Rafael Mendes",
    headline: "Designer UI/UX Sênior",
    description: "Designer com mais de 7 anos de experiência criando interfaces digitais que encantam e convertem. Especializado em design systems escaláveis, prototipagem de alta fidelidade no Figma e pesquisa de usuário quantitativa e qualitativa. Foco em acessibilidade (WCAG 2.1) e experiência premium. Portfolio inclui projetos para Nubank, iFood, Ambev e diversas startups do ecossistema brasileiro.",
    contactEmail: "rafael.mendes@email.com",
    profileCompleted: true,
    skills: ["Figma", "UI Design", "UX Research", "Design System", "Prototyping", "Adobe CC", "Motion Design"],
    createdAt: "2025-03-20T14:00:00Z",
    photoUrl: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: "example-3",
    name: "Juliana Ferreira",
    headline: "Engenheira de Dados & IA",
    description: "Engenheira de dados com expertise em Python, Machine Learning e construção de pipelines de dados robustos. Mais de 6 anos de experiência com infraestrutura AWS, Apache Spark e modelos de NLP/LLMs. Já desenvolvi soluções de IA para startups e grandes empresas — desde chatbots inteligentes e sistemas de recomendação até análise preditiva de churn. Mestrado em Ciência da Computação pela USP.",
    contactEmail: "juliana.ferreira@email.com",
    profileCompleted: true,
    skills: ["Python", "Machine Learning", "AWS", "SQL", "Data Engineering", "TensorFlow", "Spark"],
    createdAt: "2025-02-10T09:00:00Z",
    photoUrl: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

const EXAMPLE_PROFILES: Record<string, ExampleProfile> = {};
EXAMPLE_PROFILES_LIST.forEach((p) => { EXAMPLE_PROFILES[p.id] = p; });

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
    // Check if it's an example profile
    if (EXAMPLE_PROFILES[id]) {
      setProfile(EXAMPLE_PROFILES[id]);
      setLoading(false);
      return;
    }
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
    return () => { document.body.style.overflow = ""; };
  }, [showProposalForm]);

  async function sendProposal(e: FormEvent) {
    e.preventDefault();
    if (role !== "COMPANY") return;

    // Block proposals for example profiles
    if (id.startsWith("example-")) {
      toast.error("Este é um perfil de exemplo. Não é possível enviar propostas.");
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
        <p className="text-lg font-medium text-error mb-4">{error || "Não encontrado."}</p>
        <button onClick={() => router.back()} className="text-secondary hover:underline">Voltar</button>
      </div>
    );
  }

  const isExample = id.startsWith("example-");
  const exampleData = isExample ? EXAMPLE_PROFILES[id] : null;
  const profileName = profile.name || profile.headline || "Profissional";
  const avatarInitial = profileName.charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-6xl pb-20 pt-8 px-4">
      <div className="flex flex-col lg:flex-row gap-8 items-start">

        {/* Left Sidebar (1/3) */}
        <aside className="w-full lg:w-1/3 flex flex-col gap-6">

          {/* Profile Card */}
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/10">
            {exampleData?.photoUrl ? (
              <div className="w-36 h-36 rounded-full overflow-hidden mb-4 shadow-md border-[3px] border-white">
                <Image src={exampleData.photoUrl} alt={profileName} width={144} height={144} className="object-cover w-full h-full" />
              </div>
            ) : (
              <Avatar className="w-36 h-36 mb-4 shadow-md border-[3px] border-white">
                <AvatarFallback className="bg-primary text-white text-5xl font-bold">
                  {avatarInitial}
                </AvatarFallback>
              </Avatar>
            )}
            <h1 className="font-headline text-2xl text-primary font-bold capitalize">{profileName}</h1>
            {profile.headline && (
              <h2 className="text-[15px] text-on-surface-variant font-medium mt-1">{profile.headline}</h2>
            )}

            {profile.profileCompleted && (
              <div className="bg-[#e4faed] text-[#137e40] text-[11px] font-bold px-3 py-1.5 rounded-full mt-3 flex items-center gap-1.5 shadow-sm">
                <span className="material-symbols-outlined text-[16px]">check_circle</span> Disponível para Trabalho
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full mt-6 flex flex-col gap-3">
              {role === "COMPANY" ? (
                <button onClick={() => setShowProposalForm(true)} className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5">
                  <span className="material-symbols-outlined text-[18px]">work</span> Contrate-me
                </button>
              ) : (
                <button disabled className="w-full bg-surface-container opacity-50 text-on-surface-variant font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                  Contrate-me <span className="text-[10px] uppercase ml-1">(Apenas Empresas)</span>
                </button>
              )}
              <Link href="/app/messages" className="w-full bg-surface-container-lowest border border-border hover:bg-surface-container-low text-primary font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">chat</span> Mensagem
              </Link>
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/10 text-left">
            <h3 className="font-headline text-lg text-primary font-bold mb-3">Sobre</h3>
            {profile.description ? (
              <p className="text-sm text-on-surface-variant leading-relaxed">{profile.description}</p>
            ) : (
              <p className="text-sm text-on-surface-variant/50 italic">Nenhuma descrição disponível.</p>
            )}
          </div>

          {/* Contact */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/10 text-left">
            <h3 className="font-headline text-lg text-primary font-bold mb-4">Contato</h3>
            <div className="flex flex-col gap-3 text-sm text-on-surface-variant">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant/80">mail</span>
                {profile.contactEmail || <span className="italic text-on-surface-variant/50">Não informado</span>}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/10 text-left lg:mb-0">
            <h3 className="font-headline text-lg text-primary font-bold mb-4">Habilidades</h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills && profile.skills.length > 0 ? (
                profile.skills.map((skill) => (
                  <span key={skill} className="bg-primary/5 text-primary px-3 py-1.5 rounded-lg text-xs font-bold border border-primary/10">{skill}</span>
                ))
              ) : (
                <p className="text-sm text-on-surface-variant/50 italic">Nenhuma habilidade listada.</p>
              )}
            </div>
          </div>

        </aside>

        {/* Right Area (2/3) */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">

          {/* Info notice if profile not completed */}
          {!profile.profileCompleted && (
            <div className="bg-amber-50/60 border border-amber-200/50 rounded-3xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <span className="material-symbols-outlined text-[22px]">info</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary mb-1">Perfil incompleto</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  Este profissional ainda não completou seu perfil. Algumas informações podem estar indisponíveis.
                </p>
              </div>
            </div>
          )}

          {/* Empty state for sections that come from user input */}
          <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/10">
            <h3 className="font-headline text-xl text-primary font-bold mb-6">Experiência de Trabalho</h3>
            <div className="flex flex-col items-center py-8 text-center">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/20 mb-3">work_history</span>
              <p className="text-sm text-on-surface-variant">Nenhuma experiência adicionada.</p>
            </div>
          </div>

          {/* Portfolio */}
          <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/10">
            <h3 className="font-headline text-xl text-primary font-bold mb-6">Portfólio</h3>
            <div className="flex flex-col items-center py-8 text-center">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/20 mb-3">palette</span>
              <p className="text-sm text-on-surface-variant">Nenhum projeto no portfólio.</p>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/10">
            <h3 className="font-headline text-xl text-primary font-bold mb-5">Avaliações</h3>
            <div className="flex flex-col items-center py-8 text-center">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/20 mb-3">rate_review</span>
              <p className="text-sm text-on-surface-variant">Sem avaliações por enquanto.</p>
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
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-outline-variant/20 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-headline text-xl text-primary font-bold">Enviar Proposta</h4>
              <button onClick={() => setShowProposalForm(false)} className="text-on-surface-variant hover:text-error transition-colors">
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <form onSubmit={sendProposal} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-on-surface">Mensagem</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Descreva o escopo, projeto e necessidades..."
                  className="w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 text-sm outline-none transition-all placeholder:text-on-surface-variant/40 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-on-surface">Valor Fixo Sugerido (R$)</label>
                <input
                  type="number"
                  required
                  min={0}
                  step="0.01"
                  placeholder="Ex.: 1500.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                />
                {price && Number(price) > 0 && (
                  <div className="mt-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 p-4 text-xs space-y-1.5">
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Valor do profissional</span>
                      <span className="font-bold text-on-surface">R$ {Number(price).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-on-surface-variant">
                      <span>Taxa Pronnect (10%)</span>
                      <span className="font-bold text-on-surface">R$ {(Number(price) * 0.10).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-outline-variant/30 pt-1.5 flex justify-between text-on-surface font-bold text-sm">
                      <span>Total cobrado</span>
                      <span className="text-secondary">R$ {(Number(price) * 1.10).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-primary mt-2 py-3.5 text-sm font-bold flex justify-center items-center gap-2 text-white transition-all hover:bg-primary/95 disabled:opacity-50"
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
