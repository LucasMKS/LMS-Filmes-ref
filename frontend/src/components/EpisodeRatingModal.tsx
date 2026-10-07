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
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-0.5 sm:gap-1 p-2 rounded-2xl bg-zinc-900/60 border border-white/[0.05]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starVal) => {
                const isFull = displayRating >= starVal;
                const isHalf = !isFull && displayRating >= starVal - 0.5;

                return (
                  <div
                    key={starVal}
                    className="relative w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center group"
                  >
                    <Star className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-700 pointer-events-none" />

                    {(isFull || isHalf) && (
                      <div
                        className="absolute inset-0 overflow-hidden pointer-events-none flex items-center"
                        style={{ width: isFull ? '100%' : '50%' }}
                      >
                        <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 fill-amber-400 shrink-0" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setRating(starVal - 0.5)}
                      onMouseEnter={() => setHoverRating(starVal - 0.5)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="absolute inset-y-0 left-0 w-1/2 z-10 cursor-pointer"
                      title={`Nota ${starVal - 0.5}`}
                    />

                    <button
                      type="button"
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="absolute inset-y-0 right-0 w-1/2 z-10 cursor-pointer"
                      title={`Nota ${starVal}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRating((prev) => Math.max(0.5, Number((prev - 0.5).toFixed(1))))}
                className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-bold hover:bg-zinc-800"
              >
                -0.5
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-2xl font-black text-amber-400">
                  {displayRating > 0 ? displayRating.toFixed(1) : '-'}
                </span>
                <span className="text-xs text-zinc-500">/ 10</span>
              </div>
              <button
                type="button"
                onClick={() => setRating((prev) => Math.min(10, Number((prev + 0.5).toFixed(1))))}
                className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-bold hover:bg-zinc-800"
              >
                +0.5
              </button>
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
