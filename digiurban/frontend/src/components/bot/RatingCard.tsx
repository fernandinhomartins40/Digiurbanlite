'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingCardProps {
  onSubmit: (rating: number, comment?: string) => void;
  title?: string;
  subtitle?: string;
}

export function RatingCard({
  onSubmit,
  title = 'Como foi sua experiência?',
  subtitle = 'Sua opinião é muito importante para nós',
}: RatingCardProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');

  const labels = ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'];

  return (
    <div className="w-full min-w-0 max-w-full bg-white rounded-lg border border-slate-200 shadow-sm p-3.5 sm:p-4 overflow-hidden">
      <div className="text-center mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 break-words">{title}</h3>
        <p className="text-xs text-gray-600 break-words">{subtitle}</p>
      </div>

      {/* Stars — tamanho fixo para não transbordar */}
      <div className="flex min-w-0 justify-center gap-1.5 sm:gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-colors focus:outline-none"
          >
            <Star
              className={`h-8 w-8 sm:w-9 sm:h-9 ${
                star <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>

      {(rating > 0 || hover > 0) && (
        <div className="text-center mb-4">
          <span className="text-base font-medium text-gray-700">
            {labels[(hover || rating) - 1]}
          </span>
        </div>
      )}

      {rating > 0 && (
        <div className="mb-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Quer deixar um comentário? (opcional)"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            rows={3}
            maxLength={200}
          />
          <div className="text-right text-[11px] text-gray-400 mt-1">{comment.length}/200</div>
        </div>
      )}

      <button
        onClick={() => rating > 0 && onSubmit(rating, comment || undefined)}
        disabled={rating === 0}
        className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Enviar avaliação
      </button>
    </div>
  );
}

export default RatingCard;
