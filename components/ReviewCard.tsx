import { ReviewResponse } from "@/lib/types";
import { StarRating } from "./StarRating";

interface ReviewCardProps {
  review: ReviewResponse;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-foreground">{review.reviewerName}</h4>
          <p className="text-xs text-muted-foreground">
            {new Date(review.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      
      {review.comment && (
        <p className="text-sm text-foreground/80 leading-relaxed">
          {review.comment}
        </p>
      )}
    </div>
  );
}
