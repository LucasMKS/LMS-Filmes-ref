import React, { useState, useEffect } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';
import { ratingApi } from '../services/api';
import { toast } from 'sonner';

interface EpisodeRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serieId: number;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle?: string;
  initialRating?: number;
  initialComment?: string;
  onSuccess?: () => void;
}

export const EpisodeRatingModal: React.FC<EpisodeRatingModalProps> = ({
  isOpen,
  onClose,
  serieId,
  seasonNumber,
  episodeNumber,
  episodeTitle = '',
  initialRating = 0,
  initialComment = '',
  onSuccess,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState(initialComment);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(initialRating);
      setComment(initialComment);
    }
  }, [isOpen, initialRating, initialComment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating <= 0) {
      toast.error('Selecione uma nota válida');
      return;
    }

    setSubmitting(true);
    try {
      await ratingApi.rateEpisode({
        serieId,
        seasonNumber,
        episodeNumber,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success(`Episódio ${seasonNumber}x${episodeNumber} avaliado!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Erro ao avaliar episódio');
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-base font-bold text-white">
              Avaliar T{seasonNumber} E{episodeNumber}
            </h3>
            <p className="text-xs text-zinc-400 truncate max-w-xs">{episodeTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starVal) => (
                <button
                  type="button"
                  key={starVal}
                  onMouseEnter={() => setHoverRating(starVal)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setRating(starVal)}
                  className="p-1 text-zinc-600 hover:text-amber-400 transition-colors"
                >
                  <Star
                    className={`w-5 h-5 ${
                      starVal <= displayRating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-zinc-700'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-amber-400">
                {displayRating > 0 ? displayRating.toFixed(1) : '-'}
              </span>
              <span className="text-xs text-zinc-500">/ 10</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <MessageSquare className="w-3 h-3 text-zinc-400" />
              Comentário (Opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comentário sobre este episódio..."
              rows={2}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || rating <= 0}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 disabled:opacity-50 transition-all shadow-md shadow-amber-400/20"
            >
              {submitting ? 'Salvando...' : 'Salvar Nota'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
