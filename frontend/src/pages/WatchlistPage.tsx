import React, { useState, useEffect } from 'react';
import { watchlistApi, movieApi, serieApi } from '../services/api';
import { WatchlistMovie, WatchlistSerie, WatchlistStatus, TmdbMovie, TmdbSerie } from '../types';
import { MediaCard } from '../components/MediaCard';
import { Bookmark, Film, Tv, Filter, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export const WatchlistPage: React.FC = () => {
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'serie'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const [movieItems, setMovieItems] = useState<(WatchlistMovie & { details?: TmdbMovie })[]>([]);
  const [serieItems, setSerieItems] = useState<(WatchlistSerie & { details?: TmdbSerie })[]>([]);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const [moviesRes, seriesRes] = await Promise.all([
        watchlistApi.getUserMovies(),
        watchlistApi.getUserSeries(),
      ]);

      // Carrega detalhes via endpoint batch em paralelo para carregar instantaneamente
      const movieIds = moviesRes.data.map((m) => m.movieId).filter(Boolean);
      const serieIds = seriesRes.data.map((s) => s.serieId).filter(Boolean);

      const [moviesBatchRes, seriesBatchRes] = await Promise.all([
        movieIds.length
          ? movieApi.getBatch(movieIds).catch(() => ({ data: {} as Record<string, TmdbMovie> }))
          : Promise.resolve({ data: {} as Record<string, TmdbMovie> }),
        serieIds.length
          ? serieApi.getBatch(serieIds).catch(() => ({ data: {} as Record<string, TmdbSerie> }))
          : Promise.resolve({ data: {} as Record<string, TmdbSerie> }),
      ]);

      const moviesBatch = moviesBatchRes.data || {};
      const seriesBatch = seriesBatchRes.data || {};

      const loadedMovies = moviesRes.data.map((item) => ({
        ...item,
        details: moviesBatch[String(item.movieId)] || undefined,
      }));

      const loadedSeries = seriesRes.data.map((item) => ({
        ...item,
        details: seriesBatch[String(item.serieId)] || undefined,
      }));

      setMovieItems(loadedMovies);
      setSerieItems(loadedSeries);
    } catch (err) {
      toast.error('Erro ao carregar watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChangeMovie = async (movieId: number, newStatus: string) => {
    try {
      await watchlistApi.setMovieStatus(movieId, newStatus);
      setMovieItems((prev) =>
        prev.map((item) =>
          item.movieId === movieId ? { ...item, status: newStatus as WatchlistStatus } : item
        )
      );
      toast.success('Status atualizado');
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleStatusChangeSerie = async (serieId: number, newStatus: string) => {
    try {
      await watchlistApi.setSerieStatus(serieId, newStatus);
      setSerieItems((prev) =>
        prev.map((item) =>
          item.serieId === serieId ? { ...item, status: newStatus as WatchlistStatus } : item
        )
      );
      toast.success('Status atualizado');
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleRemoveMovie = async (movieId: number) => {
    try {
      await watchlistApi.removeMovie(movieId);
      setMovieItems((prev) => prev.filter((m) => m.movieId !== movieId));
      toast.info('Removido da watchlist');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const handleRemoveSerie = async (serieId: number) => {
    try {
      await watchlistApi.removeSerie(serieId);
      setSerieItems((prev) => prev.filter((s) => s.serieId !== serieId));
      toast.info('Removido da watchlist');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  // Filtragem
  const filteredMovies = movieItems.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    return true;
  });

  const filteredSeries = serieItems.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    return true;
  });

  const totalCount =
    (filterType === 'all' || filterType === 'movie' ? filteredMovies.length : 0) +
    (filterType === 'all' || filterType === 'serie' ? filteredSeries.length : 0);

  return (
    <div className="min-h-screen pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Bookmark className="w-6 h-6 text-amber-400" />
              Minha Watchlist ({totalCount})
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Controle tudo o que você planeja ver, está assistindo ou já concluiu
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Media Type Filter */}
            <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  filterType === 'all' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('movie')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  filterType === 'movie' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" /> Filmes
              </button>
              <button
                onClick={() => setFilterType('serie')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  filterType === 'serie' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" /> Séries
              </button>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="ALL">Todos os Status</option>
              <option value="PLANNING">Planejo Assistir</option>
              <option value="WATCHING">Assistindo</option>
              <option value="COMPLETED">Concluído</option>
              <option value="DROPPED">Abandonado</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800">
            <Bookmark className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-zinc-300">Nenhum título nesta seleção</h3>
            <p className="text-xs text-zinc-500 mt-1">Explore o catálogo e adicione filmes ou séries para acompanhar!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {(filterType === 'all' || filterType === 'movie') &&
              filteredMovies.map((item) => (
                <div key={`m-${item.movieId}`} className="flex flex-col gap-2">
                  <MediaCard
                    id={item.movieId}
                    title={item.details?.title || `Filme #${item.movieId}`}
                    posterPath={item.details?.poster_path || null}
                    voteAverage={item.details?.vote_average || 0}
                    releaseDate={item.details?.release_date}
                    type="movie"
                    watchlistStatusInitial={item.status}
                    onWatchlistChange={(_, status) => {
                      if (!status) handleRemoveMovie(item.movieId);
                    }}
                  />
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChangeMovie(item.movieId, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="PLANNING">Planejo</option>
                    <option value="WATCHING">Assistindo</option>
                    <option value="COMPLETED">Concluído</option>
                    <option value="DROPPED">Abandonado</option>
                  </select>
                </div>
              ))}

            {(filterType === 'all' || filterType === 'serie') &&
              filteredSeries.map((item) => (
                <div key={`s-${item.serieId}`} className="flex flex-col gap-2">
                  <MediaCard
                    id={item.serieId}
                    title={item.details?.name || `Série #${item.serieId}`}
                    posterPath={item.details?.poster_path || null}
                    voteAverage={item.details?.vote_average || 0}
                    releaseDate={item.details?.first_air_date}
                    type="serie"
                    watchlistStatusInitial={item.status}
                    onWatchlistChange={(_, status) => {
                      if (!status) handleRemoveSerie(item.serieId);
                    }}
                  />
                  <select
                    value={item.status}
                    onChange={(e) => handleStatusChangeSerie(item.serieId, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-500 font-medium"
                  >
                    <option value="PLANNING">Planejo</option>
                    <option value="WATCHING">Assistindo</option>
                    <option value="COMPLETED">Concluído</option>
                    <option value="DROPPED">Abandonado</option>
                  </select>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
