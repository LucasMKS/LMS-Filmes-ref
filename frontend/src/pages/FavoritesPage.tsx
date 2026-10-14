import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { favoriteApi, movieApi, serieApi } from '../services/api';
import { TmdbMovie, TmdbSerie } from '../types';
import { MediaCard } from '../components/MediaCard';
import { useUserRatingsStore } from '../store/useUserRatingsStore';
import { Heart, Film, Tv, Trash2, Search, X, ChevronDown, Columns2, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

export const FavoritesPage: React.FC = () => {
  const { movieRatings, serieRatings } = useUserRatingsStore();
  const [activeTab, setActiveTab] = useState<'movies' | 'series'>('movies');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(24);
  const [favoriteMovies, setFavoriteMovies] = useState<TmdbMovie[]>(() => {
    try {
      const c = sessionStorage.getItem('lms_fav_cached_movies');
      return c ? JSON.parse(c) : [];
    } catch {
      return [];
    }
  });
  const [favoriteSeries, setFavoriteSeries] = useState<TmdbSerie[]>(() => {
    try {
      const c = sessionStorage.getItem('lms_fav_cached_series');
      return c ? JSON.parse(c) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(() => {
    try {
      const m = sessionStorage.getItem('lms_fav_cached_movies');
      const s = sessionStorage.getItem('lms_fav_cached_series');
      return !(m || s);
    } catch {
      return true;
    }
  });
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  useEffect(() => {
    const saved = localStorage.getItem('lms_favoritos_view_mode');
    if (saved === 'split' || saved === 'unified') {
      setViewMode(saved);
    }
    loadFavorites();
  }, []);

  const handleViewModeChange = (mode: 'split' | 'unified') => {
    setViewMode(mode);
    localStorage.setItem('lms_favoritos_view_mode', mode);
  };

  useEffect(() => {
    setVisibleLimit(24);
  }, [searchQuery, activeTab, viewMode]);

  const loadFavorites = async () => {
    try {
      const [moviesRes, seriesRes] = await Promise.all([
        favoriteApi.getUserMovies(),
        favoriteApi.getUserSeries(),
      ]);

      const movieIds = (moviesRes.data || []).map((f: any) => f.movieId || f.id).filter(Boolean);
      const serieIds = (seriesRes.data || []).map((s: any) => s.serieId || s.id).filter(Boolean);

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

      const rawMovies = moviesRes.data || [];
      const rawSeries = seriesRes.data || [];

      const loadedMovies = rawMovies
        .map((f: any) => {
          const mid = f.movieId || f.id;
          const b = moviesBatch[String(mid)];
          if (b) return b;
          if (f.title || mid) {
            return {
              id: Number(mid),
              title: f.title || `Filme #${mid}`,
              poster_path: f.poster_path || f.posterPath || null,
              vote_average: 0,
              overview: '',
              release_date: '',
            } as TmdbMovie;
          }
          return null;
        })
        .filter(Boolean) as TmdbMovie[];

      const loadedSeries = rawSeries
        .map((s: any) => {
          const sid = s.serieId || s.id;
          const b = seriesBatch[String(sid)];
          if (b) return b;
          if (s.title || sid) {
            return {
              id: Number(sid),
              name: s.title || `Série #${sid}`,
              poster_path: s.poster_path || s.posterPath || null,
              vote_average: 0,
              overview: '',
              first_air_date: '',
            } as TmdbSerie;
          }
          return null;
        })
        .filter(Boolean) as TmdbSerie[];

      setFavoriteMovies(loadedMovies);
      setFavoriteSeries(loadedSeries);

      try {
        sessionStorage.setItem('lms_fav_cached_movies', JSON.stringify(loadedMovies));
        sessionStorage.setItem('lms_fav_cached_series', JSON.stringify(loadedSeries));
      } catch {}
    } catch {
      toast.error('Erro ao carregar favoritos');
    } finally {
      setLoading(false);
    }
  };

  const q = searchQuery.toLowerCase().trim();

  const filteredMovies = favoriteMovies.filter((movie) => {
    if (!q) return true;
    return (movie.title || '').toLowerCase().includes(q);
  });

  const filteredSeries = favoriteSeries.filter((serie) => {
    if (!q) return true;
    return (serie.name || '').toLowerCase().includes(q);
  });

  const getCurrentList = () => {
    if (activeTab === 'movies') return filteredMovies;
    return filteredSeries;
  };

  const currentList = getCurrentList();
  const totalCount = currentList.length;
  const visibleList = currentList.slice(0, visibleLimit);

  return (
    <div className="min-h-screen pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                Meus Favoritos
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Todos os seus filmes e séries favoritos em um só lugar
              </p>
            </div>

            {/* Barra de Busca */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar em favoritos..."
                className="w-full bg-[#14141c] border border-white/[0.08] rounded-xl pl-9 pr-9 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
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

          {/* Abas e Seletor de Layout */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center bg-[#14141c] p-1 rounded-xl border border-white/[0.06] text-xs">
              <button
                onClick={() => setActiveTab('movies')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'movies' ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" /> Filmes ({filteredMovies.length})
              </button>
              <button
                onClick={() => setActiveTab('series')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeTab === 'series' ? 'bg-violet-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" /> Séries ({filteredSeries.length})
              </button>
            </div>

            {/* Layout Toggle (Desktop) */}
              <div className="hidden lg:flex items-center gap-1 bg-[#14141c] p-1 rounded-xl border border-white/[0.06]">
                <button
                  onClick={() => handleViewModeChange('split')}
                  title="Visão Lado a Lado (Filmes na Esquerda | Séries na Direita)"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'split'
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  <span>Lado a Lado</span>
                </button>
                <button
                  onClick={() => handleViewModeChange('unified')}
                  title="Grid Padrão por Aba"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'unified'
                      ? 'bg-white/10 text-white border border-white/10'
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid Padrão</span>
                </button>
              </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : viewMode === 'split' ? (
          /* MODO LADO A LADO (FILMES X SÉRIES) */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna Filmes */}
            <div className="bg-[#14141c]/40 border border-white/[0.06] rounded-2xl p-5 shadow-xl flex flex-col">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Film className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-white text-base">Filmes Favoritos</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
                  {filteredMovies.length}
                </span>
              </div>
              {filteredMovies.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/[0.06] rounded-xl bg-[#0a0a0f]/30">
                  <Film className="w-8 h-8 text-white/15 mb-2" />
                  <p className="text-white/40 text-sm font-medium">Nenhum filme favorito</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredMovies.slice(0, visibleLimit).map((movie) => (
                    <MediaCard
                      key={`split-m-${movie.id}`}
                      id={movie.id}
                      title={movie.title}
                      posterPath={movie.poster_path}
                      voteAverage={movie.vote_average}
                      releaseDate={movie.release_date}
                      type="movie"
                      isFavoriteInitial={true}
                      userRating={movieRatings[movie.id] || null}
                      onFavoriteChange={(id, isFav) => {
                        if (!isFav) setFavoriteMovies((prev) => prev.filter((m) => m.id !== id));
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Coluna Séries */}
            <div className="bg-[#14141c]/40 border border-white/[0.06] rounded-2xl p-5 shadow-xl flex flex-col">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
                    <Tv className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-white text-base">Séries Favoritas</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold">
                  {filteredSeries.length}
                </span>
              </div>
              {filteredSeries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/[0.06] rounded-xl bg-[#0a0a0f]/30">
                  <Tv className="w-8 h-8 text-white/15 mb-2" />
                  <p className="text-white/40 text-sm font-medium">Nenhuma série favorita</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredSeries.slice(0, visibleLimit).map((serie) => (
                    <MediaCard
                      key={`split-s-${serie.id}`}
                      id={serie.id}
                      title={serie.name}
                      posterPath={serie.poster_path}
                      voteAverage={serie.vote_average}
                      releaseDate={serie.first_air_date}
                      type="serie"
                      isFavoriteInitial={true}
                      userRating={serieRatings[serie.id] || null}
                      onFavoriteChange={(id, isFav) => {
                        if (!isFav) setFavoriteSeries((prev) => prev.filter((s) => s.id !== id));
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
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#14141c] border border-white/[0.08] hover:border-pink-400 text-pink-400 font-semibold transition-all hover:bg-zinc-800 shadow-lg text-sm"
                >
                  <ChevronDown className="w-4 h-4" />
                  Carregar mais favoritos ({Math.max(0, filteredMovies.length - visibleLimit) + Math.max(0, filteredSeries.length - visibleLimit)} restantes)
                </button>
              </div>
            )}
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-20 bg-[#14141c]/40 rounded-2xl border border-white/[0.06]">
            {activeTab === 'movies' && <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />}
            {activeTab === 'series' && <Tv className="w-12 h-12 text-zinc-600 mx-auto mb-3" />}
            <h3 className="text-lg font-bold text-zinc-300">
              {searchQuery ? `Nenhum resultado para "${searchQuery}"` : 'Nenhum favorito encontrado nesta categoria'}
            </h3>
          </div>
        ) : (
          <div>
            {activeTab === 'movies' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {(visibleList as TmdbMovie[]).map((movie) => (
                  <MediaCard
                    key={movie.id}
                    id={movie.id}
                    title={movie.title}
                    posterPath={movie.poster_path}
                    voteAverage={movie.vote_average}
                    releaseDate={movie.release_date}
                    type="movie"
                    isFavoriteInitial={true}
                    userRating={movieRatings[movie.id] || null}
                    onFavoriteChange={(id, isFav) => {
                      if (!isFav) setFavoriteMovies((prev) => prev.filter((m) => m.id !== id));
                    }}
                  />
                ))}
              </div>
            )}

            {activeTab === 'series' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {(visibleList as TmdbSerie[]).map((serie) => (
                  <MediaCard
                    key={serie.id}
                    id={serie.id}
                    title={serie.name}
                    posterPath={serie.poster_path}
                    voteAverage={serie.vote_average}
                    releaseDate={serie.first_air_date}
                    type="serie"
                    isFavoriteInitial={true}
                    userRating={serieRatings[serie.id] || null}
                    onFavoriteChange={(id, isFav) => {
                      if (!isFav) setFavoriteSeries((prev) => prev.filter((s) => s.id !== id));
                    }}
                  />
                ))}
              </div>
            )}

            {/* Botão Carregar Mais */}
            {visibleLimit < totalCount && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setVisibleLimit((prev) => prev + 24)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#14141c] border border-white/[0.08] hover:border-pink-400 text-pink-400 font-semibold transition-all hover:bg-zinc-800 shadow-lg text-sm"
                >
                  <ChevronDown className="w-4 h-4" />
                  Carregar mais favoritos ({totalCount - visibleLimit} restantes)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
