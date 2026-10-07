import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  serieApi, 
  favoriteApi, 
  watchlistApi, 
  ratingApi 
} from '../services/api';
import { TmdbSerieDetail, TmdbSerie } from '../types';
import { MediaCard } from '../components/MediaCard';
import { RatingModal } from '../components/RatingModal';
import { AddToListModal } from '../components/AddToListModal';
import { useAuthStore } from '../store/useAuthStore';
import { useUserRatingsStore } from '../store/useUserRatingsStore';
import { 
  Star, 
  Heart, 
  Bookmark, 
  Calendar, 
  Tv, 
  ListPlus, 
  ArrowLeft, 
  Play, 
  Layers,
  MessageSquare,
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';

export const SerieDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const serieId = Number(id);
  const { isAuthenticated } = useAuthStore();
  const { serieRatings } = useUserRatingsStore();

  const [serie, setSerie] = useState<TmdbSerieDetail | null>(null);
  const [recommendations, setRecommendations] = useState<TmdbSerie[]>([]);
  const [loading, setLoading] = useState(true);

  // User state
  const [isFavorite, setIsFavorite] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userComment, setUserComment] = useState<string>('');
  const [userRewatch, setUserRewatch] = useState<number>(0);

  // Modals
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);

  useEffect(() => {
    if (serieId) {
      loadSerieDetails();
      if (isAuthenticated) {
        checkUserStatus();
      }
    }
    window.scrollTo(0, 0);
  }, [serieId, isAuthenticated]);

  const loadSerieDetails = async () => {
    setLoading(true);
    try {
      const [detailRes, recRes] = await Promise.all([
        serieApi.getDetails(serieId),
        serieApi.getRecommendations(serieId),
      ]);
      setSerie(detailRes.data);
      setRecommendations(recRes.data.results || []);
    } catch (err) {
      console.error('Erro ao carregar série:', err);
      toast.error('Erro ao carregar detalhes da série');
    } finally {
      setLoading(false);
    }
  };

  const checkUserStatus = async () => {
    try {
      const [favRes, watchRes, rateRes] = await Promise.allSettled([
        favoriteApi.checkSerie(serieId),
        watchlistApi.checkSerie(serieId),
        ratingApi.getSerieRating(serieId),
      ]);

      if (favRes.status === 'fulfilled') {
        setIsFavorite(favRes.value.data.isFavorite);
      }
      if (watchRes.status === 'fulfilled') {
        setWatchlistStatus(watchRes.value.data.status);
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
      if (isFavorite) {
        await favoriteApi.removeSerie(serieId);
        setIsFavorite(false);
        toast.info('Removido dos favoritos');
      } else {
        await favoriteApi.addSerie(serieId);
        setIsFavorite(true);
        toast.success('Adicionado aos favoritos!');
      }
    } catch (err) {
      toast.error('Erro ao atualizar favoritos');
    }
  };

  const handleWatchlistChange = async (newStatus: string) => {
    if (!isAuthenticated) {
      toast.error('Faça login para gerenciar sua watchlist');
      return;
    }
    try {
      if (watchlistStatus === newStatus) {
        await watchlistApi.removeSerie(serieId);
        setWatchlistStatus(null);
        toast.info('Removido da watchlist');
      } else {
        await watchlistApi.setSerieStatus(serieId, newStatus);
        setWatchlistStatus(newStatus);
        toast.success('Status da watchlist atualizado!');
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

  if (!serie) {
    return (
      <div className="min-h-screen max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white">Série não encontrada</h2>
        <Link to="/series" className="text-amber-400 hover:underline mt-4 inline-block">
          Voltar para o catálogo de séries
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Backdrop */}
      <div className="relative w-full h-[380px] sm:h-[480px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-[2px] scale-105"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/original${serie.backdrop_path || serie.poster_path})`,
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
                navigate('/series');
              }
            }}
            className="absolute top-6 left-4 sm:left-6 lg:left-8 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white backdrop-blur-md text-sm transition-colors border border-zinc-800 shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </div>

      {/* Main Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-40 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-48 sm:w-64 flex-shrink-0 mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-2xl border-2 border-zinc-800 bg-zinc-900">
            <img
              src={`https://image.tmdb.org/t/p/w500${serie.poster_path}`}
              alt={serie.name}
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {serie.name}
              </h1>
              {serie.tagline && (
                <p className="text-zinc-400 italic text-sm sm:text-base mt-1">"{serie.tagline}"</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-300">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 font-bold rounded-lg border border-amber-500/30">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{serie.vote_average.toFixed(1)}</span>
                <span className="text-zinc-500 font-normal">({serie.vote_count})</span>
              </div>

              {serie.first_air_date && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span>Estreia: {new Date(serie.first_air_date).getFullYear()}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                <Layers className="w-4 h-4 text-zinc-400" />
                <span>{serie.number_of_seasons} Temporada(s)</span>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {serie.genres?.map((g) => (
                <span
                  key={g.id}
                  className="px-3 py-1 bg-zinc-900/90 text-zinc-300 text-xs font-semibold rounded-lg border border-zinc-800"
                >
                  {g.name}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all ${
                  userRating
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <Star className={`w-4 h-4 ${userRating ? 'fill-amber-400' : ''}`} />
                {userRating ? `Minha Nota: ${userRating}/10` : 'Avaliar Série'}
              </button>

              <button
                onClick={handleToggleFavorite}
                className={`p-2.5 rounded-xl border transition-all ${
                  isFavorite
                    ? 'bg-red-500/20 border-red-500/50 text-red-500'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
              </button>

              <div className="relative inline-flex">
                <select
                  value={watchlistStatus || ''}
                  onChange={(e) => handleWatchlistChange(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 font-medium"
                >
                  <option value="">+ Watchlist</option>
                  <option value="PLANNING">Planejo Assistir</option>
                  <option value="WATCHING">Assistindo</option>
                  <option value="COMPLETED">Concluído</option>
                  <option value="DROPPED">Abandonado</option>
                </select>
              </div>

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
                {serie.overview || 'Nenhuma sinopse disponível em português.'}
              </p>
            </div>

            {/* User Review Display if already rated */}
            {userRating != null && (
              <div className="p-4 bg-gradient-to-r from-amber-500/10 via-zinc-900/60 to-zinc-900/40 border border-amber-500/30 rounded-2xl max-w-3xl mt-4 shadow-lg">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-400 font-extrabold text-xs rounded-lg border border-amber-500/40">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> Minha Avaliação: {Number(userRating).toFixed(1)}/10
                    </span>
                    {userRewatch > 0 && (
                      <span className="text-[11px] font-semibold text-zinc-400 px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/50">
                        Reassistido {userRewatch}x
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setIsRatingModalOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 font-medium transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                </div>
                {userComment ? (
                  <div className="flex items-start gap-2.5 pt-1">
                    <MessageSquare className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">Meu Comentário</span>
                      <p className="text-sm text-zinc-200 leading-relaxed italic">"{userComment}"</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 italic">Sem comentário escrito. Clique em editar para adicionar uma resenha.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Seasons Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-400" />
            Temporadas ({serie.seasons?.length || 0})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {serie.seasons?.map((season) => (
              <Link
                key={season.id}
                to={`/series/${serie.id}/season/${season.season_number}`}
                className="group flex gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 hover:bg-zinc-900 transition-all"
              >
                <div className="w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-950">
                  <img
                    src={
                      season.poster_path
                        ? `https://image.tmdb.org/t/p/w200${season.poster_path}`
                        : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=200'
                    }
                    alt={season.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {season.name}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {season.episode_count} episódios
                  </p>
                  {season.air_date && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Estreia: {new Date(season.air_date).getFullYear()}
                    </p>
                  )}
                  <span className="text-xs font-semibold text-amber-500 mt-2 flex items-center gap-1">
                    Ver episódios &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-16">
            <h3 className="text-xl font-bold text-white mb-4">Séries Semelhantes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recommendations.slice(0, 6).map((rec) => (
                <MediaCard
                  key={rec.id}
                  id={rec.id}
                  title={rec.name}
                  posterPath={rec.poster_path}
                  voteAverage={rec.vote_average}
                  releaseDate={rec.first_air_date}
                  type="serie"
                  userRating={serieRatings[rec.id] || null}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        mediaId={serieId}
        mediaType="serie"
        mediaTitle={serie.name}
        initialRating={userRating || 0}
        initialComment={userComment}
        initialRewatchCount={userRewatch}
        onSuccess={checkUserStatus}
      />

      <AddToListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        mediaId={serieId}
        mediaType="serie"
        mediaTitle={serie.name}
        posterPath={serie.poster_path}
        backdropPath={serie.backdrop_path}
        voteAverage={serie.vote_average}
        releaseYear={serie.first_air_date ? new Date(serie.first_air_date).getFullYear().toString() : undefined}
      />
    </div>
  );
};
