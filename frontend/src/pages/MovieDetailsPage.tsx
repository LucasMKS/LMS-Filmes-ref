import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  movieApi, 
  favoriteApi, 
  watchlistApi, 
  ratingApi 
} from '../services/api';
import { TmdbMovieDetail, TmdbMovie } from '../types';
import { MediaCard } from '../components/MediaCard';
import { RatingModal } from '../components/RatingModal';
import { AddToListModal } from '../components/AddToListModal';
import { useAuthStore } from '../store/useAuthStore';
import { useUserRatingsStore } from '../store/useUserRatingsStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useWatchlistStore } from '../store/useWatchlistStore';
import { 
  Star, 
  Heart, 
  Bookmark, 
  Calendar, 
  Clock, 
  DollarSign, 
  Play, 
  ListPlus, 
  Check, 
  Tv, 
  Share2, 
  ArrowLeft,
  MessageSquare,
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';

export const MovieDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const movieId = Number(id);
  const { isAuthenticated } = useAuthStore();
  const { movieRatings } = useUserRatingsStore();

  const isFavorite = useFavoritesStore((state) => state.isFavorite(movieId, 'movie'));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const setMovieFavorite = useFavoritesStore((state) => state.setMovieFavorite);

  const isInWatchlist = useWatchlistStore((state) => state.inWatchlist(movieId, 'movie'));
  const toggleWatchlist = useWatchlistStore((state) => state.toggleWatchlist);
  const setMovieWatchlist = useWatchlistStore((state) => state.setMovieWatchlist);

  const [movie, setMovie] = useState<TmdbMovieDetail | null>(null);
  const [recommendations, setRecommendations] = useState<TmdbMovie[]>([]);
  const [loading, setLoading] = useState(true);

  // User relations state
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userComment, setUserComment] = useState<string>('');
  const [userRewatch, setUserRewatch] = useState<number>(0);

  // Modals state
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

  useEffect(() => {
    if (movieId) {
      loadMovieDetails();
      if (isAuthenticated) {
        checkUserStatus();
      }
    }
    window.scrollTo(0, 0);
  }, [movieId, isAuthenticated]);

  const loadMovieDetails = async () => {
    setLoading(true);
    try {
      const [detailRes, recRes] = await Promise.all([
        movieApi.getDetails(movieId),
        movieApi.getRecommendations(movieId),
      ]);
      setMovie(detailRes.data);
      setRecommendations(recRes.data.results || []);
    } catch (err) {
      console.error('Erro ao carregar filme:', err);
      toast.error('Erro ao carregar detalhes do filme');
    } finally {
      setLoading(false);
    }
  };

  const checkUserStatus = async () => {
    try {
      const [favRes, watchRes, rateRes] = await Promise.allSettled([
        favoriteApi.checkMovie(movieId),
        watchlistApi.checkMovie(movieId),
        ratingApi.getMovieRating(movieId),
      ]);

      if (favRes.status === 'fulfilled' && favRes.value.data) {
        const data = favRes.value.data as any;
        const isFav = Boolean(data.isFavorite ?? data.favorite);
        setMovieFavorite(movieId, isFav);
      }
      if (watchRes.status === 'fulfilled') {
        const inList = Boolean(watchRes.value.data && watchRes.value.data.status);
        setMovieWatchlist(movieId, inList);
      }
      if (rateRes.status === 'fulfilled' && rateRes.value.data) {
        setUserRating(rateRes.value.data.rating);
        setUserComment(rateRes.value.data.comment || '');
        setUserRewatch(rateRes.value.data.rewatchCount || 0);
      } else {
        setUserRating(null);
      }
    } catch (err) {
      // Non-blocking
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Faça login para favoritar');
      return;
    }
    try {
      const isNowFav = await toggleFavorite(movieId, 'movie');
      if (isNowFav) {
        toast.success('Adicionado aos favoritos!');
      } else {
        toast.info('Removido dos favoritos');
      }
    } catch (err) {
      toast.error('Erro ao atualizar favoritos');
    }
  };

  const handleToggleWatchlist = async () => {
    if (!isAuthenticated) {
      toast.error('Faça login para gerenciar sua watchlist');
      return;
    }
    try {
      const isNowIn = await toggleWatchlist(movieId, 'movie');
      if (isNowIn) {
        toast.success('Adicionado à watchlist!');
      } else {
        toast.info('Removido da watchlist');
      }
    } catch (err) {
      toast.error('Erro ao atualizar watchlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white">Filme não encontrado</h2>
        <Link to="/" className="text-amber-400 hover:underline mt-4 inline-block">
          Voltar para a página inicial
        </Link>
      </div>
    );
  }

  const trailer = movie.videos?.results?.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  );

  const watchProviders = movie['watch/providers']?.results?.BR;

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Backdrop */}
      <div className="relative w-full h-[400px] sm:h-[520px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-[2px] scale-105"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/60 to-transparent" />

        <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-end pb-8">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="absolute top-6 left-4 sm:left-6 lg:left-8 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-md text-sm transition-colors border border-zinc-800 shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </div>

      {/* Main Content Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-44 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Poster */}
          <div className="w-48 sm:w-64 flex-shrink-0 mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-zinc-800 bg-zinc-900">
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Details */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {movie.title}
              </h1>
              {movie.tagline && (
                <p className="text-zinc-400 italic text-sm sm:text-base mt-1">"{movie.tagline}"</p>
              )}
            </div>

            {/* Badges and Stats */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-300">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 font-bold rounded-lg border border-amber-500/30">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{movie.vote_average.toFixed(1)}</span>
                <span className="text-zinc-500 font-normal">({movie.vote_count})</span>
              </div>

              {movie.release_date && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span>{new Date(movie.release_date).toLocaleDateString('pt-BR')}</span>
                </div>
              )}

              {movie.runtime && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                  <Clock className="w-4 h-4 text-zinc-400" />
                  <span>{movie.runtime} min</span>
                </div>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {movie.genres?.map((g) => (
                <span
                  key={g.id}
                  className="px-3 py-1 bg-zinc-900/90 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-800"
                >
                  {g.name}
                </span>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {/* Watch Trailer */}
              {trailer && (
                <button
                  onClick={() => setShowTrailerModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-600/20"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Trailer Oficial
                </button>
              )}

              {/* Rate button */}
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl transition-all shadow-md cursor-pointer ${
                  userRating
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold shadow-amber-500/15 hover:scale-[1.02]'
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                <Star className={`w-4 h-4 ${userRating ? 'fill-amber-400 text-amber-400' : 'fill-zinc-950 text-zinc-950'}`} />
                <span>{userRating ? `Minha Nota: ${Number(userRating).toFixed(1)}/10` : 'Avaliar Filme'}</span>
              </button>

              {/* Favorite button */}
              <button
                onClick={handleToggleFavorite}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isFavorite
                    ? 'bg-red-500/20 border-red-500/50 text-red-500 hover:bg-red-500/30'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
              </button>

              {/* Watchlist toggle button */}
              <button
                onClick={handleToggleWatchlist}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                  isInWatchlist
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
                title={isInWatchlist ? 'Remover da Watchlist' : 'Adicionar à Watchlist'}
              >
                <Bookmark className={`w-4 h-4 ${isInWatchlist ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                <span>{isInWatchlist ? 'Na Watchlist' : 'Quero Assistir'}</span>
              </button>

              {/* Add to Custom List */}
              <button
                onClick={() => setIsListModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-colors"
              >
                <ListPlus className="w-4 h-4 text-amber-400" />
                Listas
              </button>
            </div>

            {/* Overview */}
            <div className="pt-2">
              <h3 className="text-base font-bold text-white mb-1.5">Sinopse</h3>
              <p className="text-zinc-300 text-sm leading-relaxed max-w-3xl">
                {movie.overview || 'Nenhuma sinopse disponível em português.'}
              </p>
            </div>
          </div>
        </div>

        {/* Avaliação do Usuário e Onde Assistir (Mesma Grade) */}
        {(userRating != null || (watchProviders && (watchProviders.flatrate || watchProviders.rent || watchProviders.buy))) && (
          <div className={`mt-8 grid gap-6 ${userRating != null && watchProviders && (watchProviders.flatrate || watchProviders.rent || watchProviders.buy) ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {/* User Review Display if already rated */}
            {userRating != null && (
              <div className="p-6 bg-gradient-to-br from-amber-500/10 via-zinc-900/80 to-zinc-900/60 border border-amber-500/30 rounded-2xl shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 font-extrabold text-sm rounded-lg border border-amber-500/40">
                        <Star className="w-4 h-4 fill-amber-400" /> Minha Avaliação: {Number(userRating).toFixed(1)}/10
                      </span>
                      {userRewatch > 0 && (
                        <span className="text-xs font-semibold text-zinc-400 px-2.5 py-1 rounded-md bg-zinc-800/80 border border-zinc-700/50">
                          Reassistido {userRewatch}x
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setIsRatingModalOpen(true)}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 font-medium transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                  </div>
                  {userComment ? (
                    <div className="flex items-start gap-3 pt-1">
                      <MessageSquare className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-1" />
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">Meu Comentário</span>
                        <p className="text-sm text-zinc-200 leading-relaxed italic">"{userComment}"</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">Sem comentário escrito. Clique em editar para adicionar uma resenha.</p>
                  )}
                </div>
              </div>
            )}

            {/* Streaming / Watch Providers */}
            {watchProviders && (watchProviders.flatrate || watchProviders.rent || watchProviders.buy) && (
              <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Tv className="w-5 h-5 text-amber-400" />
                    Onde Assistir no Brasil
                  </h3>
                  <div className="flex flex-wrap gap-6">
                    {watchProviders.flatrate && (
                      <div>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Streaming</p>
                        <div className="flex flex-wrap gap-2.5">
                          {watchProviders.flatrate.map((provider) => (
                            <div key={provider.provider_id} className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 shadow-sm">
                              <img
                                src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                alt={provider.provider_name}
                                className="w-6 h-6 rounded-lg"
                              />
                              <span className="text-xs font-medium text-zinc-200">{provider.provider_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {watchProviders.rent && (
                      <div>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Aluguel</p>
                        <div className="flex flex-wrap gap-2.5">
                          {watchProviders.rent.map((provider) => (
                            <div key={provider.provider_id} className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 shadow-sm">
                              <img
                                src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                alt={provider.provider_name}
                                className="w-6 h-6 rounded-lg"
                              />
                              <span className="text-xs font-medium text-zinc-200">{provider.provider_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {watchProviders.buy && (
                      <div>
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Comprar</p>
                        <div className="flex flex-wrap gap-2.5">
                          {watchProviders.buy.map((provider) => (
                            <div key={provider.provider_id} className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 shadow-sm">
                              <img
                                src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                                alt={provider.provider_name}
                                className="w-6 h-6 rounded-lg"
                              />
                              <span className="text-xs font-medium text-zinc-200">{provider.provider_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cast Carousel */}
        {movie.credits?.cast && movie.credits.cast.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-white mb-4">Elenco Principal</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800">
              {movie.credits.cast.slice(0, 15).map((actor) => (
                <Link
                  key={actor.id}
                  to={`/atores/${actor.id}`}
                  className="flex-shrink-0 w-28 group text-center"
                >
                  <div className="w-28 h-36 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group-hover:border-amber-500/50 transition-colors">
                    <img
                      src={
                        actor.profile_path
                          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
                      }
                      alt={actor.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <p className="text-xs font-semibold text-zinc-200 mt-2 truncate group-hover:text-amber-400">
                    {actor.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 truncate">{actor.character}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-white mb-4">Recomendações Semelhantes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.slice(0, 6).map((rec) => (
                <MediaCard
                  key={rec.id}
                  id={rec.id}
                  title={rec.title}
                  posterPath={rec.poster_path}
                  voteAverage={rec.vote_average}
                  releaseDate={rec.release_date}
                  type="movie"
                  userRating={movieRatings[rec.id] || null}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {showTrailerModal && trailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl aspect-video bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
            <button
              onClick={() => setShowTrailerModal(false)}
              className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold border border-zinc-700"
            >
              Fechar
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
              title="YouTube trailer"
              allow="autoplay; encrypted-media; fullscreen"
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        mediaId={movieId}
        mediaType="movie"
        mediaTitle={movie.title}
        posterPath={movie.poster_path}
        initialRating={userRating || 0}
        initialComment={userComment}
        initialRewatchCount={userRewatch}
        onSuccess={checkUserStatus}
      />

      <AddToListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        mediaId={movieId}
        mediaType="movie"
        mediaTitle={movie.title}
        posterPath={movie.poster_path}
        backdropPath={movie.backdrop_path}
        voteAverage={movie.vote_average}
        releaseYear={movie.release_date ? new Date(movie.release_date).getFullYear().toString() : undefined}
      />
    </div>
  );
};
