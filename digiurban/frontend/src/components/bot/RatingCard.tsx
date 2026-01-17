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

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, comment || undefined);
    }
  };

  const labels = ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente'];

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>

      {/* Stars */}
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              className={`w-10 h-10 ${
                star <= (hover || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Label */}
      {(rating > 0 || hover > 0) && (
        <div className="text-center mb-4">
          <span className="text-lg font-medium text-gray-700">
            {labels[(hover || rating) - 1]}
          </span>
        </div>
      )}

      {/* Comment */}
      {rating > 0 && (
        <div className="mb-4">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Quer deixar um comentário? (opcional)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            maxLength={200}
          />
          <div className="text-right text-xs text-gray-400 mt-1">
            {comment.length}/200
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={rating === 0}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Enviar avaliação
      </button>
    </div>
  );
}

export default RatingCard;
