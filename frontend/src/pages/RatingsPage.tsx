import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ratingApi, movieApi, serieApi, favoriteApi } from '../services/api';
import { RatingMovieResponse, RatingSerieResponse, RatedEpisode, TmdbMovie, TmdbSerie, TmdbEpisode, SeasonDetail } from '../types';
import { MediaCard } from '../components/MediaCard';
import { RatingModal } from '../components/RatingModal';
import { EpisodeRatingModal } from '../components/EpisodeRatingModal';
import { Star, Film, Tv, Search, X, ChevronDown, Columns2, LayoutGrid, Calendar, RotateCcw, Clapperboard, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

export interface EnrichedEpisodeRating extends RatedEpisode {
  serieDetails?: TmdbSerie;
  episodeDetails?: TmdbEpisode;
}

export const RatingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'movies' | 'series' | 'episodes'>('movies');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [visibleLimit, setVisibleLimit] = useState(24);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const [movieRatings, setMovieRatings] = useState<(RatingMovieResponse & { details?: TmdbMovie })[]>([]);
  const [serieRatings, setSerieRatings] = useState<(RatingSerieResponse & { details?: TmdbSerie })[]>([]);
  const [episodeRatings, setEpisodeRatings] = useState<EnrichedEpisodeRating[]>([]);
  const [favoriteMovieIds, setFavoriteMovieIds] = useState<Set<number>>(new Set());
  const [favoriteSerieIds, setFavoriteSerieIds] = useState<Set<number>>(new Set());

  // Editing state for movies/series
  const [editingItem, setEditingItem] = useState<{
    id: number;
    title: string;
    posterPath?: string | null;
    type: 'movie' | 'serie';
    rating: number;
    comment?: string;
    rewatchCount?: number;
  } | null>(null);

  // Editing state for episodes
  const [editingEpisode, setEditingEpisode] = useState<{
    serieId: number | string;
    seasonNumber: number;
    episodeNumber: number;
    episodeTitle?: string;
    serieTitle?: string;
    rating: number;
    comment?: string;
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
  }, [searchQuery, activeTab, viewMode, selectedRating, selectedYear]);

  const loadRatings = async () => {
    setLoading(true);
    try {
      const [mRes, sRes, eRes, favMRes, favSRes] = await Promise.all([
        ratingApi.getUserMovieRatings(),
        ratingApi.getUserSerieRatings(),
        ratingApi.getUserEpisodeRatings().catch(() => ({ data: [] as RatedEpisode[] })),
        favoriteApi.getUserMovies().catch(() => ({ data: [] })),
        favoriteApi.getUserSeries().catch(() => ({ data: [] })),
      ]);

      const favMSet = new Set<number>((favMRes.data || []).map((f: any) => f.movieId || f.id));
      const favSSet = new Set<number>((favSRes.data || []).map((s: any) => s.serieId || s.id));
      setFavoriteMovieIds(favMSet);
      setFavoriteSerieIds(favSSet);

      const movieIds = (mRes.data || []).map((item) => item.movieId).filter(Boolean);
      const rawSerieIds = (sRes.data || []).map((item) => item.serieId).filter(Boolean);
      const rawEpSerieIds = (eRes.data || []).map((item) => Number(item.serieId)).filter(Boolean);
      const allSerieIds = Array.from(new Set([...rawSerieIds, ...rawEpSerieIds]));

      const [moviesBatchRes, seriesBatchRes] = await Promise.all([
        movieIds.length
          ? movieApi.getBatch(movieIds).catch(() => ({ data: {} as Record<string, TmdbMovie> }))
          : Promise.resolve({ data: {} as Record<string, TmdbMovie> }),
        allSerieIds.length
          ? serieApi.getBatch(allSerieIds).catch(() => ({ data: {} as Record<string, TmdbSerie> }))
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

      // Carregar temporadas para os episódios avaliados
      const seasonMap: Record<string, SeasonDetail> = {};
      const rawEpisodes = eRes.data || [];
      const uniqueSeasonKeys = Array.from(
        new Set(rawEpisodes.map((e) => `${e.serieId}_${e.seasonNumber}`))
      );

      const seasonResults = await Promise.allSettled(
        uniqueSeasonKeys.map(async (key) => {
          const [sId, sNum] = key.split('_');
          const res = await serieApi.getSeasonDetails(Number(sId), Number(sNum));
          return { key, season: res.data };
        })
      );

      seasonResults.forEach((res) => {
        if (res.status === 'fulfilled') {
          seasonMap[res.value.key] = res.value.season;
        }
      });

      const loadedE: EnrichedEpisodeRating[] = rawEpisodes.map((item) => {
        const key = `${item.serieId}_${item.seasonNumber}`;
        const season = seasonMap[key];
        const ep = season?.episodes?.find((e) => e.episode_number === item.episodeNumber);
        return {
          ...item,
          serieDetails: seriesBatch[String(item.serieId)] || undefined,
          episodeDetails: ep,
        };
      });

      setMovieRatings(loadedM);
      setSerieRatings(loadedS);
      setEpisodeRatings(loadedE);
    } catch {
      toast.error('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  };

  const getReleaseYear = (dateStr?: string | null): number | null => {
    if (!dateStr) return null;
    const year = parseInt(dateStr.substring(0, 4), 10);
    return isNaN(year) ? null : year;
  };

  // Anos únicos presentes nas avaliações do usuário
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    movieRatings.forEach((item) => {
      const y = getReleaseYear(item.details?.release_date);
      if (y) yearsSet.add(y);
    });
    serieRatings.forEach((item) => {
      const y = getReleaseYear(item.details?.first_air_date);
      if (y) yearsSet.add(y);
    });
    episodeRatings.forEach((item) => {
      const y = getReleaseYear(item.episodeDetails?.air_date || item.serieDetails?.first_air_date);
      if (y) yearsSet.add(y);
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [movieRatings, serieRatings, episodeRatings]);

  // Décadas presentes nas avaliações do usuário
  const availableDecades = useMemo(() => {
    const decadesSet = new Set<number>();
    let hasBefore1980 = false;

    availableYears.forEach((year) => {
      if (year < 1980) {
        hasBefore1980 = true;
      } else {
        const decade = Math.floor(year / 10) * 10;
        decadesSet.add(decade);
      }
    });

    const sortedDecades = Array.from(decadesSet).sort((a, b) => b - a);
    const list = sortedDecades.map((d) => ({
      value: `decade-${d}`,
      label: `Anos ${d} (${d}–${d + 9})`,
    }));

    if (hasBefore1980) {
      list.push({
        value: 'decade-before-1980',
        label: 'Antes de 1980',
      });
    }

    return list;
  }, [availableYears]);

  const matchesRating = (userRating: number) => {
    if (selectedRating === 'all') return true;
    if (selectedRating === 'min-9') return userRating >= 9;
    if (selectedRating === 'min-8') return userRating >= 8;
    if (selectedRating === 'min-7') return userRating >= 7;
    if (selectedRating === 'min-6') return userRating >= 6;
    if (selectedRating === 'exact-10') return userRating === 10;
    if (selectedRating === 'range-9') return userRating >= 9 && userRating < 10;
    if (selectedRating === 'range-8') return userRating >= 8 && userRating < 9;
    if (selectedRating === 'range-7') return userRating >= 7 && userRating < 8;
    if (selectedRating === 'range-6') return userRating >= 6 && userRating < 7;
    if (selectedRating === 'range-5') return userRating >= 5 && userRating < 6;
    if (selectedRating === 'range-under-5') return userRating < 5;
    return true;
  };

  const matchesYear = (dateStr?: string | null) => {
    if (selectedYear === 'all') return true;
    const y = getReleaseYear(dateStr);
    if (!y) return false;

    if (selectedYear === 'decade-before-1980') {
      return y < 1980;
    }
    if (selectedYear.startsWith('decade-')) {
      const start = parseInt(selectedYear.replace('decade-', ''), 10);
      return y >= start && y <= start + 9;
    }
    return y === parseInt(selectedYear, 10);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedRating('all');
    setSelectedYear('all');
  };

  const q = searchQuery.toLowerCase().trim();

  const filteredMovies = useMemo(() => {
    return movieRatings.filter((item) => {
      if (q) {
        const title = (item.details?.title || '').toLowerCase();
        if (!title.includes(q)) return false;
      }
      if (!matchesRating(item.rating)) return false;
      if (!matchesYear(item.details?.release_date)) return false;
      return true;
    });
  }, [movieRatings, q, selectedRating, selectedYear]);

  const filteredSeries = useMemo(() => {
    return serieRatings.filter((item) => {
      if (q) {
        const name = (item.details?.name || '').toLowerCase();
        if (!name.includes(q)) return false;
      }
      if (!matchesRating(item.rating)) return false;
      if (!matchesYear(item.details?.first_air_date)) return false;
      return true;
    });
  }, [serieRatings, q, selectedRating, selectedYear]);

  const filteredEpisodes = useMemo(() => {
    return episodeRatings.filter((item) => {
      if (q) {
        const serieTitle = (item.serieDetails?.name || '').toLowerCase();
        const epTitle = (item.episodeDetails?.name || '').toLowerCase();
        const epCode1 = `t${item.seasonNumber} e${item.episodeNumber}`.toLowerCase();
        const epCode2 = `s${item.seasonNumber}e${item.episodeNumber}`.toLowerCase();
        if (!serieTitle.includes(q) && !epTitle.includes(q) && !epCode1.includes(q) && !epCode2.includes(q)) {
          return false;
        }
      }
      if (!matchesRating(item.rating)) return false;
      const epDate = item.episodeDetails?.air_date || item.serieDetails?.first_air_date;
      if (!matchesYear(epDate)) return false;
      return true;
    });
  }, [episodeRatings, q, selectedRating, selectedYear]);

  const currentList =
    activeTab === 'movies'
      ? filteredMovies
      : activeTab === 'series'
      ? filteredSeries
      : filteredEpisodes;

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
                Minhas Avaliações ({movieRatings.length + serieRatings.length + episodeRatings.length})
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Revise suas notas e comentários em filmes, séries e episódios
              </p>
            </div>

            {/* Barra de Busca */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por filme, série ou episódio..."
                className="w-full bg-[#14141c] border border-white/[0.08] rounded-xl pl-9 pr-9 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
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

          {/* Abas, Filtros e Seletor de Layout */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Abas */}
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
                <button
                  onClick={() => setActiveTab('episodes')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeTab === 'episodes' ? 'bg-amber-500 text-zinc-950 font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Clapperboard className="w-3.5 h-3.5" /> Episódios ({filteredEpisodes.length})
                </button>
              </div>

              {/* Divisor sutil */}
              <div className="hidden sm:block h-5 w-px bg-white/[0.08]" />

              {/* Filtro por Nota */}
              <div className="relative flex items-center">
                <div
                  className={`pointer-events-none absolute left-3 flex items-center transition-colors ${
                    selectedRating !== 'all' ? 'text-amber-400' : 'text-zinc-400'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${selectedRating !== 'all' ? 'fill-amber-400' : ''}`} />
                </div>
                <select
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className={`appearance-none text-xs font-semibold rounded-xl pl-8 pr-8 py-2 cursor-pointer transition-all focus:outline-none ${
                    selectedRating !== 'all'
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10'
                      : 'bg-[#14141c] text-zinc-300 border border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                  title="Filtrar por Nota"
                >
                  <option value="all" className="bg-[#14141c] text-zinc-200">Todas as Notas</option>
                  <optgroup label="Notas Mínimas" className="bg-[#14141c] text-zinc-400 font-semibold">
                    <option value="min-9" className="bg-[#14141c] text-zinc-200 font-normal">9+ ★ (Excelente)</option>
                    <option value="min-8" className="bg-[#14141c] text-zinc-200 font-normal">8+ ★ (Muito bom)</option>
                    <option value="min-7" className="bg-[#14141c] text-zinc-200 font-normal">7+ ★ (Bom)</option>
                    <option value="min-6" className="bg-[#14141c] text-zinc-200 font-normal">6+ ★ (Regular)</option>
                  </optgroup>
                  <optgroup label="Nota Específica" className="bg-[#14141c] text-zinc-400 font-semibold">
                    <option value="exact-10" className="bg-[#14141c] text-zinc-200 font-normal">10 ★ (Obra-prima)</option>
                    <option value="range-9" className="bg-[#14141c] text-zinc-200 font-normal">9 ★ (9.0 a 9.9)</option>
                    <option value="range-8" className="bg-[#14141c] text-zinc-200 font-normal">8 ★ (8.0 a 8.9)</option>
                    <option value="range-7" className="bg-[#14141c] text-zinc-200 font-normal">7 ★ (7.0 a 7.9)</option>
                    <option value="range-6" className="bg-[#14141c] text-zinc-200 font-normal">6 ★ (6.0 a 6.9)</option>
                    <option value="range-5" className="bg-[#14141c] text-zinc-200 font-normal">5 ★ (5.0 a 5.9)</option>
                    <option value="range-under-5" className="bg-[#14141c] text-zinc-200 font-normal">Menor que 5 ★</option>
                  </optgroup>
                </select>
                <div className="pointer-events-none absolute right-2.5 flex items-center text-zinc-500">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Filtro por Ano */}
              <div className="relative flex items-center">
                <div
                  className={`pointer-events-none absolute left-3 flex items-center transition-colors ${
                    selectedYear !== 'all' ? 'text-indigo-400' : 'text-zinc-400'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className={`appearance-none text-xs font-semibold rounded-xl pl-8 pr-8 py-2 cursor-pointer transition-all focus:outline-none ${
                    selectedYear !== 'all'
                      ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                      : 'bg-[#14141c] text-zinc-300 border border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                  title="Filtrar por Ano de Lançamento"
                >
                  <option value="all" className="bg-[#14141c] text-zinc-200">Todos os Anos</option>
                  {availableDecades.length > 0 && (
                    <optgroup label="Por Década" className="bg-[#14141c] text-zinc-400 font-semibold">
                      {availableDecades.map((d) => (
                        <option key={d.value} value={d.value} className="bg-[#14141c] text-zinc-200 font-normal">
                          {d.label}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {availableYears.length > 0 && (
                    <optgroup label="Por Ano" className="bg-[#14141c] text-zinc-400 font-semibold">
                      {availableYears.map((year) => (
                        <option key={year} value={String(year)} className="bg-[#14141c] text-zinc-200 font-normal">
                          {year}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <div className="pointer-events-none absolute right-2.5 flex items-center text-zinc-500">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Botão Limpar Filtros quando ativos */}
              {(selectedRating !== 'all' || selectedYear !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedRating('all');
                    setSelectedYear('all');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-[#14141c] border border-white/[0.08] hover:border-white/[0.2] transition-colors cursor-pointer"
                  title="Resetar filtros de nota e ano"
                >
                  <RotateCcw className="w-3 h-3 text-zinc-400" />
                  <span>Limpar</span>
                </button>
              )}
            </div>

            {/* Seletor de Modo de Exibição */}
            <div className="hidden lg:flex items-center gap-1 bg-[#14141c] p-1 rounded-xl border border-white/[0.06]">
              <button
                onClick={() => handleViewModeChange('split')}
                title="Visão Lado a Lado (Filmes na Esquerda | Séries na Direita)"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Lado a Lado</span>
              </button>
              <button
                onClick={() => handleViewModeChange('unified')}
                title="Grid Padrão por Aba"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
        ) : viewMode === 'split' && activeTab !== 'episodes' ? (
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
                  <p className="text-white/40 text-sm font-medium">
                    {searchQuery || selectedRating !== 'all' || selectedYear !== 'all'
                      ? 'Nenhum filme corresponde aos filtros'
                      : 'Nenhum filme avaliado'}
                  </p>
                  {(searchQuery || selectedRating !== 'all' || selectedYear !== 'all') && (
                    <button
                      onClick={handleResetFilters}
                      className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                    >
                      Limpar filtros
                    </button>
                  )}
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
                  <p className="text-white/40 text-sm font-medium">
                    {searchQuery || selectedRating !== 'all' || selectedYear !== 'all'
                      ? 'Nenhuma série corresponde aos filtros'
                      : 'Nenhuma série avaliada'}
                  </p>
                  {(searchQuery || selectedRating !== 'all' || selectedYear !== 'all') && (
                    <button
                      onClick={handleResetFilters}
                      className="mt-3 text-xs text-violet-400 hover:text-violet-300 underline cursor-pointer"
                    >
                      Limpar filtros
                    </button>
                  )}
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
              <div className="flex justify-center mt-12 col-span-1 lg:col-span-2">
                <button
                  onClick={() => setVisibleLimit((prev) => prev + 24)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#14141c] border border-white/[0.08] hover:border-yellow-400 text-yellow-400 font-semibold transition-all hover:bg-zinc-800 shadow-lg text-sm cursor-pointer"
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
              {searchQuery || selectedRating !== 'all' || selectedYear !== 'all'
                ? 'Nenhuma avaliação encontrada com os filtros selecionados'
                : activeTab === 'movies'
                ? 'Nenhum filme avaliado ainda'
                : activeTab === 'series'
                ? 'Nenhuma série avaliada ainda'
                : 'Nenhum episódio avaliado ainda'}
            </h3>
            {(searchQuery || selectedRating !== 'all' || selectedYear !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
              >
                Limpar filtros
              </button>
            )}
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

            {activeTab === 'episodes' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {(visibleList as EnrichedEpisodeRating[]).map((item) => {
                  const imageUrl = item.episodeDetails?.still_path
                    ? `https://image.tmdb.org/t/p/w500${item.episodeDetails.still_path}`
                    : item.serieDetails?.backdrop_path
                    ? `https://image.tmdb.org/t/p/w500${item.serieDetails.backdrop_path}`
                    : item.serieDetails?.poster_path
                    ? `https://image.tmdb.org/t/p/w500${item.serieDetails.poster_path}`
                    : null;

                  return (
                    <div
                      key={`ep-${item.id || `${item.serieId}-${item.seasonNumber}-${item.episodeNumber}`}`}
                      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f1320] transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)]"
                    >
                      {/* Top subtle glow on hover */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-30" />

                      {/* Banner do Episódio (aspect 16:9) */}
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-white/5">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.episodeDetails?.name || `Episódio ${item.episodeNumber}`}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                            <Tv className="w-10 h-10 opacity-40" />
                          </div>
                        )}

                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#090c15] via-transparent to-transparent opacity-80" />

                        {/* Badge Temporada e Episódio */}
                        <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-amber-300 bg-black/75 backdrop-blur-md rounded-xl border border-amber-500/30">
                          T{item.seasonNumber} · E{item.episodeNumber}
                        </div>

                        {/* Badge da Nota do Usuário */}
                        <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-1 px-2.5 py-1 text-xs font-black text-zinc-950 bg-amber-400 rounded-xl shadow-lg">
                          <Star className="w-3.5 h-3.5 fill-zinc-950" />
                          <span>{Number(item.rating).toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Informações */}
                      <div className="flex flex-col flex-1 p-4 justify-between gap-3">
                        <div className="space-y-1">
                          <Link
                            to={`/series/${item.serieId}`}
                            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline truncate block"
                            title={item.serieDetails?.name || `Série #${item.serieId}`}
                          >
                            {item.serieDetails?.name || `Série #${item.serieId}`}
                          </Link>

                          <Link
                            to={`/series/${item.serieId}/season/${item.seasonNumber}`}
                            className="text-sm font-bold text-white hover:text-amber-400 line-clamp-1 block transition-colors"
                            title={item.episodeDetails?.name || `Episódio ${item.episodeNumber}`}
                          >
                            {item.episodeDetails?.name || `Episódio ${item.episodeNumber}`}
                          </Link>

                          {item.episodeDetails?.air_date && (
                            <p className="text-[11px] text-zinc-400">
                              Exibido em: {new Date(item.episodeDetails.air_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </p>
                          )}

                          {item.comment && (
                            <div className="mt-2 text-xs text-zinc-300 bg-white/[0.03] border border-white/[0.05] rounded-xl p-2.5 italic line-clamp-2">
                              "{item.comment}"
                            </div>
                          )}
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.05]">
                          <button
                            onClick={() =>
                              setEditingEpisode({
                                serieId: item.serieId,
                                seasonNumber: item.seasonNumber,
                                episodeNumber: item.episodeNumber,
                                episodeTitle: item.episodeDetails?.name || `Episódio ${item.episodeNumber}`,
                                serieTitle: item.serieDetails?.name,
                                rating: Number(item.rating),
                                comment: item.comment,
                              })
                            }
                            className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span>Editar Nota</span>
                          </button>

                          <Link
                            to={`/series/${item.serieId}/season/${item.seasonNumber}`}
                            className="text-xs text-zinc-400 hover:text-white px-2 py-1.5 rounded-lg transition-colors"
                          >
                            Ver Temporada →
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Botão Carregar Mais */}
            {visibleLimit < totalCount && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setVisibleLimit((prev) => prev + 24)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#14141c] border border-white/[0.08] hover:border-yellow-400 text-yellow-400 font-semibold transition-all hover:bg-zinc-800 shadow-lg text-sm cursor-pointer"
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

      {editingEpisode && (
        <EpisodeRatingModal
          isOpen={!!editingEpisode}
          onClose={() => setEditingEpisode(null)}
          serieId={editingEpisode.serieId}
          seasonNumber={editingEpisode.seasonNumber}
          episodeNumber={editingEpisode.episodeNumber}
          episodeTitle={editingEpisode.episodeTitle}
          serieTitle={editingEpisode.serieTitle}
          initialRating={editingEpisode.rating}
          initialComment={editingEpisode.comment || ''}
          onSuccess={loadRatings}
        />
      )}
    </div>
  );
};
