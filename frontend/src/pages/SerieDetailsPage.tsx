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
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useWatchlistStore } from '../store/useWatchlistStore';
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
  Edit3,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

export const SerieDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const serieId = Number(id);
  const { isAuthenticated } = useAuthStore();
  const { serieRatings } = useUserRatingsStore();

  const isFavorite = useFavoritesStore((state) => state.isFavorite(serieId, 'serie'));
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const setSerieFavorite = useFavoritesStore((state) => state.setSerieFavorite);

  const isInWatchlist = useWatchlistStore((state) => state.inWatchlist(serieId, 'serie'));
  const toggleWatchlist = useWatchlistStore((state) => state.toggleWatchlist);
  const setSerieWatchlist = useWatchlistStore((state) => state.setSerieWatchlist);

  const [serie, setSerie] = useState<TmdbSerieDetail | null>(null);
  const [recommendations, setRecommendations] = useState<TmdbSerie[]>([]);
  const [loading, setLoading] = useState(true);

  // User state
  const [userRating, setUserRating] = useState<number | null>(null);
  const [userComment, setUserComment] = useState<string>('');
  const [userRewatch, setUserRewatch] = useState<number>(0);

  // Modals
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);

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

      if (favRes.status === 'fulfilled' && favRes.value.data) {
        const data = favRes.value.data as any;
        const isFav = Boolean(data.isFavorite ?? data.favorite);
        setSerieFavorite(serieId, isFav);
      }
      if (watchRes.status === 'fulfilled') {
        const inList = Boolean(watchRes.value.data && watchRes.value.data.status);
        setSerieWatchlist(serieId, inList);
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
      const isNowFav = await toggleFavorite(serieId, 'serie');
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
      const isNowIn = await toggleWatchlist(serieId, 'serie');
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

  const trailer = serie.videos?.results?.find(
    (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  );

  const watchProviders = serie['watch/providers']?.results?.BR;

  const getYearRange = () => {
    const firstYear = serie.first_air_date ? new Date(serie.first_air_date).getFullYear() : null;
    const lastYear = serie.last_air_date ? new Date(serie.last_air_date).getFullYear() : null;
    if (!firstYear) return null;
    if (serie.status === 'Ended' && lastYear && lastYear !== firstYear) {
      return `${firstYear} - ${lastYear}`;
    }
    if (serie.status !== 'Ended') {
      return `${firstYear} - Presente`;
    }
    return `${firstYear}`;
  };

  const getTotalEpisodes = () => {
    if (!serie.seasons) return serie.number_of_episodes || null;
    const total = serie.seasons.reduce((acc, s) => acc + (s.episode_count || 0), 0);
    return total || serie.number_of_episodes || null;
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-36 sm:-mt-44 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left Column / Sidebar */}
          <div className="w-full md:w-64 lg:w-72 flex-shrink-0 space-y-6">
            {/* Poster */}
            <div className="w-48 sm:w-56 md:w-full mx-auto rounded-2xl overflow-hidden shadow-2xl border-2 border-zinc-800 bg-zinc-900">
              <img
                src={`https://image.tmdb.org/t/p/w500${serie.poster_path}`}
                alt={serie.name}
                className="w-full h-auto object-cover"
              />
            </div>

            {/* User Review Display if already rated */}
            {userRating != null && (
              <div className="p-4 bg-zinc-900/80 border border-amber-500/30 rounded-2xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full -mr-4 -mt-4 blur-xl" />
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Sua Avaliação
                  </span>
                  <button
                    onClick={() => setIsRatingModalOpen(true)}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-amber-400 font-medium transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                </div>
                <div className="flex items-baseline gap-1.5 mb-2">
                  <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                  <span className="text-3xl font-extrabold text-white leading-none">
                    {Number(userRating).toFixed(1)}
                  </span>
                  <span className="text-zinc-500 font-medium text-sm">/10</span>
                </div>
                {userRewatch > 0 && (
                  <div className="mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30">
                      Reassistido {userRewatch}x
                    </span>
                  </div>
                )}
                {userComment ? (
                  <div className="mt-2 pt-2 border-t border-zinc-800/80">
                    <p className="text-xs text-zinc-300 italic leading-relaxed bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                      "{userComment}"
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 italic mt-1">Sem comentário escrito.</p>
                )}
              </div>
            )}

            {/* Onde Assistir / Watch Providers */}
            {watchProviders && (watchProviders.flatrate || watchProviders.buy) && (
              <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Tv className="w-4 h-4 text-amber-400" />
                  Disponível em
                </h3>
                {watchProviders.flatrate && (
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Streaming</span>
                    <div className="flex flex-wrap gap-2">
                      {watchProviders.flatrate.map((provider) => (
                        <div
                          key={provider.provider_id}
                          className="flex items-center gap-2 bg-zinc-950/80 px-2.5 py-1.5 rounded-xl border border-zinc-800"
                          title={provider.provider_name}
                        >
                          <img
                            src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                            alt={provider.provider_name}
                            className="w-5 h-5 rounded-md"
                          />
                          <span className="text-xs text-zinc-300 font-medium">{provider.provider_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {watchProviders.buy && (
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-2">Comprar</span>
                    <div className="flex flex-wrap gap-2">
                      {watchProviders.buy.map((provider) => (
                        <div
                          key={provider.provider_id}
                          className="flex items-center gap-2 bg-zinc-950/80 px-2.5 py-1.5 rounded-xl border border-zinc-800"
                          title={provider.provider_name}
                        >
                          <img
                            src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                            alt={provider.provider_name}
                            className="w-5 h-5 rounded-md"
                          />
                          <span className="text-xs text-zinc-300 font-medium">{provider.provider_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Detalhes Técnicos */}
            {Boolean(serie.networks?.length || serie.created_by?.length || serie.production_companies?.length) && (
              <div className="p-5 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Detalhes Técnicos
                </h3>
                {serie.networks && serie.networks.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <Tv className="w-3.5 h-3.5 text-zinc-400" /> Emissora Original
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {serie.networks.map((net) => (
                        <span key={net.id} className="px-2 py-0.5 bg-zinc-800 text-zinc-200 text-xs font-semibold rounded-md border border-zinc-700">
                          {net.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {serie.created_by && serie.created_by.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                      Criadores
                    </span>
                    <div className="space-y-0.5">
                      {serie.created_by.map((creator) => (
                        <p key={creator.id} className="text-xs text-zinc-300 font-medium">
                          {creator.name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {serie.production_companies && serie.production_companies.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">
                      Produtoras
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {serie.production_companies.slice(0, 5).map((comp) => (
                        <span key={comp.id} className="px-2 py-0.5 bg-zinc-800/60 text-zinc-400 text-xs rounded-md border border-zinc-800">
                          {comp.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column / Main details */}
          <div className="flex-1 min-w-0 space-y-6">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                {serie.name}
              </h1>
              {serie.tagline && (
                <p className="text-zinc-400 italic text-sm sm:text-base mt-1.5 font-light">
                  "{serie.tagline}"
                </p>
              )}
            </div>

            {/* Badges / Stats */}
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-300">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 font-bold rounded-lg border border-amber-500/30">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{serie.vote_average.toFixed(1)}</span>
                <span className="text-zinc-500 font-normal">({serie.vote_count})</span>
              </div>

              {getYearRange() && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span>{getYearRange()}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                <Layers className="w-4 h-4 text-zinc-400" />
                <span>{serie.number_of_seasons} Temporada{serie.number_of_seasons !== 1 ? 's' : ''}</span>
              </div>

              {getTotalEpisodes() && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                  <Play className="w-4 h-4 text-zinc-400 fill-zinc-400" />
                  <span>{getTotalEpisodes()} Episódios</span>
                </div>
              )}

              {serie.status && (
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border ${
                  serie.status === 'Ended'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${serie.status === 'Ended' ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
                  <span>
                    {serie.status === 'Ended'
                      ? 'Finalizada'
                      : serie.status === 'Returning Series'
                        ? 'Em Andamento'
                        : serie.status}
                  </span>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Rate button with prominent highlight */}
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl transition-all shadow-md cursor-pointer ${
                  userRating
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold shadow-amber-500/15 hover:scale-[1.02]'
                    : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                <Star className={`w-4 h-4 ${userRating ? 'fill-amber-400 text-amber-400' : 'fill-zinc-950 text-zinc-950'}`} />
                <span>{userRating ? `Minha Nota: ${Number(userRating).toFixed(1)}/10` : 'Avaliar Série'}</span>
              </button>

              {/* Watch Trailer */}
              {trailer && (
                <button
                  onClick={() => setShowTrailerModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-red-600/20 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Trailer Oficial
                </button>
              )}

              {/* Watchlist toggle button */}
              <button
                onClick={handleToggleWatchlist}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                  isInWatchlist
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
                title={isInWatchlist ? 'Remover da Watchlist' : 'Adicionar à Watchlist'}
              >
                <Bookmark className={`w-4 h-4 ${isInWatchlist ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                <span>{isInWatchlist ? 'Na Watchlist' : 'Quero Assistir'}</span>
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

              {/* Add to Custom List */}
              <button
                onClick={() => setIsListModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <ListPlus className="w-4 h-4 text-amber-400" />
                Listas
              </button>

              {/* Official Homepage */}
              {serie.homepage && (
                <button
                  onClick={() => window.open(serie.homepage, '_blank')}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
                  title="Site Oficial"
                >
                  <ExternalLink className="w-4 h-4" />
                  Site Oficial
                </button>
              )}
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

            {/* Overview */}
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">Sinopse</h3>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                {serie.overview || 'Nenhuma sinopse disponível em português.'}
              </p>
            </div>

            {/* Seasons Section */}
            <div className="pt-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                Temporadas ({serie.seasons?.length || 0})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {serie.seasons?.map((season) => (
                  <Link
                    key={season.id}
                    to={`/series/${serie.id}/season/${season.season_number}`}
                    className="group flex gap-4 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/40 hover:bg-zinc-900 transition-all"
                  >
                    <div className="w-16 h-24 sm:w-20 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-950">
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

            {/* Cast Carousel */}
            {serie.credits?.cast && serie.credits.cast.length > 0 && (
              <div className="pt-4">
                <h3 className="text-xl font-bold text-white mb-4">Elenco Principal</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800">
                  {serie.credits.cast.slice(0, 15).map((actor) => (
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

      {/* Trailer Modal */}
      {showTrailerModal && trailer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-4xl aspect-video bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
            <button
              onClick={() => setShowTrailerModal(false)}
              className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-lg text-xs font-bold border border-zinc-700 cursor-pointer"
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

      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        mediaId={serieId}
        mediaType="serie"
        mediaTitle={serie.name}
        posterPath={serie.poster_path}
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
