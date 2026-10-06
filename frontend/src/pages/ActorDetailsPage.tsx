import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { actorApi, favoriteApi } from '../services/api';
import { TmdbPersonDetail, TmdbPersonCredits } from '../types';
import { MediaCard } from '../components/MediaCard';
import { AddActorToListModal } from '../components/AddActorToListModal';
import { useAuthStore } from '../store/useAuthStore';
import { 
  ArrowLeft, 
  Heart, 
  Calendar, 
  MapPin, 
  ListPlus, 
  Film, 
  Tv 
} from 'lucide-react';
import { toast } from 'sonner';

export const ActorDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const actorId = Number(id);
  const { isAuthenticated } = useAuthStore();

  const [actor, setActor] = useState<TmdbPersonDetail | null>(null);
  const [credits, setCredits] = useState<TmdbPersonCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [creditType, setCreditType] = useState<'all' | 'movie' | 'tv'>('all');

  useEffect(() => {
    if (actorId) {
      loadActor();
      if (isAuthenticated) {
        checkFavorite();
      }
    }
    window.scrollTo(0, 0);
  }, [actorId, isAuthenticated]);

  const loadActor = async () => {
    setLoading(true);
    try {
      const [detailRes, creditsRes] = await Promise.all([
        actorApi.getDetails(actorId),
        actorApi.getCredits(actorId),
      ]);
      setActor(detailRes.data);
      setCredits(creditsRes.data);
    } catch (err) {
      toast.error('Erro ao carregar detalhes do ator');
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const res = await favoriteApi.checkActor(actorId);
      setIsFavorite(res.data.isFavorite);
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
        await favoriteApi.removeActor(actorId);
        setIsFavorite(false);
        toast.info('Ator removido dos favoritos');
      } else {
        await favoriteApi.addActor(actorId);
        setIsFavorite(true);
        toast.success('Ator adicionado aos favoritos!');
      }
    } catch (err) {
      toast.error('Erro ao atualizar favorito');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!actor) {
    return (
      <div className="min-h-screen max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-white">Ator não encontrado</h2>
        <Link to="/atores" className="text-amber-400 hover:underline mt-4 inline-block">
          Voltar para a lista de atores
        </Link>
      </div>
    );
  }

  // Filter credits
  const filteredCredits = credits?.cast?.filter((item) => {
    if (creditType === 'movie') return item.media_type === 'movie';
    if (creditType === 'tv') return item.media_type === 'tv';
    return true;
  }) || [];

  return (
    <div className="min-h-screen pb-20 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/atores');
            }
          }}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        {/* Profile Info */}
        <div className="flex flex-col md:flex-row gap-8 items-start bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 mb-12">
          <div className="w-48 sm:w-60 flex-shrink-0 mx-auto md:mx-0 rounded-2xl overflow-hidden border-2 border-zinc-800 bg-zinc-950">
            <img
              src={
                actor.profile_path
                  ? `https://image.tmdb.org/t/p/w500${actor.profile_path}`
                  : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=500'
              }
              alt={actor.name}
              className="w-full h-auto object-cover"
            />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white">{actor.name}</h1>
              <p className="text-sm text-zinc-400 mt-1">{actor.known_for_department || 'Ator / Atriz'}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300">
              {actor.birthday && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span>
                    Nascimento: {new Date(actor.birthday).toLocaleDateString('pt-BR')}
                    {actor.deathday && ` — Falecimento: ${new Date(actor.deathday).toLocaleDateString('pt-BR')}`}
                  </span>
                </div>
              )}

              {actor.place_of_birth && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900 rounded-lg border border-zinc-800">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  <span>{actor.place_of_birth}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={handleToggleFavorite}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isFavorite
                    ? 'bg-red-500/20 border-red-500/50 text-red-500'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500' : ''}`} />
                {isFavorite ? 'Ator Favorito' : 'Favoritar Ator'}
              </button>

              <button
                onClick={() => setIsListModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold rounded-xl transition-colors"
              >
                <ListPlus className="w-4 h-4 text-amber-400" />
                Listas de Atores
              </button>
            </div>

            {/* Biography */}
            <div className="pt-2">
              <h3 className="text-base font-bold text-white mb-1.5">Biografia</h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl whitespace-pre-line">
                {actor.biography || 'Nenhuma biografia disponível em português.'}
              </p>
            </div>
          </div>
        </div>

        {/* Filmography Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white">Filmografia Conhecida</h2>

            <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
              <button
                onClick={() => setCreditType('all')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  creditType === 'all' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Tudo ({credits?.cast?.length || 0})
              </button>
              <button
                onClick={() => setCreditType('movie')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  creditType === 'movie' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" /> Filmes
              </button>
              <button
                onClick={() => setCreditType('tv')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  creditType === 'tv' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Tv className="w-3.5 h-3.5" /> Séries
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredCredits.slice(0, 30).map((item) => (
              <MediaCard
                key={`${item.media_type}-${item.id}`}
                id={item.id}
                title={item.title || item.name || 'Sem título'}
                posterPath={item.poster_path}
                voteAverage={item.vote_average}
                releaseDate={item.release_date || item.first_air_date}
                type={item.media_type === 'tv' ? 'serie' : 'movie'}
              />
            ))}
          </div>
        </div>
      </div>

      <AddActorToListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        actorId={actorId}
        actorName={actor.name}
      />
    </div>
  );
};
