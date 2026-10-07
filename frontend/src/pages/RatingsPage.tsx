import React, { useState, useEffect } from 'react';
import { ratingApi, movieApi, serieApi, favoriteApi } from '../services/api';
import { RatingMovieResponse, RatingSerieResponse, TmdbMovie, TmdbSerie } from '../types';
import { MediaCard } from '../components/MediaCard';
import { RatingModal } from '../components/RatingModal';
import { Star, Film, Tv, Search, X, ChevronDown, Columns2, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

export const RatingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'movies' | 'series'>('movies');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(24);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const [movieRatings, setMovieRatings] = useState<(RatingMovieResponse & { details?: TmdbMovie })[]>([]);
  const [serieRatings, setSerieRatings] = useState<(RatingSerieResponse & { details?: TmdbSerie })[]>([]);
  const [favoriteMovieIds, setFavoriteMovieIds] = useState<Set<number>>(new Set());
  const [favoriteSerieIds, setFavoriteSerieIds] = useState<Set<number>>(new Set());

  // Editing state (Quick view / Edit rating modal)
  const [editingItem, setEditingItem] = useState<{
    id: number;
    title: string;
    posterPath?: string | null;
    type: 'movie' | 'serie';
    rating: number;
    comment?: string;
    rewatchCount?: number;
  } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('lms_avaliacoes_view_mode');
    if (saved === 'split' || saved === 'unified') {
      setViewMode(saved);
    }
    loadRatings();
  }, []);

  const handleViewModeChange = (mode: 'split' | 'unified') => {
    setViewMode(mode);
    localStorage.setItem('lms_avaliacoes_view_mode', mode);
  };

  useEffect(() => {
    setVisibleLimit(24);
  }, [searchQuery, activeTab, viewMode]);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const [mRes, sRes, favMRes, favSRes] = await Promise.all([
        ratingApi.getUserMovieRatings(),
        ratingApi.getUserSerieRatings(),
        favoriteApi.getUserMovies().catch(() => ({ data: [] })),
        favoriteApi.getUserSeries().catch(() => ({ data: [] })),
      ]);

      const favMSet = new Set<number>((favMRes.data || []).map((f: any) => f.movieId || f.id));
      const favSSet = new Set<number>((favSRes.data || []).map((s: any) => s.serieId || s.id));
      setFavoriteMovieIds(favMSet);
      setFavoriteSerieIds(favSSet);

      const movieIds = (mRes.data || []).map((item) => item.movieId).filter(Boolean);
      const serieIds = (sRes.data || []).map((item) => item.serieId).filter(Boolean);

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

      const loadedM = (mRes.data || []).map((item) => ({
        ...item,
        details: moviesBatch[String(item.movieId)] || undefined,
      }));

      const loadedS = (sRes.data || []).map((item) => ({
        ...item,
        details: seriesBatch[String(item.serieId)] || undefined,
      }));

      setMovieRatings(loadedM);
      setSerieRatings(loadedS);
    } catch {
      toast.error('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  };

  const q = searchQuery.toLowerCase().trim();

  const filteredMovies = movieRatings.filter((item) => {
    if (!q) return true;
    return (item.details?.title || '').toLowerCase().includes(q);
  });

  const filteredSeries = serieRatings.filter((item) => {
    if (!q) return true;
    return (item.details?.name || '').toLowerCase().includes(q);
  });

  const currentList = activeTab === 'movies' ? filteredMovies : filteredSeries;
  const totalCount = currentList.length;
  const visibleList = currentList.slice(0, visibleLimit);

  return (
    <div className="min-h-screen pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                Minhas Avaliações ({movieRatings.length + serieRatings.length})
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Revise suas notas, comentários e contadores de rewatch
              </p>
            </div>

            {/* Barra de Busca */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar avaliações por título..."
                className="w-full bg-[#14141c] border border-white/[0.08] rounded-xl pl-9 pr-9 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-yellow-500 transition-colors"
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'movies' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" /> Filmes ({filteredMovies.length})
              </button>
              <button
                onClick={() => setActiveTab('series')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  activeTab === 'series' ? 'bg-violet-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" /> Séries ({filteredSeries.length})
              </button>
            </div>

            {/* Seletor de Modo de Exibição */}
            <div className="hidden lg:flex items-center gap-1 bg-[#14141c] p-1 rounded-xl border border-white/[0.06]">
              <button
                onClick={() => handleViewModeChange('split')}
                title="Visão Lado a Lado (Filmes na Esquerda | Séries na Direita)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'split'
                    ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
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
            <div className="w-10 h-10 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : viewMode === 'split' ? (
          /* MODO LADO A LADO */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna Filmes */}
            <div className="bg-[#14141c]/40 border border-white/[0.06] rounded-2xl p-5 shadow-xl flex flex-col">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Film className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-white text-base">Filmes Avaliados</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
                  {filteredMovies.length}
                </span>
              </div>
              {filteredMovies.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/[0.06] rounded-xl bg-[#0a0a0f]/30">
                  <Film className="w-8 h-8 text-white/15 mb-2" />
                  <p className="text-white/40 text-sm font-medium">Nenhum filme avaliado</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredMovies.slice(0, visibleLimit).map((item) => (
                    <MediaCard
                      key={`split-m-${item.id}`}
                      id={item.movieId}
                      title={item.details?.title || `Filme #${item.movieId}`}
                      posterPath={item.details?.poster_path || null}
                      voteAverage={item.details?.vote_average || 0}
                      releaseDate={item.details?.release_date}
                      type="movie"
                      isFavoriteInitial={favoriteMovieIds.has(item.movieId)}
                      userRating={{
                        rating: item.rating,
                        comment: item.comment,
                        rewatchCount: item.rewatchCount,
                      }}
                      onQuickView={() =>
                        setEditingItem({
                          id: item.movieId,
                          title: item.details?.title || '',
                          posterPath: item.details?.poster_path || null,
                          type: 'movie',
                          rating: item.rating,
                          comment: item.comment,
                          rewatchCount: item.rewatchCount,
                        })
                      }
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
                  <h3 className="font-bold text-white text-base">Séries Avaliadas</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-bold">
                  {filteredSeries.length}
                </span>
              </div>
              {filteredSeries.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center border border-dashed border-white/[0.06] rounded-xl bg-[#0a0a0f]/30">
                  <Tv className="w-8 h-8 text-white/15 mb-2" />
                  <p className="text-white/40 text-sm font-medium">Nenhuma série avaliada</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredSeries.slice(0, visibleLimit).map((item) => (
                    <MediaCard
                      key={`split-s-${item.id}`}
                      id={item.serieId}
                      title={item.details?.name || `Série #${item.serieId}`}
                      posterPath={item.details?.poster_path || null}
                      voteAverage={item.details?.vote_average || 0}
                      releaseDate={item.details?.first_air_date}
                      type="serie"
                      isFavoriteInitial={favoriteSerieIds.has(item.serieId)}
                      userRating={{
                        rating: item.rating,
                        comment: item.comment,
                        rewatchCount: item.rewatchCount,
                      }}
                      onQuickView={() =>
                        setEditingItem({
                          id: item.serieId,
                          title: item.details?.name || '',
                          posterPath: item.details?.poster_path || null,
                          type: 'serie',
                          rating: item.rating,
                          comment: item.comment,
                          rewatchCount: item.rewatchCount,
                        })
                      }
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
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#14141c] border border-white/[0.08] hover:border-yellow-400 text-yellow-400 font-semibold transition-all hover:bg-zinc-800 shadow-lg text-sm"
                >
                  <ChevronDown className="w-4 h-4" />
                  Carregar mais avaliações ({Math.max(0, filteredMovies.length - visibleLimit) + Math.max(0, filteredSeries.length - visibleLimit)} restantes)
                </button>
              </div>
            )}
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-20 bg-[#14141c]/40 rounded-2xl border border-white/[0.06]">
            <Star className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-zinc-300">
              {searchQuery
                ? `Nenhum resultado para "${searchQuery}"`
                : activeTab === 'movies'
                ? 'Nenhum filme avaliado ainda'
                : 'Nenhuma série avaliada ainda'}
            </h3>
          </div>
        ) : (
          <div>
            {activeTab === 'movies' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {(visibleList as (RatingMovieResponse & { details?: TmdbMovie })[]).map((item) => (
                  <MediaCard
                    key={`m-${item.id}`}
                    id={item.movieId}
                    title={item.details?.title || `Filme #${item.movieId}`}
                    posterPath={item.details?.poster_path || null}
                    voteAverage={item.details?.vote_average || 0}
                    releaseDate={item.details?.release_date}
                    type="movie"
                    isFavoriteInitial={favoriteMovieIds.has(item.movieId)}
                    userRating={{
                      rating: item.rating,
                      comment: item.comment,
                      rewatchCount: item.rewatchCount,
                    }}
                    onQuickView={() =>
                      setEditingItem({
                        id: item.movieId,
                        title: item.details?.title || '',
                        posterPath: item.details?.poster_path || null,
                        type: 'movie',
                        rating: item.rating,
                        comment: item.comment,
                        rewatchCount: item.rewatchCount,
                      })
                    }
                  />
                ))}
              </div>
            )}

            {activeTab === 'series' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {(visibleList as (RatingSerieResponse & { details?: TmdbSerie })[]).map((item) => (
                  <MediaCard
                    key={`s-${item.id}`}
                    id={item.serieId}
                    title={item.details?.name || `Série #${item.serieId}`}
                    posterPath={item.details?.poster_path || null}
                    voteAverage={item.details?.vote_average || 0}
                    releaseDate={item.details?.first_air_date}
                    type="serie"
                    isFavoriteInitial={favoriteSerieIds.has(item.serieId)}
                    userRating={{
                      rating: item.rating,
                      comment: item.comment,
                      rewatchCount: item.rewatchCount,
                    }}
                    onQuickView={() =>
                      setEditingItem({
                        id: item.serieId,
                        title: item.details?.name || '',
                        posterPath: item.details?.poster_path || null,
                        type: 'serie',
                        rating: item.rating,
                        comment: item.comment,
                        rewatchCount: item.rewatchCount,
                      })
                    }
                  />
                ))}
              </div>
            )}

            {/* Botão Carregar Mais */}
            {visibleLimit < totalCount && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setVisibleLimit((prev) => prev + 24)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#14141c] border border-white/[0.08] hover:border-yellow-400 text-yellow-400 font-semibold transition-all hover:bg-zinc-800 shadow-lg text-sm"
                >
                  <ChevronDown className="w-4 h-4" />
                  Carregar mais avaliações ({totalCount - visibleLimit} restantes)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {editingItem && (
        <RatingModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          mediaId={editingItem.id}
          mediaType={editingItem.type}
          mediaTitle={editingItem.title}
          posterPath={editingItem.posterPath}
          initialRating={editingItem.rating}
          initialComment={editingItem.comment || ''}
          initialRewatchCount={editingItem.rewatchCount || 0}
          onSuccess={loadRatings}
        />
      )}
    </div>
  );
};
