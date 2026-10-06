import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ratingApi, movieApi, serieApi } from '../services/api';
import { RatingMovieResponse, RatingSerieResponse, TmdbMovie, TmdbSerie } from '../types';
import { RatingModal } from '../components/RatingModal';
import { Star, Film, Tv, MessageSquare, RotateCcw, Calendar, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

export const RatingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'movies' | 'series'>('movies');
  const [loading, setLoading] = useState(true);

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
    loadRatings();
  }, []);

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
    } catch (err) {
      toast.error('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
              Minhas Avaliações
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Revise suas notas, comentários e contadores de rewatch
            </p>
          </div>

          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('movies')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'movies' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" /> Filmes ({movieRatings.length})
            </button>
            <button
              onClick={() => setActiveTab('series')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'series' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" /> Séries ({serieRatings.length})
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
              movieRatings.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                  <Star className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-zinc-300">Nenhum filme avaliado ainda</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {movieRatings.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all"
                    >
                      <Link to={`/filmes/${item.movieId}`} className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-950">
                        <img
                          src={`https://image.tmdb.org/t/p/w200${item.details?.poster_path}`}
                          alt={item.details?.title}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <Link
                              to={`/filmes/${item.movieId}`}
                              className="font-bold text-sm text-white hover:text-amber-400 truncate max-w-[180px]"
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
                            <div className="flex items-center gap-1 text-amber-400 font-black text-sm">
                              <Star className="w-4 h-4 fill-amber-400" />
                              <span>{item.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-xs text-zinc-500">/ 10</span>
                            {item.rewatchCount > 0 && (
                              <span className="text-[11px] text-zinc-400 flex items-center gap-0.5 ml-2">
                                <RotateCcw className="w-3 h-3 text-amber-500" /> {item.rewatchCount}x
                              </span>
                            )}
                          </div>

                          {item.comment && (
                            <p className="text-xs text-zinc-300 italic mt-2 line-clamp-2">
                              "{item.comment}"
                            </p>
                          )}
                        </div>

                        <div className="text-[11px] text-zinc-500 mt-2">
                          {new Date(item.ratedAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'series' && (
              serieRatings.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                  <Star className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-zinc-300">Nenhuma série avaliada ainda</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {serieRatings.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-all"
                    >
                      <Link to={`/series/${item.serieId}`} className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-950">
                        <img
                          src={`https://image.tmdb.org/t/p/w200${item.details?.poster_path}`}
                          alt={item.details?.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <Link
                              to={`/series/${item.serieId}`}
                              className="font-bold text-sm text-white hover:text-amber-400 truncate max-w-[180px]"
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
                            <div className="flex items-center gap-1 text-amber-400 font-black text-sm">
                              <Star className="w-4 h-4 fill-amber-400" />
                              <span>{item.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-xs text-zinc-500">/ 10</span>
                            {item.rewatchCount > 0 && (
                              <span className="text-[11px] text-zinc-400 flex items-center gap-0.5 ml-2">
                                <RotateCcw className="w-3 h-3 text-amber-500" /> {item.rewatchCount}x
                              </span>
                            )}
                          </div>

                          {item.comment && (
                            <p className="text-xs text-zinc-300 italic mt-2 line-clamp-2">
                              "{item.comment}"
                            </p>
                          )}
                        </div>

                        <div className="text-[11px] text-zinc-500 mt-2">
                          {new Date(item.ratedAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
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
