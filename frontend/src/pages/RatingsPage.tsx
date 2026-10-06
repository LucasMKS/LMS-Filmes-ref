import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ratingApi, movieApi, serieApi } from '../services/api';
import { RatingMovieResponse, RatingSerieResponse, TmdbMovie, TmdbSerie } from '../types';
import { RatingModal } from '../components/RatingModal';
import { Star, Film, Tv, MessageSquare, RotateCcw, Edit3, Search, X, ChevronDown, Columns2, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

export const RatingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'movies' | 'series'>('movies');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(24);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const [movieRatings, setMovieRatings] = useState<(RatingMovieResponse & { details?: TmdbMovie })[]>([]);
  const [serieRatings, setSerieRatings] = useState<(RatingSerieResponse & { details?: TmdbSerie })[]>([]);

  // Editing state
  const [editingItem, setEditingItem] = useState<{
    id: number;
    title: string;
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
      const [mRes, sRes] = await Promise.all([
        ratingApi.getUserMovieRatings(),
        ratingApi.getUserSerieRatings(),
      ]);

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

  const renderMovieRatingCard = (item: RatingMovieResponse & { details?: TmdbMovie }) => (
    <div
      key={`m-${item.id}`}
      className="flex gap-4 p-4 rounded-2xl bg-[#14141c] border border-white/[0.06] hover:border-purple-500/20 hover:-translate-y-1 transition-all duration-300 shadow-xl"
    >
      <Link to={`/filmes/${item.movieId}`} className="w-20 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 relative">
        <img
          src={
            item.details?.poster_path
              ? `https://image.tmdb.org/t/p/w200${item.details.poster_path}`
              : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=200'
          }
          alt={item.details?.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-purple-600/90 text-[9px] font-bold text-white flex items-center gap-0.5">
          <Film className="w-2.5 h-2.5" />
        </div>
      </Link>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1">
            <Link
              to={`/filmes/${item.movieId}`}
              className="font-bold text-sm text-white/90 hover:text-purple-300 truncate max-w-[170px]"
            >
              {item.details?.title || `Filme #${item.movieId}`}
            </Link>
            <button
              onClick={() =>
                setEditingItem({
                  id: item.movieId,
                  title: item.details?.title || '',
                  type: 'movie',
                  rating: item.rating,
                  comment: item.comment,
                  rewatchCount: item.rewatchCount,
                })
              }
              className="text-zinc-500 hover:text-amber-400 p-1"
              title="Editar avaliação"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1 text-yellow-300 font-extrabold text-sm bg-yellow-500/15 border border-yellow-500/30 px-2 py-0.5 rounded-lg shadow-sm">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span>{item.rating != null ? Number(item.rating).toFixed(1) : '0.0'}</span>
            </div>
            {item.rewatchCount && item.rewatchCount > 0 ? (
              <span className="text-[11px] text-purple-300 bg-purple-500/15 border border-purple-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 font-semibold">
                <RotateCcw className="w-3 h-3 text-purple-400" /> {item.rewatchCount}x
              </span>
            ) : null}
          </div>

          {item.comment && (
            <p className="text-xs text-zinc-300 italic mt-2 line-clamp-2 bg-[#0a0a0f]/40 p-1.5 rounded-lg border border-white/[0.04]">
              "{item.comment}"
            </p>
          )}
        </div>

        <div className="text-[10px] text-zinc-500 mt-2 font-medium">
          Avaliado em: {new Date(item.ratedAt).toLocaleDateString('pt-BR')}
        </div>
      </div>
    </div>
  );

  const renderSerieRatingCard = (item: RatingSerieResponse & { details?: TmdbSerie }) => (
    <div
      key={`s-${item.id}`}
      className="flex gap-4 p-4 rounded-2xl bg-[#14141c] border border-white/[0.06] hover:border-violet-500/20 hover:-translate-y-1 transition-all duration-300 shadow-xl"
    >
      <Link to={`/series/${item.serieId}`} className="w-20 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 relative">
        <img
          src={
            item.details?.poster_path
              ? `https://image.tmdb.org/t/p/w200${item.details.poster_path}`
              : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=200'
          }
          alt={item.details?.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-violet-600/90 text-[9px] font-bold text-white flex items-center gap-0.5">
          <Tv className="w-2.5 h-2.5" />
        </div>
      </Link>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1">
            <Link
              to={`/series/${item.serieId}`}
              className="font-bold text-sm text-white/90 hover:text-violet-300 truncate max-w-[170px]"
            >
              {item.details?.name || `Série #${item.serieId}`}
            </Link>
            <button
              onClick={() =>
                setEditingItem({
                  id: item.serieId,
                  title: item.details?.name || '',
                  type: 'serie',
                  rating: item.rating,
                  comment: item.comment,
                  rewatchCount: item.rewatchCount,
                })
              }
              className="text-zinc-500 hover:text-amber-400 p-1"
              title="Editar avaliação"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1 text-yellow-300 font-extrabold text-sm bg-yellow-500/15 border border-yellow-500/30 px-2 py-0.5 rounded-lg shadow-sm">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span>{item.rating != null ? Number(item.rating).toFixed(1) : '0.0'}</span>
            </div>
            {item.rewatchCount && item.rewatchCount > 0 ? (
              <span className="text-[11px] text-violet-300 bg-violet-500/15 border border-violet-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1 font-semibold">
                <RotateCcw className="w-3 h-3 text-violet-400" /> {item.rewatchCount}x
              </span>
            ) : null}
          </div>

          {item.comment && (
            <p className="text-xs text-zinc-300 italic mt-2 line-clamp-2 bg-[#0a0a0f]/40 p-1.5 rounded-lg border border-white/[0.04]">
              "{item.comment}"
            </p>
          )}
        </div>

        <div className="text-[10px] text-zinc-500 mt-2 font-medium">
          Avaliado em: {new Date(item.ratedAt).toLocaleDateString('pt-BR')}
        </div>
      </div>
    </div>
  );

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
                <div className="flex flex-col gap-4">
                  {filteredMovies.slice(0, visibleLimit).map(renderMovieRatingCard)}
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
                <div className="flex flex-col gap-4">
                  {filteredSeries.slice(0, visibleLimit).map(renderSerieRatingCard)}
                </div>
              )}
            </div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(visibleList as (RatingMovieResponse & { details?: TmdbMovie })[]).map(renderMovieRatingCard)}
              </div>
            )}

            {activeTab === 'series' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(visibleList as (RatingSerieResponse & { details?: TmdbSerie })[]).map(renderSerieRatingCard)}
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
          initialRating={editingItem.rating}
          initialComment={editingItem.comment || ''}
          initialRewatchCount={editingItem.rewatchCount || 0}
          onSuccess={loadRatings}
        />
      )}
    </div>
  );
};
