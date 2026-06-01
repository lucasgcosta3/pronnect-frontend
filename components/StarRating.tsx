import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface StarRatingProps {
  rating?: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  isInteractive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating = 0,
  maxRating = 5,
  size = 'md',
  isInteractive = false,
  onRatingChange,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  };

  const handleMouseEnter = (index: number) => {
    if (isInteractive) setHoverRating(index);
  };

  const handleMouseLeave = () => {
    if (isInteractive) setHoverRating(0);
  };

  const handleClick = (index: number) => {
    if (isInteractive && onRatingChange) onRatingChange(index);
  };

  const currentRating = hoverRating || rating;

  return (
    <div
      className={twMerge('flex items-center gap-1', className)}
      onMouseLeave={handleMouseLeave}
    >
      {[...Array(maxRating)].map((_, i) => {
        const starIndex = i + 1;
        
        // Calcular preenchimento parcial (ex: 3.5 = 3 estrelas cheias, 1 meia, 1 vazia)
        let fillPercentage = 0;
        if (currentRating >= starIndex) {
          fillPercentage = 100;
        } else if (currentRating > i && currentRating < starIndex) {
          fillPercentage = (currentRating - i) * 100;
        }

        return (
          <div
            key={i}
            className={clsx(
              'relative transition-transform duration-200',
              isInteractive && 'cursor-pointer hover:scale-110'
            )}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            onClick={() => handleClick(starIndex)}
          >
            {/* Estrela de fundo (vazia) */}
            <Star
              className={clsx(
                sizeClasses[size],
                'text-muted-foreground/30' // Cor da estrela vazia
              )}
              strokeWidth={1.5}
            />

            {/* Estrela preenchida sobreposta (com clipe horizontal para decimais) */}
            {fillPercentage > 0 && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillPercentage}%` }}
              >
                <Star
                  className={clsx(
                    sizeClasses[size],
                    'text-amber-400 fill-amber-400 drop-shadow-sm' // Dourado premium
                  )}
                  strokeWidth={1.5}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
