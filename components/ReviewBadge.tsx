"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ReviewSummaryResponse } from "@/lib/types";
import { StarRating } from "./StarRating";

interface ReviewBadgeProps {
  accountId: string;
}

export function ReviewBadge({ accountId }: ReviewBadgeProps) {
  const [summary, setSummary] = useState<ReviewSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSummary() {
      setLoading(true);
      try {
        const data = await api<ReviewSummaryResponse>(`/reviews/account/${accountId}/summary`);
        if (active) {
          setSummary(data);
        }
      } catch {
        if (active) {
          setSummary(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSummary();
    return () => {
      active = false;
    };
  }, [accountId]);

  if (loading) {
    return <div className="h-10 rounded-2xl bg-muted/70 animate-pulse" />;
  }

  if (!summary || summary.totalReviews === 0) {
    return (
      <div className="rounded-2xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
        Sem avaliações ainda
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-muted px-3 py-2 text-sm text-foreground">
      <div className="flex items-center gap-2">
        <StarRating rating={summary.averageRating} size="sm" />
        <span className="font-semibold">{summary.averageRating.toFixed(1)}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        {summary.totalReviews} {summary.totalReviews === 1 ? "avaliação" : "avaliações"}
      </p>
    </div>
  );
}
