import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { customListApi, actorListApi, movieApi, serieApi, actorApi } from '../services/api';
import { CustomList, ActorList, TmdbMovie, TmdbSerie, TmdbPerson } from '../types';
import { MediaCard } from '../components/MediaCard';
import { 
  ArrowLeft, 
  Trash2, 
  ListFilter, 
  Users, 
  Film, 
  Tv, 
  Search, 
  Plus, 
  Check, 
  Loader2, 
  Sparkles,
  BookmarkX 
} from 'lucide-react';
import { toast } from 'sonner';

export const ListDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  // Search & Filter inside list
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'serie'>('all');

  // Quick Add search state
  const [addItemSearchQuery, setAddItemSearchQuery] = useState('');
  const [addItemSearchResults, setAddItemSearchResults] = useState<any[]>([]);
  const [isSearchingAddItem, setIsSearchingAddItem] = useState(false);

  useEffect(() => {
    if (listId) {
      loadList();
    }
  }, [listId, isActorList]);

  // Debounced search for Quick Add
  useEffect(() => {
    if (!addItemSearchQuery || addItemSearchQuery.trim().length < 2) {
      setAddItemSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingAddItem(true);
      try {
        if (isActorList) {
          const res = await actorApi.search(addItemSearchQuery.trim()).catch(() => ({ data: { results: [] } }));
          const actors = (res.data?.results || []).slice(0, 6);
          setAddItemSearchResults(actors);
        } else {
          const [moviesRes, seriesRes] = await Promise.all([
            movieApi.search(addItemSearchQuery.trim()).catch(() => ({ data: { results: [] } })),
            serieApi.search(addItemSearchQuery.trim()).catch(() => ({ data: { results: [] } })),
          ]);

          const moviesList = (moviesRes.data?.results || []).slice(0, 5).map((m: any) => ({
            id: m.id,
            type: 'movie' as const,
            title: m.title,
            posterPath: m.poster_path || null,
            backdropPath: m.backdrop_path || null,
            voteAverage: m.vote_average,
            releaseYear: m.release_date ? new Date(m.release_date).getFullYear().toString() : undefined,
          }));

          const seriesList = (seriesRes.data?.results || []).slice(0, 5).map((s: any) => ({
            id: s.id,
            type: 'serie' as const,
            title: s.name,
            posterPath: s.poster_path || null,
            backdropPath: s.backdrop_path || null,
            voteAverage: s.vote_average,
            releaseYear: s.first_air_date ? new Date(s.first_air_date).getFullYear().toString() : undefined,
          }));

          setAddItemSearchResults([...moviesList, ...seriesList]);
        }
      } catch (err) {
        console.error('Erro na busca de títulos:', err);
      } finally {
        setIsSearchingAddItem(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [addItemSearchQuery, isActorList]);

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
          (res.data.items || []).map(async (item: any) => {
            const rawType = (item.mediaType || item.type || '').toString().toLowerCase();
            const isMovie = rawType === 'movie';
            const mediaIdNum = Number(item.mediaId || item.id);

            // If backend already persisted title and poster
            if (item.title && (item.posterPath || item.poster_path)) {
              return {
                id: mediaIdNum,
                type: (isMovie ? 'movie' : 'serie') as 'movie' | 'serie',
                title: item.title,
                poster: item.posterPath || item.poster_path,
                voteAverage: item.voteAverage ?? item.vote_average ?? 0,
                date: item.releaseYear || item.release_year,
              };
            }

            try {
              if (isMovie) {
                const m = await movieApi.getDetails(mediaIdNum);
                return {
                  id: mediaIdNum,
                  type: 'movie' as const,
                  title: m.data.title,
                  poster: m.data.poster_path,
                  voteAverage: m.data.vote_average,
                  date: m.data.release_date,
                };
              } else {
                const s = await serieApi.getDetails(mediaIdNum);
                return {
                  id: mediaIdNum,
                  type: 'serie' as const,
                  title: s.data.name,
                  poster: s.data.poster_path,
                  voteAverage: s.data.vote_average,
                  date: s.data.first_air_date,
                };
              }
            } catch {
              // Try the other type in case of inverted classification
              try {
                if (!isMovie) {
                  const mFallback = await movieApi.getDetails(mediaIdNum);
                  return {
                    id: mediaIdNum,
                    type: 'movie' as const,
                    title: mFallback.data.title,
                    poster: mFallback.data.poster_path,
                    voteAverage: mFallback.data.vote_average,
                    date: mFallback.data.release_date,
                  };
                } else {
                  const sFallback = await serieApi.getDetails(mediaIdNum);
                  return {
                    id: mediaIdNum,
                    type: 'serie' as const,
                    title: sFallback.data.name,
                    poster: sFallback.data.poster_path,
                    voteAverage: sFallback.data.vote_average,
                    date: sFallback.data.first_air_date,
                  };
                }
              } catch {
                if (item.title) {
                  return {
                    id: mediaIdNum,
                    type: (isMovie ? 'movie' : 'serie') as 'movie' | 'serie',
                    title: item.title,
                    poster: item.posterPath || item.poster_path || null,
                    voteAverage: item.voteAverage ?? item.vote_average ?? 0,
                    date: item.releaseYear,
                  };
                }
                return null;
              }
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

  const handleToggleAddMedia = async (item: any) => {
    const isAlreadyIn = loadedMedia.some((m) => m.id === item.id && m.type === item.type);
    if (isAlreadyIn) {
      await handleRemoveMediaItem(item.id, item.type);
    } else {
      try {
        await customListApi.addItem(listId, {
          id: item.id,
          type: item.type,
          title: item.title,
          posterPath: item.posterPath,
          backdropPath: item.backdropPath,
          voteAverage: item.voteAverage,
          releaseYear: item.releaseYear,
        });
        setLoadedMedia((prev) => [
          {
            id: item.id,
            type: item.type,
            title: item.title,
            poster: item.posterPath,
            voteAverage: item.voteAverage || 0,
            date: item.releaseYear,
          },
          ...prev,
        ]);
        toast.success(`"${item.title}" adicionado à lista!`);
      } catch {
        toast.error('Erro ao adicionar à lista');
      }
    }
  };

  const handleToggleAddActor = async (actor: TmdbPerson) => {
    const isAlreadyIn = loadedActors.some((a) => a.id === actor.id);
    if (isAlreadyIn) {
      await handleRemoveActorItem(actor.id);
    } else {
      try {
        await actorListApi.addActor(listId, actor.id);
        setLoadedActors((prev) => [actor, ...prev]);
        toast.success(`"${actor.name}" adicionado à lista de atores!`);
      } catch {
        toast.error('Erro ao adicionar ator à lista');
      }
    }
  };

  const handleRemoveMediaItem = async (mediaId: number, mediaType: 'movie' | 'serie') => {
    try {
      await customListApi.removeItem(listId, mediaId, mediaType);
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

  // Filter media items
  const filteredMedia = loadedMedia.filter((item) => {
    const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const filteredActors = loadedActors.filter((actor) => {
    return !searchQuery || actor.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/listas');
            }
          }}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Listas
        </button>

        {/* List Header */}
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1">
              {isActorList ? <Users className="w-4 h-4" /> : <Film className="w-4 h-4" />}
              {isActorList ? 'Lista de Atores' : 'Lista de Produções'}
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{title}</h1>
              <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                {isActorList ? loadedActors.length : loadedMedia.length}{' '}
                {(isActorList ? loadedActors.length : loadedMedia.length) === 1 ? 'item' : 'itens'}
              </span>
            </div>
            {description && <p className="text-sm text-zinc-400 mt-2">{description}</p>}
          </div>
        </div>

        {/* Widget de Pesquisa & Resumo da Lista (Quick Add) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          {/* Lado Esquerdo: Busca rápida para Adicionar Títulos à Lista */}
          <div className="lg:col-span-7 bg-[#14141c] border border-purple-500/20 p-4 rounded-2xl space-y-3 relative z-30 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <Plus className="w-4 h-4 text-purple-400" />
                <span>{isActorList ? 'Adicionar atores a esta lista' : 'Adicionar filmes ou séries a esta lista'}</span>
              </div>
              {addItemSearchQuery && (
                <button
                  onClick={() => {
                    setAddItemSearchQuery('');
                    setAddItemSearchResults([]);
                  }}
                  className="text-[11px] text-white/40 hover:text-white transition-colors cursor-pointer"
                >
                  Limpar busca
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 z-10" />
              <input
                type="text"
                placeholder={isActorList ? "Digite o nome do ator (ex: Keanu Reeves, Zendaya)..." : "Digite o nome do filme ou série (ex: Batman, Breaking Bad)..."}
                value={addItemSearchQuery}
                onChange={(e) => setAddItemSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 text-white placeholder:text-white/30 text-xs rounded-xl focus:border-purple-500 focus:outline-none"
              />

              {/* Dropdown FLUTUANTE que sobrepõe sem mover o layout */}
              {(isSearchingAddItem || addItemSearchResults.length > 0 || (addItemSearchQuery.trim().length >= 2 && !isSearchingAddItem)) && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#12121a]/95 border border-purple-500/30 rounded-2xl p-2.5 shadow-2xl backdrop-blur-2xl space-y-1.5 max-h-72 overflow-y-auto">
                  {isSearchingAddItem ? (
                    <div className="p-3 text-center text-xs text-white/40 animate-pulse font-medium">
                      Buscando no catálogo...
                    </div>
                  ) : addItemSearchResults.length > 0 ? (
                    addItemSearchResults.map((result) => {
                      if (isActorList) {
                        const inList = loadedActors.some((a) => a.id === result.id);
                        const profileUrl = result.profile_path
                          ? `https://image.tmdb.org/t/p/w92${result.profile_path}`
                          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=92';

                        return (
                          <div
                            key={result.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/5 hover:bg-white/[0.08] transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img src={profileUrl} alt={result.name} className="w-8 h-10 rounded-lg object-cover bg-white/5 shrink-0 border border-white/10" />
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-white line-clamp-1">{result.name}</h5>
                                <span className="text-[10px] text-white/40">{result.known_for_department || 'Ator'}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleToggleAddActor(result)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                                inList
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                              }`}
                            >
                              {inList ? <><Check className="w-3 h-3 stroke-[3]" /> Adicionado</> : <><Plus className="w-3 h-3" /> Adicionar</>}
                            </button>
                          </div>
                        );
                      }

                      const inList = loadedMedia.some((m) => m.id === result.id && m.type === result.type);
                      const posterUrl = result.posterPath
                        ? `https://image.tmdb.org/t/p/w92${result.posterPath}`
                        : '/placeholder-movie.jpg';

                      return (
                        <div
                          key={`${result.type}_${result.id}`}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] border border-white/5 hover:bg-white/[0.08] transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img src={posterUrl} alt={result.title} className="w-8 h-11 rounded-lg object-cover bg-white/5 shrink-0 border border-white/10" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${
                                  result.type === 'movie'
                                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                    : 'bg-violet-500/10 text-violet-300 border-violet-500/20'
                                }`}>
                                  {result.type === 'movie' ? 'Filme' : 'Série'}
                                </span>
                                {result.releaseYear && <span className="text-[10px] text-white/40 font-medium">{result.releaseYear}</span>}
                              </div>
                              <h5 className="text-xs font-bold text-white line-clamp-1 mt-0.5">{result.title}</h5>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleAddMedia(result)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                              inList
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                            }`}
                          >
                            {inList ? <><Check className="w-3 h-3 stroke-[3]" /> Adicionado</> : <><Plus className="w-3 h-3" /> Adicionar</>}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-white/40 font-medium">
                      Nenhum título encontrado para "{addItemSearchQuery}".
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito: Resumo e Estatísticas da Lista */}
          <div className="lg:col-span-5 bg-[#14141c] border border-white/10 p-4 rounded-2xl flex items-center justify-between shadow-xl">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Resumo da Seleção
              </span>
              <div className="flex items-center gap-3 text-xs text-white/70 font-medium pt-1">
                {!isActorList ? (
                  <>
                    <span>Filmes: <strong className="text-white">{loadedMedia.filter((i) => i.type === 'movie').length}</strong></span>
                    <span className="text-white/20">•</span>
                    <span>Séries: <strong className="text-white">{loadedMedia.filter((i) => i.type === 'serie').length}</strong></span>
                  </>
                ) : (
                  <span>Atores: <strong className="text-white">{loadedActors.length}</strong></span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-white/40 font-medium block">Total de Itens</span>
              <span className="text-sm font-bold text-white">
                {isActorList ? loadedActors.length : loadedMedia.length}
              </span>
            </div>
          </div>
        </div>

        {/* Filtros e Busca dentro da Lista */}
        {((!isActorList && loadedMedia.length > 0) || (isActorList && loadedActors.length > 0)) && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 mb-6">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                placeholder="Buscar nesta lista..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#14141c] border border-white/10 text-white placeholder:text-white/30 text-xs rounded-xl focus:border-purple-500 focus:outline-none"
              />
            </div>

            {!isActorList && (
              <div className="flex items-center gap-1.5 bg-[#14141c] border border-white/10 p-1 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-initial cursor-pointer ${
                    typeFilter === 'all' ? 'bg-purple-600 text-white' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Todos ({loadedMedia.length})
                </button>
                <button
                  onClick={() => setTypeFilter('movie')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-initial flex items-center justify-center gap-1 cursor-pointer ${
                    typeFilter === 'movie' ? 'bg-purple-600 text-white' : 'text-white/40 hover:text-white'
                  }`}
                >
                  <Film className="w-3 h-3" />
                  Filmes ({loadedMedia.filter((i) => i.type === 'movie').length})
                </button>
                <button
                  onClick={() => setTypeFilter('serie')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-1 sm:flex-initial flex items-center justify-center gap-1 cursor-pointer ${
                    typeFilter === 'serie' ? 'bg-purple-600 text-white' : 'text-white/40 hover:text-white'
                  }`}
                >
                  <Tv className="w-3 h-3" />
                  Séries ({loadedMedia.filter((i) => i.type === 'serie').length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {!isActorList ? (
          filteredMedia.length === 0 ? (
            <div className="text-center py-16 bg-zinc-900/20 rounded-2xl border border-zinc-800">
              <BookmarkX className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">
                {loadedMedia.length === 0 ? 'Esta lista está vazia no momento.' : 'Nenhum item corresponde à busca.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
              {filteredMedia.map((item) => (
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
                    className="w-full mt-1.5 py-1 text-xs text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remover da lista
                  </button>
                </div>
              ))}
            </div>
          )
        ) : filteredActors.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/20 rounded-2xl border border-zinc-800">
            <Users className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">
              {loadedActors.length === 0 ? 'Esta lista de atores está vazia no momento.' : 'Nenhum ator corresponde à busca.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredActors.map((actor) => (
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
                    className="text-zinc-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
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
