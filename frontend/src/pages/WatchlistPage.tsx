import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { watchlistApi, movieApi, serieApi } from '../services/api';
import { WatchlistMovie, WatchlistSerie, WatchlistStatus, TmdbMovie, TmdbSerie } from '../types';
import { MediaCard } from '../components/MediaCard';
import { useUserRatingsStore } from '../store/useUserRatingsStore';
import { Bookmark, Film, Tv, Search, X, ChevronDown, Columns2, LayoutGrid, Dices } from 'lucide-react';
import { toast } from 'sonner';

export const WatchlistPage: React.FC = () => {
  const { movieRatings, serieRatings } = useUserRatingsStore();
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'serie'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(24);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('unified');

  const [movieItems, setMovieItems] = useState<(WatchlistMovie & { details?: TmdbMovie })[]>(() => {
    try {
      const cached = sessionStorage.getItem('lms_wl_cached_movies');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [serieItems, setSerieItems] = useState<(WatchlistSerie & { details?: TmdbSerie })[]>(() => {
    try {
      const cached = sessionStorage.getItem('lms_wl_cached_series');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(() => {
    try {
      const hasMovies = sessionStorage.getItem('lms_wl_cached_movies');
      const hasSeries = sessionStorage.getItem('lms_wl_cached_series');
      return !(hasMovies || hasSeries);
    } catch {
      return true;
    }
  });

  // Roleta Aleatória
  const [randomItem, setRandomItem] = useState<{
    id: number;
    title: string;
    poster: string | null;
    type: 'movie' | 'serie';
  } | null>(null);
  const [isRandomDialogOpen, setIsRandomDialogOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('lms_watchlist_view_mode');
    if (saved === 'split' || saved === 'unified') {
      setViewMode(saved);
    }
    loadWatchlist();
  }, []);

  const handleViewModeChange = (mode: 'split' | 'unified') => {
    setViewMode(mode);
    localStorage.setItem('lms_watchlist_view_mode', mode);
  };

  useEffect(() => {
    setVisibleLimit(24);
  }, [searchQuery, filterType, viewMode]);

  const loadWatchlist = async () => {
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

      try {
        sessionStorage.setItem('lms_wl_cached_movies', JSON.stringify(loadedMovies));
        sessionStorage.setItem('lms_wl_cached_series', JSON.stringify(loadedSeries));
      } catch {
        // quota exceeded or private mode
      }
    } catch {
      toast.error('Erro ao carregar watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMovie = async (movieId: number) => {
    try {
      await watchlistApi.removeMovie(movieId);
      setMovieItems((prev) => {
        const next = prev.filter((m) => m.movieId !== movieId);
        try {
          sessionStorage.setItem('lms_wl_cached_movies', JSON.stringify(next));
        } catch {}
        return next;
      });
      toast.info('Removido da watchlist');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const handleRemoveSerie = async (serieId: number) => {
    try {
      await watchlistApi.removeSerie(serieId);
      setSerieItems((prev) => {
        const next = prev.filter((s) => s.serieId !== serieId);
        try {
          sessionStorage.setItem('lms_wl_cached_series', JSON.stringify(next));
        } catch {}
        return next;
      });
      toast.info('Removido da watchlist');
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const handleRandomPick = () => {
    const listToPick: { id: number; title: string; poster: string | null; type: 'movie' | 'serie' }[] = [];
    if (filterType === 'all' || filterType === 'movie') {
      filteredMovies.forEach((m) => {
        listToPick.push({
          id: m.movieId,
          title: m.details?.title || `Filme #${m.movieId}`,
          poster: m.details?.poster_path || null,
          type: 'movie',
        });
      });
    }
    if (filterType === 'all' || filterType === 'serie') {
      filteredSeries.forEach((s) => {
        listToPick.push({
          id: s.serieId,
          title: s.details?.name || `Série #${s.serieId}`,
          poster: s.details?.poster_path || null,
          type: 'serie',
        });
      });
    }

    if (listToPick.length === 0) {
      toast.error('Nenhum título disponível nos filtros atuais para sortear!');
      return;
    }

    setIsRandomDialogOpen(true);
    setIsSpinning(true);
    let counter = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * listToPick.length);
      setRandomItem(listToPick[randomIndex]);
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  // Filtragem com suporte a texto de busca
  const q = searchQuery.toLowerCase().trim();
  const filteredMovies = movieItems.filter((item) => {
    if (q) {
      const title = (item.details?.title || '').toLowerCase();
      if (!title.includes(q)) return false;
    }
    return true;
  });

  const filteredSeries = serieItems.filter((item) => {
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
                <Bookmark className="w-6 h-6 text-emerald-400" />
                Minha Watchlist ({movieItems.length + serieItems.length})
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Filmes e séries que você quer assistir
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
                className="w-full bg-[#14141c] border border-white/[0.08] rounded-xl pl-9 pr-9 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
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

          {/* Filtros de Tipo e Seletor de Layout */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-3">
              {/* Media Type Filter */}
              <div className="flex items-center bg-[#14141c] p-1 rounded-xl border border-white/[0.06] text-xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    filterType === 'all' ? 'bg-emerald-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType('movie')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    filterType === 'movie' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" /> Filmes ({filteredMovies.length})
                </button>
                <button
                  onClick={() => setFilterType('serie')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    filterType === 'serie' ? 'bg-violet-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" /> Séries ({filteredSeries.length})
                </button>
              </div>
            </div>

            {/* Botão da Roleta e Seletor de Visualização */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRandomPick}
                title="Sortear o que assistir da Watchlist"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 shadow-md cursor-pointer"
              >
                <Dices className="w-4 h-4" />
                <span>Roleta</span>
              </button>

              <div className="hidden lg:flex items-center gap-1 bg-[#14141c] p-1 rounded-xl border border-white/[0.06]">
                <button
                  onClick={() => handleViewModeChange('split')}
                title="Lado a Lado (Filmes na Esquerda | Séries na Direita)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'split'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Lado a Lado</span>
              </button>
              <button
                onClick={() => handleViewModeChange('unified')}
                title="Grid Único"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'unified'
                    ? 'bg-white/10 text-white border border-white/10'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid Único</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredMovies.length === 0 && filteredSeries.length === 0 ? (
          <div className="text-center py-20 bg-[#14141c]/50 rounded-2xl border border-white/[0.06]">
            <Bookmark className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-zinc-300">Nenhum título encontrado</h3>
            <p className="text-xs text-zinc-500 mt-1">
              {searchQuery
                ? `Nenhum resultado corresponde a "${searchQuery}".`
                : 'Explore o catálogo e adicione filmes ou séries para acompanhar!'}
            </p>
          </div>
        ) : viewMode === 'split' ? (
          /* MODO LADO A LADO (SPLIT VIEW) */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna da Esquerda: Filmes */}
            <div className="bg-[#14141c]/40 border border-white/[0.06] rounded-2xl p-5 shadow-xl flex flex-col">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Film className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-white text-base">Filmes na Watchlist</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
                  {filteredMovies.length}
                </span>
              </div>
              {filteredMovies.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/[0.06] rounded-xl bg-[#0a0a0f]/30">
                  <Film className="w-8 h-8 text-white/15 mb-2" />
                  <p className="text-white/40 text-sm font-medium">Nenhum filme encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredMovies.slice(0, visibleLimit).map((item) => (
                    <MediaCard
                      key={`split-m-${item.movieId}`}
                      id={item.movieId}
                      title={item.details?.title || `Filme #${item.movieId}`}
                      posterPath={item.details?.poster_path || null}
                      voteAverage={item.details?.vote_average || 0}
                      releaseDate={item.details?.release_date}
                      type="movie"
                      userRating={movieRatings[item.movieId] || null}
                      onWatchlistChange={(_, status) => {
                        if (!status) handleRemoveMovie(item.movieId);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Coluna da Direita: Séries */}
            <div className="bg-[#14141c]/40 border border-white/[0.06] rounded-2xl p-5 shadow-xl flex flex-col">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                    <Tv className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-white text-base">Séries na Watchlist</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold">
                  {filteredSeries.length}
                </span>
              </div>
              {filteredSeries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/[0.06] rounded-xl bg-[#0a0a0f]/30">
                  <Tv className="w-8 h-8 text-white/15 mb-2" />
                  <p className="text-white/40 text-sm font-medium">Nenhuma série encontrada</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredSeries.slice(0, visibleLimit).map((item) => (
                    <MediaCard
                      key={`split-s-${item.serieId}`}
                      id={item.serieId}
                      title={item.details?.name || `Série #${item.serieId}`}
                      posterPath={item.details?.poster_path || null}
                      voteAverage={item.details?.vote_average || 0}
                      releaseDate={item.details?.first_air_date}
                      type="serie"
                      userRating={serieRatings[item.serieId] || null}
                      onWatchlistChange={(_, status) => {
                        if (!status) handleRemoveSerie(item.serieId);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Botão Carregar Mais em Lado a Lado */}
            {(filteredMovies.length > visibleLimit || filteredSeries.length > visibleLimit) && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setVisibleLimit((prev) => prev + 24)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#14141c] border border-white/[0.08] hover:border-emerald-400 text-emerald-400 font-semibold transition-all hover:bg-zinc-800 shadow-lg text-sm"
                >
                  <ChevronDown className="w-4 h-4" />
                  Carregar mais títulos ({Math.max(0, filteredMovies.length - visibleLimit) + Math.max(0, filteredSeries.length - visibleLimit)} restantes)
                </button>
              </div>
            )}
          </div>
        ) : (
          /* MODO UNIFICADO */
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {visibleItems.map((entry) => {
                if (entry.type === 'movie') {
                  const item = entry.data as WatchlistMovie & { details?: TmdbMovie };
                  return (
                    <MediaCard
                      key={`m-${item.movieId}`}
                      id={item.movieId}
                      title={item.details?.title || `Filme #${item.movieId}`}
                      posterPath={item.details?.poster_path || null}
                      voteAverage={item.details?.vote_average || 0}
                      releaseDate={item.details?.release_date}
                      type="movie"
                      userRating={movieRatings[item.movieId] || null}
                      onWatchlistChange={(_, status) => {
                        if (!status) handleRemoveMovie(item.movieId);
                      }}
                    />
                  );
                } else {
                  const item = entry.data as WatchlistSerie & { details?: TmdbSerie };
                  return (
                    <MediaCard
                      key={`s-${item.serieId}`}
                      id={item.serieId}
                      title={item.details?.name || `Série #${item.serieId}`}
                      posterPath={item.details?.poster_path || null}
                      voteAverage={item.details?.vote_average || 0}
                      releaseDate={item.details?.first_air_date}
                      type="serie"
                      userRating={serieRatings[item.serieId] || null}
                      onWatchlistChange={(_, status) => {
                        if (!status) handleRemoveSerie(item.serieId);
                      }}
                    />
                  );
                }
              })}
            </div>

            {/* Botão Carregar Mais */}
            {visibleLimit < totalCount && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setVisibleLimit((prev) => prev + 24)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#14141c] border border-white/[0.08] hover:border-emerald-400 text-emerald-400 font-semibold transition-all hover:bg-zinc-800 shadow-lg text-sm"
                >
                  <ChevronDown className="w-4 h-4" />
                  Carregar mais títulos ({totalCount - visibleLimit} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal da Roleta da Watchlist */}
      {isRandomDialogOpen && randomItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#14141c] border border-white/[0.1] p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl transition-all duration-300">
            <h2 className="mb-2 text-xl sm:text-2xl font-black text-white">
              {isSpinning ? 'Girando a Roleta...' : 'A Roleta Escolheu!'}
            </h2>
            <p className="mb-6 text-xs sm:text-sm text-zinc-400">
              {isSpinning ? 'Buscando nos seus títulos da Watchlist...' : 'Você vai assistir:'}
            </p>

            <div className="relative mx-auto mb-5 w-40 h-60 sm:w-44 sm:h-64 rounded-2xl overflow-hidden border-4 shadow-xl transition-all duration-200 bg-zinc-950 flex items-center justify-center">
              {randomItem.poster ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${randomItem.poster}`}
                  alt={randomItem.title}
                  className={`w-full h-full object-cover transition-all duration-200 ${
                    isSpinning ? 'scale-90 opacity-60 blur-[3px]' : 'scale-100 opacity-100 blur-0'
                  }`}
                />
              ) : (
                <div className="text-zinc-600 font-bold text-xs p-4">Sem pôster</div>
              )}
            </div>

            <div className="mb-6">
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {randomItem.type === 'movie' ? 'Filme' : 'Série'}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2">
                {randomItem.title}
              </h3>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsRandomDialogOpen(false);
                  setRandomItem(null);
                }}
                disabled={isSpinning}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
              >
                Fechar
              </button>
              <Link
                to={randomItem.type === 'movie' ? `/filmes/${randomItem.id}` : `/series/${randomItem.id}`}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 ${
                  isSpinning ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                Ver Detalhes
              </Link>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
