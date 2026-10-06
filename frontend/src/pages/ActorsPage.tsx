import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { actorApi } from '../services/api';
import { TmdbPerson } from '../types';
import { Pagination } from '../components/Pagination';
import { Users, Search, Award } from 'lucide-react';

export const ActorsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [actors, setActors] = useState<TmdbPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState(queryParam);

  useEffect(() => {
    setSearchInput(queryParam);
    setCurrentPage(1);
  }, [queryParam]);

  useEffect(() => {
    fetchActors();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, queryParam]);

  const fetchActors = async () => {
    setLoading(true);
    try {
      if (queryParam) {
        const res = await actorApi.search(queryParam, currentPage);
        setActors(res.data.results);
        setTotalPages(res.data.total_pages);
      } else {
        const res = await actorApi.getPopular(currentPage);
        setActors(res.data.results);
        setTotalPages(res.data.total_pages);
      }
    } catch (err) {
      console.error('Erro ao buscar atores:', err);
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

  return (
    <div className="min-h-screen pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-400" />
              {queryParam ? `Resultados para "${queryParam}"` : 'Atores e Criadores Populares'}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Explore os perfis, filmografia e adicione atores favoritos
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative min-w-[260px]">
            <input
              type="text"
              placeholder="Buscar atores por nome..."
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

        {/* Actors Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-zinc-900/60 rounded-xl overflow-hidden border border-zinc-800">
                <div className="aspect-[2/3] bg-zinc-800/60" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800/60 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : actors.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800/80">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-zinc-300">Nenhum ator encontrado</h3>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
            {actors.map((actor) => (
              <Link
                key={actor.id}
                to={`/atores/${actor.id}`}
                className="group flex flex-col rounded-xl overflow-hidden bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:shadow-xl hover:shadow-amber-500/5 transition-all"
              >
                <div className="aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                  <img
                    src={
                      actor.profile_path
                        ? `https://image.tmdb.org/t/p/w300${actor.profile_path}`
                        : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
                    }
                    alt={actor.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-zinc-100 group-hover:text-amber-400 transition-colors truncate">
                    {actor.name}
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {actor.known_for_department || 'Atuação'}
                  </p>
                </div>
              </Link>
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
