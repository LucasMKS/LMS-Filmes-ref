import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { favoriteApi, movieApi, serieApi, actorApi } from '../services/api';
import { TmdbMovie, TmdbSerie, TmdbPerson } from '../types';
import { MediaCard } from '../components/MediaCard';
import { Heart, Film, Tv, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const FavoritesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'movies' | 'series' | 'actors'>('movies');
  const [loading, setLoading] = useState(true);

  const [favoriteMovies, setFavoriteMovies] = useState<TmdbMovie[]>([]);
  const [favoriteSeries, setFavoriteSeries] = useState<TmdbSerie[]>([]);
  const [favoriteActors, setFavoriteActors] = useState<TmdbPerson[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

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

  return (
    <div className="min-h-screen pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              Meus Favoritos
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Todos os seus filmes, séries e atores favoritos em um só lugar
            </p>
          </div>

          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('movies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'movies' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" /> Filmes ({favoriteMovies.length})
            </button>
            <button
              onClick={() => setActiveTab('series')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'series' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" /> Séries ({favoriteSeries.length})
            </button>
            <button
              onClick={() => setActiveTab('actors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'actors' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Atores ({favoriteActors.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div>
            {activeTab === 'movies' && (
              favoriteMovies.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                  <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-zinc-300">Nenhum filme favorito ainda</h3>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {favoriteMovies.map((movie) => (
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
              )
            )}

            {activeTab === 'series' && (
              favoriteSeries.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                  <Tv className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-zinc-300">Nenhuma série favorita ainda</h3>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {favoriteSeries.map((serie) => (
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
              )
            )}

            {activeTab === 'actors' && (
              favoriteActors.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                  <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-zinc-300">Nenhum ator favorito ainda</h3>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {favoriteActors.map((actor) => (
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
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
