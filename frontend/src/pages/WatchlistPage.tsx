import React, { useState, useEffect } from 'react';
import { watchlistApi, movieApi, serieApi } from '../services/api';
import { WatchlistMovie, WatchlistSerie, WatchlistStatus, TmdbMovie, TmdbSerie } from '../types';
import { MediaCard } from '../components/MediaCard';
import { Bookmark, Film, Tv, Filter, CheckCircle2, Search, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export const WatchlistPage: React.FC = () => {
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'serie'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(24);
  const [loading, setLoading] = useState(true);

  const [movieItems, setMovieItems] = useState<(WatchlistMovie & { details?: TmdbMovie })[]>([]);
  const [serieItems, setSerieItems] = useState<(WatchlistSerie & { details?: TmdbSerie })[]>([]);

  useEffect(() => {
    loadWatchlist();
  }, []);

  useEffect(() => {
    setVisibleLimit(24);
  }, [searchQuery, filterType, statusFilter]);

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const [moviesRes, seriesRes] = await Promise.all([
        watchlistApi.getUserMovies(),
        watchlistApi.getUserSeries(),
      ]);

      const movieIds = (moviesRes.data || []).map((m) => m.movieId).filter(Boolean);
      const serieIds = (seriesRes.data || []).map((s) => s.serieId).filter(Boolean);

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

      const loadedMovies = (moviesRes.data || []).map((item) => ({
        ...item,
        details: moviesBatch[String(item.movieId)] || undefined,
      }));

      const loadedSeries = (seriesRes.data || []).map((item) => ({
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

  // Filtragem com suporte a texto de busca
  const q = searchQuery.toLowerCase().trim();
  const filteredMovies = movieItems.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (q) {
      const title = (item.details?.title || '').toLowerCase();
      if (!title.includes(q)) return false;
    }
    return true;
  });

  const filteredSeries = serieItems.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (q) {
      const name = (item.details?.name || '').toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });

  // Lista unificada para controle de exibição progressiva
  type UnifiedItem =
    | { type: 'movie'; data: WatchlistMovie & { details?: TmdbMovie } }
    | { type: 'serie'; data: WatchlistSerie & { details?: TmdbSerie } };

  const unifiedList: UnifiedItem[] = [];
  if (filterType === 'all' || filterType === 'movie') {
    filteredMovies.forEach((m) => unifiedList.push({ type: 'movie', data: m }));
  }
  if (filterType === 'all' || filterType === 'serie') {
    filteredSeries.forEach((s) => unifiedList.push({ type: 'serie', data: s }));
  }

  const totalCount = unifiedList.length;
  const visibleItems = unifiedList.slice(0, visibleLimit);

  return (
    <div className="min-h-screen pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Bookmark className="w-6 h-6 text-amber-400" />
                Minha Watchlist ({totalCount})
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Controle tudo o que você planeja ver, está assistindo ou já concluiu
              </p>
            </div>

            {/* Barra de Busca */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título na watchlist..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-9 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  title="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filtros de Tipo e Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/60">
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
            <h3 className="text-lg font-bold text-zinc-300">Nenhum título encontrado</h3>
            <p className="text-xs text-zinc-500 mt-1">
              {searchQuery
                ? `Nenhum resultado corresponde a "${searchQuery}".`
                : 'Explore o catálogo e adicione filmes ou séries para acompanhar!'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {visibleItems.map((entry) => {
                if (entry.type === 'movie') {
                  const item = entry.data as WatchlistMovie & { details?: TmdbMovie };
                  return (
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
                  );
                } else {
                  const item = entry.data as WatchlistSerie & { details?: TmdbSerie };
                  return (
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
                  );
                }
              })}
            </div>

            {/* Botão para Continuar Buscando / Carregar Mais */}
            {visibleLimit < totalCount && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setVisibleLimit((prev) => prev + 24)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-amber-400 font-semibold transition-all hover:bg-zinc-800 shadow-lg text-sm"
                >
                  <ChevronDown className="w-4 h-4" />
                  Carregar mais títulos ({totalCount - visibleLimit} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
