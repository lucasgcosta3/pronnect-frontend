import { FormEvent, useState } from "react";
import { StarRating } from "./StarRating";
import { api, ApiError } from "@/lib/api";
import { toast } from "sonner";
import { CreateReviewRequest, ReviewResponse } from "@/lib/types";

interface ReviewFormProps {
  reviewedAccountId: string;
  serviceContractId: string;
  onSuccess?: (review: ReviewResponse) => void;
  onCancel?: () => void;
}

export function ReviewForm({ reviewedAccountId, serviceContractId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Por favor, selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    setLoading(true);
    try {
      const body: CreateReviewRequest = {
        reviewedAccountId,
        serviceContractId,
        rating,
        comment: comment.trim() || undefined,
      };

      const review = await api<ReviewResponse>("/reviews", {
        method: "POST",
        json: body,
      });

      toast.success("Avaliação enviada com sucesso!");
      if (onSuccess) onSuccess(review);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error("Não foi possível enviar a avaliação.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold mb-4">Deixe sua avaliação</h3>
      
      <div className="mb-6 flex flex-col items-center">
        <p className="text-sm text-muted-foreground mb-2">Qual sua nota para esta experiência?</p>
        <StarRating 
          rating={rating} 
          onRatingChange={setRating} 
          isInteractive 
          size="lg" 
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-foreground/80">
          Comentário (opcional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Conte um pouco sobre como foi trabalhar com este perfil..."
          rows={3}
          maxLength={1000}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/40 hover:border-primary/30 focus:border-primary focus:ring-1 focus:ring-primary resize-none"
        />
        <div className="text-xs text-muted-foreground text-right mt-1">
          {comment.length}/1000
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium transition-colors hover:bg-muted"
            disabled={loading}
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading || rating === 0}
          className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? "Enviando..." : "Enviar avaliação"}
        </button>
      </div>
    </form>
  );
}
