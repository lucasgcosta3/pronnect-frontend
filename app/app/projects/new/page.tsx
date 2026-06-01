"use client";

import type { AiSuggestionResponse, SkillResponse, ProjectResponse } from "@/lib/types";
import { ApiError, api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sparkles, ArrowRight, ArrowLeft, Plus, X, Info, Check } from "lucide-react";

export default function NewProjectWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 state
  const [briefDescription, setBriefDescription] = useState("");

  // Step 2-4 states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [paymentType, setPaymentType] = useState<"FIXED_PRICE" | "HOURLY">("FIXED_PRICE");
  const [budgetMin, setBudgetMin] = useState<number | "">("");
  const [budgetMax, setBudgetMax] = useState<number | "">("");
  const [aiJustification, setAiJustification] = useState<string>("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Platform skills for autocompleting
  const [allSkills, setAllSkills] = useState<SkillResponse[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [skillSuggestions, setSkillSuggestions] = useState<SkillResponse[]>([]);

  useEffect(() => {
    // Pre-load all available skills
    api<SkillResponse[]>("/skills")
      .then((res) => setAllSkills(res))
      .catch(() => {});
  }, []);

  // Filter skills based on input
  useEffect(() => {
    if (!skillInput.trim()) {
      setSkillSuggestions([]);
      return;
    }
    const filtered = allSkills.filter(
      (s) =>
        s.name.toLowerCase().includes(skillInput.toLowerCase()) &&
        !selectedSkills.includes(s.name)
    );
    setSkillSuggestions(filtered.slice(0, 5));
  }, [skillInput, allSkills, selectedSkills]);

  async function handleGenerateSuggestions() {
    if (!briefDescription.trim()) {
      setError("Por favor, forneça uma breve descrição.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const suggestion = await api<AiSuggestionResponse>("/projects/ai-suggest", {
        method: "POST",
        json: { briefDescription: briefDescription.trim() },
      });

      setTitle(suggestion.title || "");
      setDescription(suggestion.description || "");
      setPaymentType(suggestion.paymentType || "FIXED_PRICE");
      setBudgetMin(suggestion.budgetMin ?? "");
      setBudgetMax(suggestion.budgetMax ?? "");
      setAiJustification(suggestion.paymentTypeJustification || "");
      setSelectedSkills(suggestion.skills || []);
      setStep(2);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Erro ao conectar com o serviço de IA. Prossiga preenchendo manualmente.");
      // Fallback: Proceed to manual input
      setTitle("");
      setDescription("");
      setPaymentType("FIXED_PRICE");
      setBudgetMin("");
      setBudgetMax("");
      setAiJustification("");
      setSelectedSkills([]);
      setStep(2);
    } finally {
      setLoading(false);
    }
  }

  function addSkill(skillName: string) {
    const cleanName = skillName.trim();
    if (cleanName && !selectedSkills.includes(cleanName)) {
      setSelectedSkills([...selectedSkills, cleanName]);
    }
    setSkillInput("");
  }

  function removeSkill(skillName: string) {
    setSelectedSkills(selectedSkills.filter((s) => s !== skillName));
  }

  async function handlePublish() {
    if (!title.trim() || !description.trim()) {
      setError("Título e Descrição detalhada são obrigatórios.");
      return;
    }

    setPublishing(true);
    setError(null);
    try {
      const project = await api<ProjectResponse>("/projects", {
        method: "POST",
        json: {
          title: title.trim(),
          description: description.trim(),
          paymentType,
          budgetMin: budgetMin === "" ? null : Number(budgetMin),
          budgetMax: budgetMax === "" ? null : Number(budgetMax),
          skills: selectedSkills,
          aiJustification: aiJustification.trim() || null,
        },
      });

      router.push(`/app/projects/${project.id}`);
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
      else setError("Erro ao publicar o projeto.");
      setPublishing(false);
    }
  }

  const renderStepsIndicator = () => (
    <div className="mb-10 flex items-center justify-center gap-2">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
              step >= s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s}
          </div>
          {s < 4 && (
            <div
              className={`h-[2px] w-12 transition-all ${
                step > s ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 mt-16">
      <h1 className="mb-2 text-center text-3xl font-extrabold tracking-tight text-foreground">
        Publicar Novo Projeto
      </h1>
      <p className="mb-8 text-center text-muted-foreground">
        Crie sua vaga de projeto freelance com o assistente inteligente da Pronnect
      </p>

      {renderStepsIndicator()}

      {error && (
        <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-semibold text-destructive flex items-center gap-3">
          <Info size={16} />
          {error}
        </div>
      )}

      {/* Step 1: Brief Description */}
      {step === 1 && (
        <div className="rounded-3xl bg-card p-6 shadow-xl border border-border">
          <h2 className="mb-4 text-xl font-bold text-foreground">
            Descreva seu projeto em poucas palavras
          </h2>
          <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
            Diga-nos o que você precisa construir. Exemplo: "Preciso de um desenvolvedor Java para criar uma API de gestão de estoque."
          </p>

          <textarea
            value={briefDescription}
            onChange={(e) => setBriefDescription(e.target.value)}
            rows={5}
            maxLength={300}
            placeholder="Preciso de..."
            className="w-full rounded-2xl border border-border bg-background p-4 text-foreground outline-none focus:border-primary transition-colors resize-none placeholder:text-muted-foreground/60"
          />
          <div className="mt-2 text-right text-xs text-muted-foreground">
            {briefDescription.length}/300 caracteres
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={() => {
                // Continue manually without AI suggestions
                setTitle("");
                setDescription("");
                setPaymentType("FIXED_PRICE");
                setBudgetMin("");
                setBudgetMax("");
                setAiJustification("");
                setSelectedSkills([]);
                setStep(2);
              }}
              disabled={loading}
              className="rounded-xl px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Criar Manulamente
            </button>
            <button
              onClick={handleGenerateSuggestions}
              disabled={loading || !briefDescription.trim()}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-secondary animate-pulse" />
                  Gerar com IA
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Detail fields */}
      {step === 2 && (
        <div className="rounded-3xl bg-card p-6 shadow-xl border border-border">
          <h2 className="mb-6 text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="text-secondary" size={20} />
            Detalhes do Projeto
          </h2>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-foreground">Título do Projeto</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: API de Gestão de Estoque em Spring Boot"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-foreground">Descrição Detalhada</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Descreva as responsabilidades, requisitos técnicos, entregáveis do projeto..."
                className="w-full rounded-xl border border-border bg-background p-4 text-foreground outline-none focus:border-primary transition-colors resize-y"
              />
            </div>

            {/* Payment Type and Recommendation */}
            <div>
              <label className="mb-2 block text-sm font-bold text-foreground">Modalidade de Pagamento</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentType("FIXED_PRICE")}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    paymentType === "FIXED_PRICE"
                      ? "border-primary bg-primary/5 text-foreground font-bold"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="text-sm">Valor Fechado</div>
                  <div className="text-xs text-muted-foreground mt-1">Orçamento fixo total</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType("HOURLY")}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    paymentType === "HOURLY"
                      ? "border-primary bg-primary/5 text-foreground font-bold"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <div className="text-sm">Pagamento por Hora</div>
                  <div className="text-xs text-muted-foreground mt-1">Ideal para escopo flexível</div>
                </button>
              </div>

              {aiJustification && (
                <div className="mt-4 rounded-xl border border-secondary/20 bg-secondary/5 p-4 text-xs text-foreground flex gap-3">
                  <Sparkles className="text-secondary shrink-0" size={16} />
                  <div>
                    <span className="font-bold text-secondary">Sugestão da IA:</span> {aiJustification}
                  </div>
                </div>
              )}
            </div>

            {/* Budget Range */}
            <div>
              <label className="mb-2 block text-sm font-bold text-foreground">Faixa de Orçamento (R$)</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Mínimo (ex: 2000)"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value === "" ? "" : Number(e.target.value))}
                    placeholder="Máximo (ex: 5000)"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!title.trim() || !description.trim()}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            >
              Próximo
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Skills recommendations */}
      {step === 3 && (
        <div className="rounded-3xl bg-card p-6 shadow-xl border border-border">
          <h2 className="mb-4 text-xl font-bold text-foreground">Habilidades Necessárias</h2>
          <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
            Selecione as habilidades que o profissional freelancer precisa dominar para realizar o trabalho com sucesso.
          </p>

          {/* Selected Skills Chips */}
          <div className="mb-6 flex flex-wrap gap-2">
            {selectedSkills.map((skill) => (
              <span
                key={skill}
                className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-bold text-primary capitalize"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="rounded-full hover:bg-primary/20 p-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          {/* Skill Autocomplete Input */}
          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Pesquise ou digite uma habilidade..."
                className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => addSkill(skillInput)}
                className="flex items-center justify-center rounded-xl bg-muted px-4 hover:bg-muted/80 text-foreground transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {skillSuggestions.length > 0 && (
              <ul className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-border bg-card p-1 shadow-lg max-h-40 overflow-y-auto">
                {skillSuggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => addSkill(s.name)}
                      className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted rounded-lg font-medium"
                    >
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-12 flex justify-between gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm hover:bg-primary/95 transition-all hover:scale-105 active:scale-95"
            >
              Revisar Projeto
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Preview and Publish */}
      {step === 4 && (
        <div className="rounded-3xl bg-card p-6 shadow-xl border border-border">
          <h2 className="mb-6 text-xl font-bold text-foreground">Revisar Projeto</h2>

          <div className="space-y-6 rounded-2xl bg-muted/40 border border-border p-6 mb-8">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Título</span>
              <h3 className="text-lg font-bold text-foreground mt-1">{title}</h3>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Descrição</span>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mt-1">
                {description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Modalidade</span>
                <p className="text-sm font-bold text-foreground mt-1">
                  {paymentType === "FIXED_PRICE" ? "Valor Fechado" : "Por Hora"}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">Orçamento</span>
                <p className="text-sm font-bold text-foreground mt-1">
                  {budgetMin || budgetMax
                    ? `R$ ${budgetMin ? budgetMin.toLocaleString("pt-BR") : "0"} - R$ ${budgetMax ? budgetMax.toLocaleString("pt-BR") : "Ilimitado"}`
                    : "A combinar"}
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground block mb-2">Habilidades Requeridas</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedSkills.length > 0 ? (
                  selectedSkills.map((s) => (
                    <span key={s} className="rounded-lg bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground uppercase">
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs italic text-muted-foreground">Nenhuma habilidade adicionada</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-4">
            <button
              onClick={() => setStep(3)}
              disabled={publishing}
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/95 transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            >
              {publishing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Publicando...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Publicar Projeto
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
