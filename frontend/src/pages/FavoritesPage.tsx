import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { favoriteApi, movieApi, serieApi, actorApi } from '../services/api';
import { TmdbMovie, TmdbSerie, TmdbPerson } from '../types';
import { MediaCard } from '../components/MediaCard';
import { Heart, Film, Tv, Users, Trash2, Search, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

export const FavoritesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'movies' | 'series' | 'actors'>('movies');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(24);
  const [loading, setLoading] = useState(true);

  const [favoriteMovies, setFavoriteMovies] = useState<TmdbMovie[]>([]);
  const [favoriteSeries, setFavoriteSeries] = useState<TmdbSerie[]>([]);
  const [favoriteActors, setFavoriteActors] = useState<TmdbPerson[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  useEffect(() => {
    setVisibleLimit(24);
  }, [searchQuery, activeTab]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const [moviesRes, seriesRes, actorsRes] = await Promise.all([
        favoriteApi.getUserMovies(),
        favoriteApi.getUserSeries(),
        favoriteApi.getUserActors(),
      ]);

      const movieIds = (moviesRes.data || []).map((f: any) => f.movieId || f.id).filter(Boolean);
      const serieIds = (seriesRes.data || []).map((s: any) => s.serieId || s.id).filter(Boolean);

      const [moviesBatchRes, seriesBatchRes, loadedActors] = await Promise.all([
        movieIds.length
          ? movieApi.getBatch(movieIds).catch(() => ({ data: {} as Record<string, TmdbMovie> }))
          : Promise.resolve({ data: {} as Record<string, TmdbMovie> }),
        serieIds.length
          ? serieApi.getBatch(serieIds).catch(() => ({ data: {} as Record<string, TmdbSerie> }))
          : Promise.resolve({ data: {} as Record<string, TmdbSerie> }),
        Promise.all(
          (actorsRes.data || []).map(async (f: any) => {
            try {
              const a = await actorApi.getDetails(f.actorId || f.id);
              return a.data;
            } catch {
              return null;
            }
          })
        ),
      ]);

      const moviesBatch = moviesBatchRes.data || {};
      const seriesBatch = seriesBatchRes.data || {};

      const loadedMovies = movieIds
        .map((id) => moviesBatch[String(id)])
        .filter(Boolean) as TmdbMovie[];

      const loadedSeries = serieIds
        .map((id) => seriesBatch[String(id)])
        .filter(Boolean) as TmdbSerie[];

      setFavoriteMovies(loadedMovies);
      setFavoriteSeries(loadedSeries);
      setFavoriteActors(loadedActors.filter(Boolean) as TmdbPerson[]);
    } catch (err) {
      toast.error('Erro ao carregar favoritos');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveActor = async (actorId: number) => {
    try {
      await favoriteApi.removeActor(actorId);
      setFavoriteActors((prev) => prev.filter((a) => a.id !== actorId));
      toast.info('Ator removido dos favoritos');
    } catch {
      toast.error('Erro ao remover ator');
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

  const filteredActors = favoriteActors.filter((actor) => {
    if (!q) return true;
    return (actor.name || '').toLowerCase().includes(q);
  });

  const getCurrentList = () => {
    if (activeTab === 'movies') return filteredMovies;
    if (activeTab === 'series') return filteredSeries;
    return filteredActors;
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
                <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                Meus Favoritos
              </h1>
              <p className="text-xs text-zinc-400 mt-1">
                Todos os seus filmes, séries e atores favoritos em um só lugar
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

          {/* Abas */}
          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs w-fit">
            <button
              onClick={() => setActiveTab('movies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'movies' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" /> Filmes ({filteredMovies.length})
            </button>
            <button
              onClick={() => setActiveTab('series')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'series' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" /> Séries ({filteredSeries.length})
            </button>
            <button
              onClick={() => setActiveTab('actors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'actors' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Atores ({filteredActors.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800">
            {activeTab === 'movies' && <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />}
            {activeTab === 'series' && <Tv className="w-12 h-12 text-zinc-600 mx-auto mb-3" />}
            {activeTab === 'actors' && <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />}
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
                    onFavoriteChange={(id, isFav) => {
                      if (!isFav) setFavoriteSeries((prev) => prev.filter((s) => s.id !== id));
                    }}
                  />
                ))}
              </div>
            )}

            {activeTab === 'actors' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {(visibleList as TmdbPerson[]).map((actor) => (
                  <div
                    key={actor.id}
                    className="group relative flex flex-col rounded-xl overflow-hidden bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all"
                  >
                    <Link to={`/atores/${actor.id}`} className="aspect-[2/3] w-full overflow-hidden bg-zinc-950">
                      <img
                        src={
                          actor.profile_path
                            ? `https://image.tmdb.org/t/p/w300${actor.profile_path}`
                            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
                        }
                        alt={actor.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </Link>
                    <div className="p-3 flex items-center justify-between">
                      <Link to={`/atores/${actor.id}`} className="font-semibold text-xs text-zinc-200 hover:text-amber-400 truncate">
                        {actor.name}
                      </Link>
                      <button
                        onClick={() => handleRemoveActor(actor.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                        title="Remover ator favorito"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Botão Carregar Mais */}
            {visibleLimit < totalCount && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setVisibleLimit((prev) => prev + 24)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-amber-400 font-semibold transition-all hover:bg-zinc-800 shadow-lg text-sm"
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
