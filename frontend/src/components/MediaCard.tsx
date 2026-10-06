import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Bookmark, Check, Plus } from 'lucide-react';
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
  onFavoriteChange?: (id: number, isFav: boolean) => void;
  onWatchlistChange?: (id: number, status: string | null) => void;
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
  onFavoriteChange,
  onWatchlistChange,
}) => {
  const { isAuthenticated } = useAuthStore();
  const [isFavorite, setIsFavorite] = useState(isFavoriteInitial);
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(watchlistStatusInitial);
  const [loadingFav, setLoadingFav] = useState(false);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

  const imageUrl = posterPath
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=500';

  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const detailUrl = type === 'movie' ? `/filmes/${id}` : `/series/${id}`;

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
    } catch (err) {
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
    } catch (err) {
      toast.error('Erro ao atualizar watchlist');
    } finally {
      setLoadingWatchlist(false);
    }
  };

  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300">
      {/* Poster Container */}
      <Link to={detailUrl} className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3" />

        {/* TMDB Score Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-amber-400 text-xs font-bold shadow-md">
          <Star className="w-3 h-3 fill-amber-400" />
          <span>{voteAverage ? voteAverage.toFixed(1) : 'N/A'}</span>
        </div>

        {/* Quick Action Buttons on Poster */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleFavorite}
            disabled={loadingFav}
            className={`p-2 rounded-full backdrop-blur-md border transition-all ${
              isFavorite
                ? 'bg-red-500/20 border-red-500/50 text-red-500'
                : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            title={isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500' : ''}`} />
          </button>

          <button
            onClick={handleToggleWatchlist}
            disabled={loadingWatchlist}
            className={`p-2 rounded-full backdrop-blur-md border transition-all ${
              watchlistStatus
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                : 'bg-zinc-950/70 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
            title={watchlistStatus ? 'Na Watchlist' : 'Adicionar à Watchlist'}
          >
            <Bookmark className={`w-3.5 h-3.5 ${watchlistStatus ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-1">
        <div>
          <Link
            to={detailUrl}
            className="font-semibold text-sm text-zinc-100 hover:text-amber-400 transition-colors line-clamp-1"
            title={title}
          >
            {title}
          </Link>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
            {year && <span>{year}</span>}
            <span className="w-1 h-1 rounded-full bg-zinc-600" />
            <span className="uppercase text-[10px] tracking-wider font-semibold text-zinc-400">
              {type === 'movie' ? 'Filme' : 'Série'}
            </span>
          </div>
        </div>

        {watchlistStatus && (
          <div className="mt-1">
            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700/60">
              {watchlistStatus === 'PLANNING' && 'Planejo'}
              {watchlistStatus === 'WATCHING' && 'Assistindo'}
              {watchlistStatus === 'COMPLETED' && 'Concluído'}
              {watchlistStatus === 'DROPPED' && 'Abandonado'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
