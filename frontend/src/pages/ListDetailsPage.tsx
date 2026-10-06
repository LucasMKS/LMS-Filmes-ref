import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { customListApi, actorListApi, movieApi, serieApi, actorApi } from '../services/api';
import { CustomList, ActorList, TmdbMovie, TmdbSerie, TmdbPerson } from '../types';
import { MediaCard } from '../components/MediaCard';
import { ArrowLeft, Trash2, ListFilter, Users, Film } from 'lucide-react';
import { toast } from 'sonner';

export const ListDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const listId = Number(id);
  const isActorList = location.pathname.includes('/atores/');

  const [mediaList, setMediaList] = useState<CustomList | null>(null);
  const [actorList, setActorList] = useState<ActorList | null>(null);
  const [loading, setLoading] = useState(true);

  // Loaded items
  const [loadedMedia, setLoadedMedia] = useState<
    { id: number; type: 'movie' | 'serie'; title: string; poster: string | null; voteAverage: number; date?: string }[]
  >([]);
  const [loadedActors, setLoadedActors] = useState<TmdbPerson[]>([]);

  useEffect(() => {
    if (listId) {
      loadList();
    }
  }, [listId, isActorList]);

  const loadList = async () => {
    setLoading(true);
    try {
      if (isActorList) {
        const res = await actorListApi.getList(listId);
        setActorList(res.data);

        // Load actors
        const actors = await Promise.all(
          res.data.items.map(async (item) => {
            try {
              const a = await actorApi.getDetails(item.actorId);
              return a.data;
            } catch {
              return null;
            }
          })
        );
        setLoadedActors(actors.filter(Boolean) as TmdbPerson[]);
      } else {
        const res = await customListApi.getList(listId);
        setMediaList(res.data);

        // Load media details
        const items = await Promise.all(
          res.data.items.map(async (item) => {
            try {
              if (item.mediaType === 'MOVIE') {
                const m = await movieApi.getDetails(item.mediaId);
                return {
                  id: item.mediaId,
                  type: 'movie' as const,
                  title: m.data.title,
                  poster: m.data.poster_path,
                  voteAverage: m.data.vote_average,
                  date: m.data.release_date,
                };
              } else {
                const s = await serieApi.getDetails(item.mediaId);
                return {
                  id: item.mediaId,
                  type: 'serie' as const,
                  title: s.data.name,
                  poster: s.data.poster_path,
                  voteAverage: s.data.vote_average,
                  date: s.data.first_air_date,
                };
              }
            } catch {
              return null;
            }
          })
        );
        setLoadedMedia(items.filter(Boolean) as any[]);
      }
    } catch {
      toast.error('Erro ao carregar lista');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMediaItem = async (mediaId: number, mediaType: 'movie' | 'serie') => {
    try {
      await customListApi.removeItem(listId, mediaId, mediaType.toUpperCase() as 'MOVIE' | 'SERIE');
      setLoadedMedia((prev) => prev.filter((item) => !(item.id === mediaId && item.type === mediaType)));
      toast.info('Item removido da lista');
    } catch {
      toast.error('Erro ao remover item da lista');
    }
  };

  const handleRemoveActorItem = async (actorId: number) => {
    try {
      await actorListApi.removeActor(listId, actorId);
      setLoadedActors((prev) => prev.filter((a) => a.id !== actorId));
      toast.info('Ator removido da lista');
    } catch {
      toast.error('Erro ao remover ator da lista');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const title = isActorList ? actorList?.name : mediaList?.name;
  const description = isActorList ? actorList?.description : mediaList?.description;

  return (
    <div className="min-h-screen pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/listas"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Listas
        </Link>

        {/* List Header */}
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">
            {isActorList ? <Users className="w-4 h-4" /> : <Film className="w-4 h-4" />}
            {isActorList ? 'Lista de Atores' : 'Lista de Produções'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
          {description && <p className="text-sm text-zinc-400 mt-2">{description}</p>}
        </div>

        {/* Content */}
        {!isActorList ? (
          loadedMedia.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/20 rounded-2xl border border-zinc-800">
              <Film className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">Esta lista está vazia no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {loadedMedia.map((item) => (
                <div key={`${item.type}-${item.id}`} className="relative group">
                  <MediaCard
                    id={item.id}
                    title={item.title}
                    posterPath={item.poster}
                    voteAverage={item.voteAverage}
                    releaseDate={item.date}
                    type={item.type}
                  />
                  <button
                    onClick={() => handleRemoveMediaItem(item.id, item.type)}
                    className="w-full mt-1.5 py-1 text-xs text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex items-center justify-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remover da lista
                  </button>
                </div>
              ))}
            </div>
          )
        ) : loadedActors.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/20 rounded-2xl border border-zinc-800">
            <Users className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">Esta lista de atores está vazia no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {loadedActors.map((actor) => (
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
                    onClick={() => handleRemoveActorItem(actor.id)}
                    className="text-zinc-500 hover:text-red-400 p-1 transition-colors"
                    title="Remover ator da lista"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
