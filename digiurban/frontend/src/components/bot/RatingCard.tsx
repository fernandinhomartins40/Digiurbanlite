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
    <div className="w-full min-w-0 max-w-full bg-white rounded-lg border border-blue-100 shadow-sm p-3.5 overflow-hidden">
      <div className="text-center mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 break-words">{title}</h3>
        <p className="text-xs text-gray-600 break-words">{subtitle}</p>
      </div>

      {/* Stars — tamanho fixo para não transbordar */}
      <div className="flex min-w-0 justify-center gap-1.5 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-colors focus:outline-none"
          >
            <Star
              className={`h-8 w-8 ${
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
            className="w-full px-3 py-2.5 border border-blue-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm bg-blue-50/25"
            rows={3}
            maxLength={200}
          />
          <div className="text-right text-[11px] text-gray-400 mt-1">{comment.length}/200</div>
        </div>
      )}

      <button
        onClick={() => rating > 0 && onSubmit(rating, comment || undefined)}
        disabled={rating === 0}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-700 to-teal-700 text-white rounded-lg font-medium text-sm hover:from-blue-800 hover:to-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Enviar avaliação
      </button>
    </div>
  );
}

export default RatingCard;
