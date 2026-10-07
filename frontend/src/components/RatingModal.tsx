import React, { useState, useEffect } from 'react';
import { X, Star, MessageSquare, RotateCcw, Trash2 } from 'lucide-react';
import { ratingApi } from '../services/api';
import { useUserRatingsStore } from '../store/useUserRatingsStore';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { toast } from 'sonner';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: number;
  mediaType: 'movie' | 'serie';
  mediaTitle: string;
  posterPath?: string | null;
  initialRating?: number;
  initialComment?: string;
  initialRewatchCount?: number;
  onSuccess?: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  mediaId,
  mediaType,
  mediaTitle,
  posterPath,
  initialRating = 0,
  initialComment = '',
  initialRewatchCount = 0,
  onSuccess,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState(initialComment);
  const [rewatchCount, setRewatchCount] = useState(initialRewatchCount);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(initialRating);
      setComment(initialComment);
      setRewatchCount(initialRewatchCount);
    }
  }, [isOpen, initialRating, initialComment, initialRewatchCount]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating <= 0) {
      toast.error('Selecione uma nota válida maior que zero');
      return;
    }

    setSubmitting(true);
    try {
      if (mediaType === 'movie') {
        await ratingApi.rateMovie({
          movieId: mediaId,
          rating,
          title: mediaTitle,
          poster_path: posterPath || undefined,
          comment: comment.trim() || undefined,
          rewatchCount,
        });
        useUserRatingsStore.getState().setMovieRating(mediaId, {
          rating,
          comment: comment.trim() || undefined,
          rewatchCount,
        });
        // Remove automaticamente da Watchlist ao avaliar ou reavaliar
        useWatchlistStore.getState().removeMovieWatchlist(mediaId);
      } else {
        await ratingApi.rateSerie({
          serieId: mediaId,
          rating,
          title: mediaTitle,
          poster_path: posterPath || undefined,
          comment: comment.trim() || undefined,
          rewatchCount,
        });
        useUserRatingsStore.getState().setSerieRating(mediaId, {
          rating,
          comment: comment.trim() || undefined,
          rewatchCount,
        });
        // Remove automaticamente da Watchlist ao avaliar ou reavaliar
        useWatchlistStore.getState().removeSerieWatchlist(mediaId);
      }
      toast.success('Avaliação salva com sucesso!');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error('Erro ao salvar avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza de que deseja remover sua avaliação?')) return;

    setDeleting(true);
    try {
      if (mediaType === 'movie') {
        await ratingApi.deleteMovieRating(mediaId);
        useUserRatingsStore.getState().removeMovieRating(mediaId);
      } else {
        await ratingApi.deleteSerieRating(mediaId);
        useUserRatingsStore.getState().removeSerieRating(mediaId);
      }
      toast.info('Avaliação removida');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Erro ao remover avaliação');
    } finally {
      setDeleting(false);
    }
  };

  const handleStarMouseMove = (e: React.MouseEvent<HTMLButtonElement>, starVal: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeft = e.clientX - rect.left < rect.width / 2;
    setHoverRating(isLeft ? starVal - 0.5 : starVal);
  };

  const handleStarClick = (e: React.MouseEvent<HTMLButtonElement>, starVal: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isLeft = e.clientX - rect.left < rect.width / 2;
    setRating(isLeft ? starVal - 0.5 : starVal);
  };

  const displayRating = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-white">Avaliar {mediaType === 'movie' ? 'Filme' : 'Série'}</h3>
            <p className="text-sm text-zinc-400 truncate max-w-xs">{mediaTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Star Rating Selector (Supports Half Stars) */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((starVal) => {
                const isFull = displayRating >= starVal;
                const isHalf = !isFull && displayRating >= starVal - 0.5;

                return (
                  <button
                    type="button"
                    key={starVal}
                    onMouseMove={(e) => handleStarMouseMove(e, starVal)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={(e) => handleStarClick(e, starVal)}
                    className="relative p-1 transition-transform hover:scale-110 cursor-pointer"
                    title={`${starVal} estrelas (clique à esquerda para ${starVal - 0.5})`}
                  >
                    <div className="relative w-6 h-6">
                      {/* Background Empty Star */}
                      <Star className="w-6 h-6 text-zinc-700" />
                      {/* Foreground Filled Star (full or half) */}
                      {(isFull || isHalf) && (
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{ width: isFull ? '100%' : '50%' }}
                        >
                          <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Slider and Buttons for fine tuning */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRating((prev) => Math.max(0.5, Number((prev - 0.5).toFixed(1))))}
                className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs text-zinc-300 font-semibold transition-colors"
                title="Diminuir meia estrela (-0.5)"
              >
                -0.5
              </button>

              <div className="flex items-center gap-1.5 min-w-[5rem] justify-center">
                <span className="text-3xl font-black text-amber-400">
                  {displayRating > 0 ? displayRating.toFixed(1) : '-'}
                </span>
                <span className="text-sm text-zinc-500 font-medium">/ 10</span>
              </div>

              <button
                type="button"
                onClick={() => setRating((prev) => Math.min(10, Number((prev + 0.5).toFixed(1))))}
                className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs text-zinc-300 font-semibold transition-colors"
                title="Aumentar meia estrela (+0.5)"
              >
                +0.5
              </button>
            </div>

            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={rating || 0.5}
              onChange={(e) => setRating(parseFloat(e.target.value))}
              className="w-full max-w-xs accent-amber-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
              Sua Resenha / Comentário (Opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="O que você achou dessa produção?"
              rows={3}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          {/* Rewatch Count */}
          <div className="flex items-center justify-between p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-zinc-200">Quantas vezes reassistiu?</p>
                <p className="text-xs text-zinc-500">0 se foi apenas a primeira vez</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRewatchCount(Math.max(0, rewatchCount - 1))}
                className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center font-bold"
              >
                -
              </button>
              <span className="w-8 text-center font-bold text-sm text-zinc-100">
                {rewatchCount}
              </span>
              <button
                type="button"
                onClick={() => setRewatchCount(rewatchCount + 1)}
                className="w-8 h-8 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {initialRating > 0 ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Nota
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || rating <= 0}
                className="px-5 py-2 text-sm font-semibold rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 disabled:opacity-50 transition-all shadow-md shadow-amber-400/20"
              >
                {submitting ? 'Salvando...' : 'Salvar Avaliação'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
