import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { serieApi, watchedEpisodeApi, ratingApi } from '../services/api';
import { SeasonDetail, EpisodeRatingResponse } from '../types';
import { EpisodeRatingModal } from '../components/EpisodeRatingModal';
import { useAuthStore } from '../store/useAuthStore';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Star, 
  Calendar, 
  Clock, 
  CheckCheck 
} from 'lucide-react';
import { toast } from 'sonner';

export const SeasonDetailsPage: React.FC = () => {
  const { id, seasonNumber } = useParams<{ id: string; seasonNumber: string }>();
  const navigate = useNavigate();
  const serieId = Number(id);
  const seasonNum = Number(seasonNumber);
  const { isAuthenticated } = useAuthStore();

  const [season, setSeason] = useState<SeasonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchedMap, setWatchedMap] = useState<Record<number, boolean>>({});
  const [ratingsMap, setRatingsMap] = useState<Record<number, EpisodeRatingResponse>>({});

  // Episode Rating Modal
  const [selectedEpisode, setSelectedEpisode] = useState<{
    number: number;
    title: string;
    rating?: number;
    comment?: string;
  } | null>(null);

  useEffect(() => {
    if (serieId && !isNaN(seasonNum)) {
      loadSeason();
      if (isAuthenticated) {
        loadUserData();
      }
    }
  }, [serieId, seasonNum, isAuthenticated]);

  const loadSeason = async () => {
    setLoading(true);
    try {
      const res = await serieApi.getSeasonDetails(serieId, seasonNum);
      setSeason(res.data);
    } catch (err) {
      toast.error('Erro ao carregar detalhes da temporada');
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const [watchedRes, ratingsRes] = await Promise.allSettled([
        watchedEpisodeApi.getWatchedEpisodes(serieId),
        ratingApi.getSeasonEpisodeRatings(serieId, seasonNum),
      ]);

      if (watchedRes.status === 'fulfilled') {
        const map: Record<number, boolean> = {};
        watchedRes.value.data
          .filter((item) => item.seasonNumber === seasonNum)
          .forEach((item) => {
            map[item.episodeNumber] = true;
          });
        setWatchedMap(map);
      }

      if (ratingsRes.status === 'fulfilled') {
        const rMap: Record<number, EpisodeRatingResponse> = {};
        ratingsRes.value.data.forEach((r) => {
          rMap[r.episodeNumber] = r;
        });
        setRatingsMap(rMap);
      }
    } catch (err) {
      // Non-blocking
    }
  };

  const handleToggleWatched = async (episodeNumber: number) => {
    if (!isAuthenticated) {
      toast.error('Faça login para marcar episódios como assistidos');
      return;
    }

    const isWatched = !!watchedMap[episodeNumber];
    try {
      if (isWatched) {
        await watchedEpisodeApi.unmarkWatched(serieId, seasonNum, episodeNumber);
        setWatchedMap((prev) => ({ ...prev, [episodeNumber]: false }));
        toast.info(`Episódio ${episodeNumber} desmarcado`);
      } else {
        await watchedEpisodeApi.markWatched({
          serieId,
          seasonNumber: seasonNum,
          episodeNumber,
        });
        setWatchedMap((prev) => ({ ...prev, [episodeNumber]: true }));
        toast.success(`Episódio ${episodeNumber} assistido!`);
      }
    } catch (err) {
      toast.error('Erro ao atualizar status do episódio');
    }
  };

  const handleMarkAllSeason = async () => {
    if (!isAuthenticated || !season?.episodes) return;

    try {
      const promises = season.episodes.map((ep) =>
        watchedEpisodeApi.markWatched({
          serieId,
          seasonNumber: seasonNum,
          episodeNumber: ep.episode_number,
        })
      );
      await Promise.all(promises);
      const newMap: Record<number, boolean> = {};
      season.episodes.forEach((ep) => {
        newMap[ep.episode_number] = true;
      });
      setWatchedMap(newMap);
      toast.success('Todos os episódios da temporada marcados como assistidos!');
    } catch (err) {
      toast.error('Erro ao marcar temporada como assistida');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!season) {
    return (
      <div className="min-h-screen max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white">Temporada não encontrada</h2>
        <Link to={`/series/${serieId}`} className="text-amber-400 hover:underline mt-4 inline-block">
          Voltar para a série
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(`/series/${serieId}`);
              }
            }}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          {isAuthenticated && (
            <button
              onClick={handleMarkAllSeason}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 text-xs font-semibold rounded-xl border border-zinc-800 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar Temporada Inteira como Assistida
            </button>
          )}
        </div>

        {/* Season Header Banner */}
        <div className="flex flex-col md:flex-row gap-6 items-start bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 mb-8">
          {season.poster_path && (
            <div className="w-36 flex-shrink-0 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
              <img
                src={`https://image.tmdb.org/t/p/w300${season.poster_path}`}
                alt={season.name}
                className="w-full h-auto object-cover"
              />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">{season.name}</h1>
            <p className="text-xs text-zinc-400">
              Total de {season.episodes?.length || 0} episódios •{' '}
              {season.air_date ? new Date(season.air_date).toLocaleDateString('pt-BR') : 'Ano N/A'}
            </p>
            <p className="text-zinc-300 text-sm leading-relaxed pt-2">
              {season.overview || 'Nenhuma descrição disponível para esta temporada.'}
            </p>
          </div>
        </div>

        {/* Episodes List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white mb-4">Episódios</h2>

          {season.episodes?.map((ep) => {
            const isWatched = !!watchedMap[ep.episode_number];
            const ratingObj = ratingsMap[ep.episode_number];

            return (
              <div
                key={ep.id}
                className={`flex flex-col sm:flex-row gap-4 p-4 rounded-xl border transition-all ${
                  isWatched
                    ? 'bg-zinc-900/30 border-amber-500/20'
                    : 'bg-zinc-900/70 border-zinc-800/80'
                }`}
              >
                {/* Thumbnail */}
                <div className="relative w-full sm:w-52 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-950">
                  <img
                    src={
                      ep.still_path
                        ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                        : 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=300'
                    }
                    alt={ep.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-zinc-950/80 text-[11px] font-bold text-white">
                    EP {ep.episode_number}
                  </div>
                </div>

                {/* Info & Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-white">
                        {ep.episode_number}. {ep.name}
                      </h3>

                      {/* Watched Checkbox Button */}
                      <button
                        onClick={() => handleToggleWatched(ep.episode_number)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isWatched
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700'
                        }`}
                        title={isWatched ? 'Marcar como não assistido' : 'Marcar como assistido'}
                      >
                        {isWatched ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 fill-amber-400/20" />
                            Assistido
                          </>
                        ) : (
                          <>
                            <Circle className="w-4 h-4" />
                            Marcar
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 mb-2">
                      {ep.air_date && <span>{new Date(ep.air_date).toLocaleDateString('pt-BR')}</span>}
                      {ep.runtime && <span>• {ep.runtime} min</span>}
                      {ep.vote_average > 0 && (
                        <span className="flex items-center gap-1 text-amber-400 font-semibold">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {ep.vote_average.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                      {ep.overview || 'Sem descrição para este episódio.'}
                    </p>
                  </div>

                  {/* Episode Rating Action */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-800/60">
                    {ratingObj ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-amber-400" /> Minha Nota: {ratingObj.rating}/10
                        </span>
                        {ratingObj.comment && (
                          <span className="text-[11px] text-zinc-400 italic truncate max-w-xs">
                            "{ratingObj.comment}"
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-500">Ainda não avaliado</span>
                    )}

                    <button
                      onClick={() =>
                        setSelectedEpisode({
                          number: ep.episode_number,
                          title: ep.name,
                          rating: ratingObj?.rating,
                          comment: ratingObj?.comment,
                        })
                      }
                      className="px-2.5 py-1 text-xs font-semibold text-zinc-300 hover:text-amber-400 bg-zinc-800/80 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-700/60"
                    >
                      {ratingObj ? 'Editar Nota' : 'Avaliar Episódio'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Episode Rating Modal */}
      {selectedEpisode && (
        <EpisodeRatingModal
          isOpen={!!selectedEpisode}
          onClose={() => setSelectedEpisode(null)}
          serieId={serieId}
          seasonNumber={seasonNum}
          episodeNumber={selectedEpisode.number}
          episodeTitle={selectedEpisode.title}
          initialRating={selectedEpisode.rating || 0}
          initialComment={selectedEpisode.comment || ''}
          onSuccess={loadUserData}
        />
      )}
    </div>
  );
};
