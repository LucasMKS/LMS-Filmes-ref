import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Bookmark, Eye, Film, Tv, Users, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { favoriteApi, watchlistApi } from '../services/api';
import { toast } from 'sonner';

interface MediaCardProps {
  id: number;
  title: string;
  posterPath: string | null;
  voteAverage: number;
  releaseDate?: string;
  type: 'movie' | 'serie';
  isFavoriteInitial?: boolean;
  watchlistStatusInitial?: string | null;
  userRating?: {
    rating: string | number;
    comment?: string;
    rewatchCount?: number;
  } | null;
  onFavoriteChange?: (id: number, isFav: boolean) => void;
  onWatchlistChange?: (id: number, status: string | null) => void;
  onQuickView?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  id,
  title,
  posterPath,
  voteAverage,
  releaseDate,
  type,
  isFavoriteInitial = false,
  watchlistStatusInitial = null,
  userRating = null,
  onFavoriteChange,
  onWatchlistChange,
  onQuickView,
}) => {
  const { isAuthenticated } = useAuthStore();
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(watchlistStatusInitial);
  const [loadingFav, setLoadingFav] = useState(false);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

  useEffect(() => {
    setIsFavorite(isFavoriteInitial);
  }, [isFavoriteInitial]);

  useEffect(() => {
    setWatchlistStatus(watchlistStatusInitial);
  }, [watchlistStatusInitial]);

  const imageUrl = posterPath
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=500';

  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const detailUrl = type === 'movie' ? `/filmes/${id}` : `/series/${id}`;
  const hasUserRating = userRating && userRating.rating && Number(userRating.rating) > 0;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Faça login para adicionar aos favoritos');
      return;
    }

    setLoadingFav(true);
    try {
      if (isFavorite) {
        if (type === 'movie') {
          await favoriteApi.removeMovie(id);
        } else {
          await favoriteApi.removeSerie(id);
        }
        setIsFavorite(false);
        onFavoriteChange?.(id, false);
        toast.info('Removido dos favoritos');
      } else {
        if (type === 'movie') {
          await favoriteApi.addMovie(id);
        } else {
          await favoriteApi.addSerie(id);
        }
        setIsFavorite(true);
        onFavoriteChange?.(id, true);
        toast.success('Adicionado aos favoritos!');
      }
    } catch {
      toast.error('Erro ao atualizar favorito');
    } finally {
      setLoadingFav(false);
    }
  };

  const handleToggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Faça login para gerenciar sua watchlist');
      return;
    }

    setLoadingWatchlist(true);
    try {
      if (watchlistStatus) {
        if (type === 'movie') {
          await watchlistApi.removeMovie(id);
        } else {
          await watchlistApi.removeSerie(id);
        }
        setWatchlistStatus(null);
        onWatchlistChange?.(id, null);
        toast.info('Removido da watchlist');
      } else {
        const defaultStatus = 'PLANNING';
        if (type === 'movie') {
          await watchlistApi.setMovieStatus(id, defaultStatus);
        } else {
          await watchlistApi.setSerieStatus(id, defaultStatus);
        }
        setWatchlistStatus(defaultStatus);
        onWatchlistChange?.(id, defaultStatus);
        toast.success('Adicionado à watchlist (Planejo Assistir)!');
      }
    } catch {
      toast.error('Erro ao atualizar watchlist');
    } finally {
      setLoadingWatchlist(false);
    }
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#14141c] transition-all duration-300 hover:-translate-y-1.5 hover:border-purple-500/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
      {/* Top subtle glow on hover */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-30" />

      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-white/5">
        <Link to={detailUrl} className="block w-full h-full">
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* Gradient dark overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-60" />

        {/* Category Badge (Top Left) */}
        <div
          className={`pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg backdrop-blur-md rounded-xl ${
            type === 'movie' ? 'bg-purple-600/90' : 'bg-violet-600/90'
          }`}
        >
          {type === 'movie' ? <Film className="w-3 h-3" /> : <Tv className="w-3 h-3" />}
          <span>{type === 'movie' ? 'Filme' : 'Série'}</span>
        </div>

        {/* Action Buttons (Top Right - Favorite & Watchlist circular buttons) */}
        <div className="absolute right-3 top-3 z-30 flex items-center gap-1.5">
          {/* Favorite button */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={loadingFav}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className={`h-8 w-8 rounded-full border transition-all duration-300 hover:scale-110 flex items-center justify-center ${
              isFavorite
                ? 'border-pink-500/50 bg-pink-600/90 text-white shadow-[0_4px_12px_rgba(219,39,119,0.35)] backdrop-blur-sm hover:bg-pink-500'
                : 'border-white/10 bg-[#0a0a0f]/60 text-white/60 backdrop-blur-sm hover:bg-[#0a0a0f]/90 hover:text-white hover:border-white/20'
            }`}
            title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Watchlist button */}
          <button
            type="button"
            onClick={handleToggleWatchlist}
            disabled={loadingWatchlist}
            aria-label={watchlistStatus ? 'Remover da Watchlist' : 'Adicionar à Watchlist'}
            className={`h-8 w-8 rounded-full border transition-all duration-300 hover:scale-110 flex items-center justify-center ${
              watchlistStatus
                ? 'border-emerald-500/50 bg-emerald-600/90 text-white shadow-[0_4px_12px_rgba(16,185,129,0.35)] backdrop-blur-sm hover:bg-emerald-500'
                : 'border-white/10 bg-[#0a0a0f]/60 text-white/60 backdrop-blur-sm hover:bg-[#0a0a0f]/90 hover:text-white hover:border-white/20'
            }`}
            title={watchlistStatus ? 'Na Watchlist' : 'Adicionar à Watchlist'}
          >
            <Bookmark className={`h-3.5 w-3.5 ${watchlistStatus ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Quick View Button (Desktop Center Hover) */}
        {onQuickView && (
          <div className="absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-all duration-300 hidden sm:flex group-hover:opacity-100 group-hover:scale-100 scale-90">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView();
              }}
              className="h-12 w-12 rounded-full border border-white/10 bg-[#0a0a0f]/80 text-white shadow-2xl backdrop-blur-xl transition-all duration-200 hover:scale-110 hover:bg-purple-600 hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center"
              aria-label="Visualização rápida"
              title="Visualização rápida"
            >
              <Eye className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Rating Badge (Bottom Right) */}
        <div className="pointer-events-none absolute right-3 bottom-3 z-20">
          {hasUserRating ? (
            <div className="flex items-center gap-1.5 rounded-xl border border-yellow-500/40 bg-yellow-500/20 px-2.5 py-1 text-xs font-extrabold text-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.25)] backdrop-blur-md">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span>{userRating?.rating != null ? Number(userRating.rating).toFixed(1) : '0.0'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0a0a0f]/75 px-2.5 py-1 text-white/90 backdrop-blur-md">
              <Users className="h-3.5 w-3.5 text-white/60" />
              <span className="text-xs font-bold">
                {voteAverage != null && !isNaN(Number(voteAverage)) && Number(voteAverage) > 0
                  ? Number(voteAverage).toFixed(1)
                  : 'N/A'}
              </span>
            </div>
          )}
        </div>

        {/* Comment Badge (Bottom Left, if comment exists) */}
        {userRating?.comment ? (
          <div
            className="pointer-events-none absolute left-3 bottom-3 z-20 flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-600/90 px-2 py-1 text-white shadow-lg backdrop-blur-md"
            title="Possui comentário"
          >
            <MessageSquare className="h-3 w-3" />
            <span className="text-[10px] font-bold">Comentário</span>
          </div>
        ) : watchlistStatus ? (
          /* Watchlist status badge in bottom left (if set and no comment) */
          <div className="pointer-events-none absolute left-3 bottom-3 z-20">
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              {watchlistStatus === 'PLANNING' && 'Planejo'}
              {watchlistStatus === 'WATCHING' && 'Assistindo'}
              {watchlistStatus === 'COMPLETED' && 'Concluído'}
              {watchlistStatus === 'DROPPED' && 'Abandonado'}
            </span>
          </div>
        ) : null}
      </div>

      {/* Footer Info */}
      <div className="border-t border-white/[0.05] bg-[#14141c] px-4 py-3.5 flex flex-col justify-between flex-1">
        <div>
          <Link
            to={detailUrl}
            className="mb-0.5 line-clamp-1 text-sm font-bold text-white/90 transition-colors duration-200 group-hover:text-purple-300"
            title={title}
          >
            {title}
          </Link>
          <p className="text-xs font-medium text-white/35">
            {year ? year : 'Ano não disponível'}
          </p>
        </div>
      </div>
    </div>
  );
};
