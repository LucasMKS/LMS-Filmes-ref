import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { movieApi } from '../services/api';
import { TmdbMovie } from '../types';
import { MediaCard } from '../components/MediaCard';
import { MediaGridSkeleton } from '../components/MediaGridSkeleton';
import { Pagination } from '../components/Pagination';
import { useUserRatingsStore } from '../store/useUserRatingsStore';
import { Film, Flame, PlayCircle, Trophy, Clock, Search } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const { movieRatings } = useUserRatingsStore();

  const [movies, setMovies] = useState<TmdbMovie[]>([]);
  const [featured, setFeatured] = useState<TmdbMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<'popular' | 'now_playing' | 'top_rated' | 'upcoming'>('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState(queryParam);

  useEffect(() => {
    setSearchInput(queryParam);
    setCurrentPage(1);
  }, [queryParam]);

  useEffect(() => {
    fetchMovies();
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category, currentPage, queryParam]);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      if (queryParam) {
        const res = await movieApi.search(queryParam, currentPage);
        setMovies(res.data.results);
        setTotalPages(res.data.total_pages);
        setFeatured(null);
      } else {
        let res;
        switch (category) {
          case 'now_playing':
            res = await movieApi.getNowPlaying(currentPage);
            break;
          case 'top_rated':
            res = await movieApi.getTopRated(currentPage);
            break;
          case 'upcoming':
            res = await movieApi.getUpcoming(currentPage);
            break;
          default:
            res = await movieApi.getPopular(currentPage);
            break;
        }
        setMovies(res.data.results);
        setTotalPages(res.data.total_pages);

        // Define o banner hero caso seja a primeira página
        if (currentPage === 1 && res.data.results.length > 0 && !featured) {
          setFeatured(res.data.results[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar filmes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleCategoryChange = (cat: 'popular' | 'now_playing' | 'top_rated' | 'upcoming') => {
    setCategory(cat);
    setCurrentPage(1);
    if (queryParam) {
      setSearchParams({});
    }
  };

  const tabs = [
    { id: 'popular', label: 'Populares', icon: Flame },
    { id: 'now_playing', label: 'Em Cartaz', icon: PlayCircle },
    { id: 'top_rated', label: 'Mais Votados', icon: Trophy },
    { id: 'upcoming', label: 'Em Breve', icon: Clock },
  ] as const;

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Banner (Only on page 1 without active search) */}
      {!queryParam && currentPage === 1 && featured && (
        <div className="relative w-full h-[380px] sm:h-[480px] overflow-hidden mb-8">
          <div
            className="absolute inset-0 bg-cover bg-center scale-105 filter blur-[1px] transform transition-transform duration-1000"
            style={{
              backgroundImage: `url(https://image.tmdb.org/t/p/original${featured.backdrop_path || featured.poster_path})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent" />

          <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12">
            <div className="max-w-2xl space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Flame className="w-3.5 h-3.5" /> Destaque
              </span>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                {featured.title}
              </h1>
              <p className="text-zinc-300 text-sm sm:text-base line-clamp-3 max-w-xl font-normal leading-relaxed">
                {featured.overview}
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a
                  href={`/filmes/${featured.id}`}
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-400/20"
                >
                  Ver Detalhes
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Search header or Category filter bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {queryParam ? (
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Resultados para: <span className="text-amber-400">"{queryParam}"</span>
                </h2>
                <button
                  onClick={() => setSearchParams({})}
                  className="text-xs text-zinc-400 hover:text-white underline mt-0.5"
                >
                  Limpar busca e voltar ao catálogo
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((tab) => {
                const active = category === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleCategoryChange(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? 'bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20'
                        : 'bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick inline search */}
          <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
            <input
              type="text"
              placeholder="Buscar filmes por título..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-amber-400"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Media Grid */}
        {loading ? (
          <MediaGridSkeleton count={18} />
        ) : movies.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800/80">
            <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-zinc-300">Nenhum filme encontrado</h3>
            <p className="text-sm text-zinc-500 mt-1">Tente pesquisar com outros termos ou selecione outra categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {movies.map((movie) => (
              <MediaCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                posterPath={movie.poster_path}
                voteAverage={movie.vote_average}
                releaseDate={movie.release_date}
                type="movie"
                userRating={movieRatings[movie.id] || null}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => setCurrentPage(p)}
          />
        )}
      </div>
    </div>
  );
};
