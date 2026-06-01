import { useEffect, useState } from "react";
import { ReviewSummaryResponse } from "@/lib/types";
import { api } from "@/lib/api";
import { StarRating } from "./StarRating";
import { ReviewCard } from "./ReviewCard";

interface ReviewSectionProps {
  accountId: string;
}

export function ReviewSection({ accountId }: ReviewSectionProps) {
  const [summary, setSummary] = useState<ReviewSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReviews() {
      try {
        const data = await api<ReviewSummaryResponse>(`/reviews/account/${accountId}/summary`);
        setSummary(data);
      } catch (err) {
        console.error("Failed to load reviews", err);
        setError("Falha ao carregar avaliações.");
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, [accountId]);

  if (loading) {
    return <div className="animate-pulse bg-muted rounded-2xl h-32 w-full mt-4"></div>;
  }

  if (error) {
    return (
      <div className="mt-4 rounded-3xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
        <h3 className="text-lg font-bold mb-2">Avaliações</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="mt-4 mb-8">
      <h3 className="text-2xl font-bold mb-6">Avaliações</h3>

      {/* Header com a Média */}
      <div className="flex items-center gap-6 mb-8 p-6 bg-card border border-border rounded-2xl">
        <div className="text-center">
          <div className="text-5xl font-black text-foreground mb-1">
            {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : "0"}
          </div>
          <div className="text-sm text-muted-foreground">de 5</div>
        </div>

        <div className="flex flex-col gap-1">
          <StarRating rating={summary.averageRating} size="lg" />
          <span className="text-sm text-muted-foreground font-medium mt-1">
            Baseado em {summary.totalReviews}{" "}
            {summary.totalReviews === 1 ? "avaliação" : "avaliações"}
          </span>
        </div>
      </div>

      {/* Lista de Avaliações */}
      {summary.reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-muted/30 rounded-2xl border border-border/50 border-dashed">
          <p className="text-muted-foreground">Ainda não há avaliações para este perfil.</p>
        </div>
      )}
    </div>
  );
}
