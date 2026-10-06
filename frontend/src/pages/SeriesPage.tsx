import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { serieApi } from '../services/api';
import { TmdbSerie } from '../types';
import { MediaCard } from '../components/MediaCard';
import { MediaGridSkeleton } from '../components/MediaGridSkeleton';
import { Pagination } from '../components/Pagination';
import { Tv, Flame, Radio, Award, Calendar, Search } from 'lucide-react';

export const SeriesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [series, setSeries] = useState<TmdbSerie[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<'popular' | 'airing_today' | 'on_the_air' | 'top_rated'>('popular');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState(queryParam);

  useEffect(() => {
    setSearchInput(queryParam);
    setCurrentPage(1);
  }, [queryParam]);

  useEffect(() => {
    fetchSeries();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [category, currentPage, queryParam]);

  const fetchSeries = async () => {
    setLoading(true);
    try {
      if (queryParam) {
        const res = await serieApi.search(queryParam, currentPage);
        setSeries(res.data.results);
        setTotalPages(res.data.total_pages);
      } else {
        let res;
        switch (category) {
          case 'airing_today':
            res = await serieApi.getAiringToday(currentPage);
            break;
          case 'on_the_air':
            res = await serieApi.getOnTheAir(currentPage);
            break;
          case 'top_rated':
            res = await serieApi.getTopRated(currentPage);
            break;
          default:
            res = await serieApi.getPopular(currentPage);
            break;
        }
        setSeries(res.data.results);
        setTotalPages(res.data.total_pages);
      }
    } catch (err) {
      console.error('Erro ao buscar séries:', err);
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

  const handleCategoryChange = (cat: 'popular' | 'airing_today' | 'on_the_air' | 'top_rated') => {
    setCategory(cat);
    setCurrentPage(1);
    if (queryParam) {
      setSearchParams({});
    }
  };

  const tabs = [
    { id: 'popular', label: 'Populares', icon: Flame },
    { id: 'airing_today', label: 'No Ar Hoje', icon: Radio },
    { id: 'on_the_air', label: 'Na TV Esta Semana', icon: Calendar },
    { id: 'top_rated', label: 'Mais Votadas', icon: Award },
  ] as const;

  return (
    <div className="min-h-screen pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {queryParam ? (
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Séries para: <span className="text-amber-400">"{queryParam}"</span>
                </h2>
                <button
                  onClick={() => setSearchParams({})}
                  className="text-xs text-zinc-400 hover:text-white underline mt-0.5"
                >
                  Limpar busca e voltar ao catálogo de séries
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

          <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
            <input
              type="text"
              placeholder="Buscar séries por título..."
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
        ) : series.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800/80">
            <Tv className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-zinc-300">Nenhuma série encontrada</h3>
            <p className="text-sm text-zinc-500 mt-1">Tente pesquisar com outros termos ou alterne de aba.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {series.map((serie) => (
              <MediaCard
                key={serie.id}
                id={serie.id}
                title={serie.name}
                posterPath={serie.poster_path}
                voteAverage={serie.vote_average}
                releaseDate={serie.first_air_date}
                type="serie"
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
