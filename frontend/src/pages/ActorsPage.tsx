import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { actorApi, actorListApi } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useUserRatingsStore } from '../store/useUserRatingsStore';
import {
  ActorList,
  TmdbPerson,
  TmdbCreditItem,
} from '../types';
import { MediaCard } from '../components/MediaCard';
import { Pagination } from '../components/Pagination';
import {
  Users,
  Search,
  Sparkles,
  Award,
  Calendar,
  Gem,
  Film,
  Tv,
  X,
  Plus,
  Trash2,
  Check,
  Loader2,
  Flame,
  Pencil,
  FolderHeart,
  ChevronDown,
  ChevronUp,
  Tag,
  SlidersHorizontal,
  Dices,
  Star,
  ArrowLeft,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

// Categorias TMDB para filtragem
export interface CategoryFilterItem {
  id: string;
  label: string;
  genreIds: number[];
}

export const MOVIE_CATEGORIES: CategoryFilterItem[] = [
  { id: 'all', label: 'Todas as Categorias', genreIds: [] },
  { id: 'scifi', label: 'Ficção Científica', genreIds: [878, 10765] },
  { id: 'adventure', label: 'Aventura', genreIds: [12, 10759] },
  { id: 'action', label: 'Ação', genreIds: [28, 10759] },
  { id: 'comedy', label: 'Comédia', genreIds: [35] },
  { id: 'drama', label: 'Drama', genreIds: [18] },
  { id: 'thriller', label: 'Suspense', genreIds: [53, 9648] },
  { id: 'horror', label: 'Terror', genreIds: [27] },
  { id: 'animation', label: 'Animação', genreIds: [16] },
  { id: 'fantasy', label: 'Fantasia', genreIds: [14, 10765] },
  { id: 'romance', label: 'Romance', genreIds: [10749] },
  { id: 'crime', label: 'Crime', genreIds: [80] },
  { id: 'mystery', label: 'Mistério', genreIds: [9648] },
  { id: 'documentary', label: 'Documentário', genreIds: [99] },
  { id: 'family', label: 'Família', genreIds: [10751, 10762] },
  { id: 'war', label: 'Guerra', genreIds: [10752, 10768] },
  { id: 'western', label: 'Faroeste', genreIds: [37] },
];

// Sugestões populares iniciais para adicionar rapidamente
const POPULAR_SUGGESTIONS: Array<{ id: number; name: string; department: string; profile_path: string | null }> = [
  { id: 6193, name: 'Leonardo DiCaprio', department: 'Atuação', profile_path: '/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg' },
  { id: 2037, name: 'Cillian Murphy', department: 'Atuação', profile_path: '/dm6V2YvWBC91GzVvdffmP32mDcl.jpg' },
  { id: 505710, name: 'Zendaya', department: 'Atuação', profile_path: '/3TE2HnlFkMnvFm1d99k8F7yJ02B.jpg' },
  { id: 73457, name: 'Wagner Moura', department: 'Atuação', profile_path: '/4Pz96pYJ5aFzPjB8HspFhLwL8j9.jpg' },
  { id: 1253360, name: 'Pedro Pascal', department: 'Atuação', profile_path: '/9vyK79yqGgDvy3pGjS5N5vA8mX1.jpg' },
  { id: 17419, name: 'Bryan Cranston', department: 'Atuação', profile_path: '/7Jahy5LZX2Fo8fGJltMreAI49hC.jpg' },
  { id: 1245, name: 'Scarlett Johansson', department: 'Atuação', profile_path: '/6NsMbJXRlDZuDzatN2akFdGuTvx.jpg' },
  { id: 234352, name: 'Margot Robbie', department: 'Atuação', profile_path: '/euDPyqLnuUMBGxYooEtNuAhXYAc.jpg' },
  { id: 6384, name: 'Keanu Reeves', department: 'Atuação', profile_path: '/4D0PpNI0kmP58hgrwGC3wC5x0Vy.jpg' },
  { id: 54693, name: 'Emma Stone', department: 'Atuação', profile_path: '/cW0nBv3t8KxZ2A7uJ4iT6L6lYQz.jpg' },
];

type RecommendationTab = 'recommended' | 'crossover' | 'popular' | 'top_rated' | 'gems' | 'recent';
type MediaTypeOption = 'all' | 'movie' | 'tv';

interface AggregatedMediaItem extends TmdbCreditItem {
  matchedActors: Array<{ id: number; name: string; character: string }>;
  recommendationScore?: number;
  popularity?: number;
}

// Filtro robusto para identificar e remover Talk Shows e programas de entrevistas
export const isTalkShow = (item: any): boolean => {
  // TMDB genre ID 10767 = 'Talk' / 'Talk Show', 10763 = 'News'
  if (item.genre_ids && Array.isArray(item.genre_ids)) {
    if (item.genre_ids.includes(10767) || item.genre_ids.includes(10763)) {
      return true;
    }
  }
  if (item.genres && Array.isArray(item.genres)) {
    if (item.genres.some((g: any) => g.id === 10767 || g.id === 10763 || /talk/i.test(g.name))) {
      return true;
    }
  }

  const title = (item.title || item.name || '').toLowerCase();
  const character = (item.character || '').toLowerCase();

  const talkKeywords = [
    'talk show',
    'tonight show',
    'late show',
    'late night with',
    'jimmy kimmel',
    'jimmy fallon',
    'stephen colbert',
    'graham norton',
    'james corden',
    'seth meyers',
    'conan',
    'the daily show',
    'ellen degeneres',
    'the ellen show',
    'kelly clarkson show',
    'live with kelly',
    'good morning america',
    'today show',
    'the view',
    'watch what happens live',
    'the talk',
    'chelsea lately',
    'last call with',
    'real time with bill maher',
    'last week tonight',
    'saturday night live',
  ];

  if (talkKeywords.some((kw) => title.includes(kw))) {
    return true;
  }

  // Se for programa de TV e o ator interpreta a si mesmo (Self, Himself, Herself, Guest)
  const isTv = item.media_type === 'tv' || Boolean(item.first_air_date);
  if (isTv) {
    if (
      character === 'self' ||
      character === 'himself' ||
      character === 'herself' ||
      character.startsWith('self -') ||
      character.startsWith('guest -') ||
      character === 'guest' ||
      character === 'convidado'
    ) {
      return true;
    }
  }

  return false;
};

export const ActorsPage: React.FC = () => {
  const { id: paramListId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const { movieRatings, serieRatings } = useUserRatingsStore();

  // Modo Principal: 'my_lists' (Listas de Atores) ou 'explore' (Catálogo TMDB)
  const [mainView, setMainView] = useState<'my_lists' | 'explore'>('my_lists');

  // Modo de Exibição dentro da lista: 'productions' (Filmes & Séries) ou 'actors_simple' (Atores Simplificado)
  const [displayMode, setDisplayMode] = useState<'productions' | 'actors_simple'>('productions');
  const [simpleActorSearch, setSimpleActorSearch] = useState('');

  // --- ESTADO PARA LISTAS DE ATORES ---
  const [actorLists, setActorLists] = useState<ActorList[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(paramListId ? Number(paramListId) : null);
  const [isLoadingLists, setIsLoadingLists] = useState(true);

  // Modais de Criação, Edição e Exclusão
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenameListModalOpen, setIsRenameListModalOpen] = useState(false);
  const [isDeleteListModalOpen, setIsDeleteListModalOpen] = useState(false);
  const [listNameInput, setListNameInput] = useState('');
  const [listDescInput, setListDescInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Escolher Aleatório
  const [isRandomModalOpen, setIsRandomModalOpen] = useState(false);
  const [randomItem, setRandomItem] = useState<AggregatedMediaItem | null>(null);
  const [isRollingDice, setIsRollingDice] = useState(false);

  // Busca e Autocomplete de Atores para Adicionar
  const [actorSearchQuery, setActorSearchQuery] = useState('');
  const [actorSearchResults, setActorSearchResults] = useState<TmdbPerson[]>([]);
  const [isSearchingActor, setIsSearchingActor] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Créditos TMDB por Ator (cache em memória)
  const [actorCreditsMap, setActorCreditsMap] = useState<Record<number, TmdbCreditItem[]>>({});
  const [loadingCreditsMap, setLoadingCreditsMap] = useState<Record<number, boolean>>({});

  // Filtros e Visualização das Recomendações
  const [activeTab, setActiveTab] = useState<RecommendationTab>('recommended');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeOption>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [titleFilter, setTitleFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(18);

  // Gestão Visual dos Atores da Lista Ativa (compacto / expandido)
  const [isActorsExpanded, setIsActorsExpanded] = useState(false);
  const [actorSearchInList, setActorSearchInList] = useState('');
  const [actorDensityMode, setActorDensityMode] = useState<'normal' | 'compact'>('normal');

  // --- ESTADO PARA MODO EXPLORAR CATÁLOGO ---
  const catalogQuery = searchParams.get('q') || '';
  const [catalogActors, setCatalogActors] = useState<TmdbPerson[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogTotalPages, setCatalogTotalPages] = useState(1);
  const [catalogSearchInput, setCatalogSearchInput] = useState(catalogQuery);

  // Sincroniza selectedListId caso o parâmetro na URL mude
  useEffect(() => {
    if (paramListId) {
      setSelectedListId(Number(paramListId));
    }
  }, [paramListId]);

  // Fecha o dropdown de busca ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carrega listas do usuário
  useEffect(() => {
    if (isAuthenticated) {
      loadActorLists();
    } else {
      setIsLoadingLists(false);
      setMainView('explore');
    }
  }, [isAuthenticated]);

  const loadActorLists = async () => {
    setIsLoadingLists(true);
    try {
      const res = await actorListApi.getUserLists();
      const lists = res.data || [];
      setActorLists(lists);
      if (paramListId) {
        const found = lists.find((l) => l.id === Number(paramListId));
        if (found) {
          setSelectedListId(found.id);
        } else if (lists.length > 0) {
          setSelectedListId(lists[0].id);
          navigate(`/listas/atores/${lists[0].id}`, { replace: true });
        }
      } else if (lists.length > 0 && !selectedListId) {
        setSelectedListId(lists[0].id);
        navigate(`/listas/atores/${lists[0].id}`, { replace: true });
      }
    } catch (err) {
      console.error('Erro ao buscar listas de atores:', err);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const handleSelectList = (listId: number) => {
    setSelectedListId(listId);
    navigate(`/listas/atores/${listId}`);
  };

  // Lista Ativa Selecionada
  const activeList = useMemo(() => {
    if (actorLists.length === 0) return null;
    if (selectedListId) {
      const found = actorLists.find((l) => l.id === selectedListId);
      if (found) return found;
    }
    return actorLists[0] || null;
  }, [actorLists, selectedListId]);

  // Atores da Lista Ativa
  const selectedActors = useMemo(() => {
    if (!activeList || !activeList.items) return [];
    return activeList.items.map((item) => ({
      id: Number(item.actorId),
      name: item.name || `Ator #${item.actorId}`,
      profile_path: item.profilePath || null,
      known_for_department: item.department || 'Atuação',
    }));
  }, [activeList]);

  // Atores filtrados no modo simplificado
  const simplifiedActors = useMemo(() => {
    if (!simpleActorSearch.trim()) return selectedActors;
    const q = simpleActorSearch.toLowerCase().trim();
    return selectedActors.filter((a) => a.name.toLowerCase().includes(q));
  }, [selectedActors, simpleActorSearch]);

  // Carrega créditos para cada ator da lista ativa que ainda não esteja em cache
  useEffect(() => {
    if (!activeList || selectedActors.length === 0) return;

    selectedActors.forEach((actor) => {
      if (!actorCreditsMap[actor.id] && !loadingCreditsMap[actor.id]) {
        fetchActorCredits(actor.id);
      }
    });
  }, [selectedActors, actorCreditsMap, loadingCreditsMap]);

  const fetchActorCredits = async (actorId: number) => {
    setLoadingCreditsMap((prev) => ({ ...prev, [actorId]: true }));
    try {
      const res = await actorApi.getCredits(actorId);
      const castItems = (res.data?.cast || []).map((item) => ({
        ...item,
        media_type: (item.media_type || (item.first_air_date ? 'tv' : 'movie')) as 'movie' | 'tv',
      }));
      setActorCreditsMap((prev) => ({ ...prev, [actorId]: castItems }));
    } catch (e) {
      console.error(`Erro ao carregar créditos do ator ${actorId}:`, e);
      setActorCreditsMap((prev) => ({ ...prev, [actorId]: [] }));
    } finally {
      setLoadingCreditsMap((prev) => ({ ...prev, [actorId]: false }));
    }
  };

  // Busca rápida de atores para adicionar
  useEffect(() => {
    if (!actorSearchQuery.trim() || actorSearchQuery.trim().length < 2) {
      setActorSearchResults([]);
      setIsSearchDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingActor(true);
      try {
        const res = await actorApi.search(actorSearchQuery.trim());
        setActorSearchResults((res.data?.results || []).slice(0, 8));
        setIsSearchDropdownOpen(true);
      } catch (err) {
        console.error('Erro ao buscar atores:', err);
      } finally {
        setIsSearchingActor(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [actorSearchQuery]);

  // Adicionar ator à lista ativa
  const handleSelectActor = async (actor: TmdbPerson) => {
    if (!activeList) {
      toast.error('Selecione ou crie uma lista primeiro.');
      return;
    }

    if (selectedActors.some((a) => a.id === actor.id)) {
      toast.info(`${actor.name} já está nesta lista.`);
      return;
    }

    try {
      const res = await actorListApi.addActor(activeList.id, actor.id, {
        name: actor.name,
        profilePath: actor.profile_path,
        department: actor.known_for_department || 'Atuação',
      });
      setActorLists((prev) => prev.map((l) => (l.id === activeList.id ? res.data : l)));
      fetchActorCredits(actor.id);
      setActorSearchQuery('');
      setIsSearchDropdownOpen(false);
      toast.success(`${actor.name} adicionado à lista "${activeList.name}"!`);
    } catch {
      toast.error('Erro ao adicionar ator à lista.');
    }
  };

  // Remover ator da lista ativa
  const handleRemoveActor = async (actorId: number) => {
    if (!activeList) return;
    const actor = selectedActors.find((a) => a.id === actorId);

    try {
      await actorListApi.removeActor(activeList.id, actorId);
      setActorLists((prev) =>
        prev.map((l) =>
          l.id === activeList.id
            ? { ...l, items: l.items.filter((i) => Number(i.actorId) !== actorId) }
            : l
        )
      );
      if (actor) {
        toast.info(`${actor.name} removido de "${activeList.name}".`);
      }
    } catch {
      toast.error('Erro ao remover ator.');
    }
  };

  // Criar nova lista de atores
  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listNameInput.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await actorListApi.createList({
        name: listNameInput.trim(),
        description: listDescInput.trim() || undefined,
        isPublic: true,
      });
      setActorLists([res.data, ...actorLists]);
      setSelectedListId(res.data.id);
      navigate(`/listas/atores/${res.data.id}`);
      setIsCreateModalOpen(false);
      setListNameInput('');
      setListDescInput('');
      toast.success(`Lista "${res.data.name}" criada com sucesso!`);
    } catch {
      toast.error('Erro ao criar lista.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renomear lista
  const handleRenameList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeList || !listNameInput.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await actorListApi.updateList(activeList.id, {
        name: listNameInput.trim(),
        description: listDescInput.trim(),
      });
      setActorLists((prev) => prev.map((l) => (l.id === activeList.id ? res.data : l)));
      setIsRenameListModalOpen(false);
      toast.success('Lista atualizada com sucesso!');
    } catch {
      toast.error('Erro ao atualizar lista.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Excluir lista
  const handleDeleteList = async () => {
    if (!activeList) return;

    setIsSubmitting(true);
    try {
      await actorListApi.deleteList(activeList.id);
      const remaining = actorLists.filter((l) => l.id !== activeList.id);
      setActorLists(remaining);
      const nextId = remaining.length > 0 ? remaining[0].id : null;
      setSelectedListId(nextId);
      if (nextId) {
        navigate(`/listas/atores/${nextId}`);
      } else {
        navigate('/listas');
      }
      setIsDeleteListModalOpen(false);
      toast.success(`Lista "${activeList.name}" excluída.`);
    } catch {
      toast.error('Erro ao excluir lista.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Limpar atores da lista ativa
  const handleClearList = async () => {
    if (!activeList) return;
    if (!window.confirm(`Tem certeza de que deseja remover todos os atores da lista "${activeList.name}"?`)) return;

    try {
      for (const item of activeList.items) {
        await actorListApi.removeActor(activeList.id, Number(item.actorId)).catch(() => {});
      }
      setActorLists((prev) =>
        prev.map((l) => (l.id === activeList.id ? { ...l, items: [] } : l))
      );
      toast.info(`Atores da lista "${activeList.name}" foram removidos.`);
    } catch {
      toast.error('Erro ao limpar lista.');
    }
  };

  // AGGREGAÇÃO INTELIGENTE DE MÍDIA (FILMES + SÉRIES COM PONTUAÇÃO E CROSSOVER)
  // Talkshows são totalmente desconsiderados conforme solicitado
  const aggregatedMedia = useMemo(() => {
    if (selectedActors.length === 0) return [];

    const mediaMap = new Map<string, AggregatedMediaItem>();

    selectedActors.forEach((actor) => {
      const items = actorCreditsMap[actor.id] || [];
      items.forEach((item) => {
        // Exclui Talk Shows completamente
        if (isTalkShow(item)) return;

        const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
        const key = `${mediaType}_${item.id}`;
        const existing = mediaMap.get(key);
        const character = item.character || '';

        if (existing) {
          if (!existing.matchedActors.some((a) => a.id === actor.id)) {
            existing.matchedActors.push({ id: actor.id, name: actor.name, character });
          }
        } else {
          mediaMap.set(key, {
            ...item,
            media_type: mediaType,
            matchedActors: [{ id: actor.id, name: actor.name, character }],
          });
        }
      });
    });

    const all = Array.from(mediaMap.values());

    // Algoritmo Ponderado LMS Recomenda
    all.forEach((item) => {
      const voteAvg = item.vote_average || 0;
      const voteCnt = item.vote_count || 0;
      const pop = item.popularity || 0;
      const matchedCount = item.matchedActors.length;

      const ratingScore = voteAvg * 10;
      const popScore = Math.min(100, Math.log10(Math.max(1, pop)) * 25);
      const confidence = Math.min(1, Math.log10(Math.max(1, voteCnt + 1)) / 3.8);
      const crossoverBonus = matchedCount > 1 ? (matchedCount - 1) * 45 : 0;

      item.recommendationScore = (ratingScore * 0.55 + popScore * 0.45) * (0.4 + confidence * 0.6) + crossoverBonus;
    });

    return all;
  }, [selectedActors, actorCreditsMap]);

  // Contagem de títulos crossover (onde 2 ou mais atores da lista atuaram juntos)
  const crossoverCount = useMemo(() => {
    return aggregatedMedia.filter((m) => m.matchedActors.length >= 2).length;
  }, [aggregatedMedia]);

  // Contagem dinâmica de títulos por categoria
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: aggregatedMedia.length };
    MOVIE_CATEGORIES.forEach((cat) => {
      if (cat.id === 'all') return;
      counts[cat.id] = aggregatedMedia.filter(
        (item) => item.genre_ids && item.genre_ids.some((gid) => cat.genreIds.includes(gid))
      ).length;
    });
    return counts;
  }, [aggregatedMedia]);

  // Lista organizada de categorias (primeiro todas, depois as que possuem títulos na lista)
  const availableCategories = useMemo(() => {
    const withCount = MOVIE_CATEGORIES.filter((c) => c.id !== 'all' && (categoryCounts[c.id] || 0) > 0);
    const withoutCount = MOVIE_CATEGORIES.filter((c) => c.id !== 'all' && (categoryCounts[c.id] || 0) === 0);
    return [MOVIE_CATEGORIES[0], ...withCount, ...withoutCount];
  }, [categoryCounts]);

  // Atores visíveis no strip compacto da lista ativa
  const displayedActors = useMemo(() => {
    let list = selectedActors;
    if (actorSearchInList.trim()) {
      const q = actorSearchInList.toLowerCase().trim();
      return list.filter((a) => a.name.toLowerCase().includes(q));
    }
    if (!isActorsExpanded && list.length > 8) {
      return list.slice(0, 8);
    }
    return list;
  }, [selectedActors, actorSearchInList, isActorsExpanded]);

  // Reset de paginação ao alternar qualquer filtro
  useEffect(() => {
    setVisibleCount(18);
  }, [activeTab, mediaTypeFilter, selectedCategory, titleFilter, minRating, selectedListId]);

  // Filtragem e Ordenação dos Títulos
  const filteredAndSortedMedia = useMemo(() => {
    let result = aggregatedMedia;

    if (mediaTypeFilter !== 'all') {
      result = result.filter((m) => m.media_type === mediaTypeFilter);
    }

    if (minRating > 0) {
      result = result.filter((m) => (m.vote_average || 0) >= minRating);
    }

    if (selectedCategory !== 'all') {
      const cat = MOVIE_CATEGORIES.find((c) => c.id === selectedCategory);
      if (cat && cat.genreIds.length > 0) {
        result = result.filter(
          (m) => m.genre_ids && m.genre_ids.some((gid) => cat.genreIds.includes(gid))
        );
      }
    }

    if (titleFilter.trim()) {
      const q = titleFilter.toLowerCase();
      result = result.filter(
        (m) =>
          (m.title && m.title.toLowerCase().includes(q)) ||
          (m.name && m.name.toLowerCase().includes(q)) ||
          m.matchedActors.some((a) => a.name.toLowerCase().includes(q) || a.character.toLowerCase().includes(q))
      );
    }

    const copy = [...result];
    switch (activeTab) {
      case 'recommended':
        copy.sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
        break;
      case 'crossover':
        const crossovers = copy.filter((m) => m.matchedActors.length >= 2);
        crossovers.sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));
        return crossovers;
      case 'popular':
        copy.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case 'top_rated':
        copy.sort((a, b) => {
          const diff = (b.vote_average || 0) - (a.vote_average || 0);
          if (diff !== 0) return diff;
          return (b.vote_count || 0) - (a.vote_count || 0);
        });
        break;
      case 'recent':
        copy.sort((a, b) => {
          const dateA = a.release_date || a.first_air_date || '';
          const dateB = b.release_date || b.first_air_date || '';
          return dateB.localeCompare(dateA);
        });
        break;
      case 'gems':
        const gems = copy.filter((m) => (m.vote_average || 0) >= 6.8 && (m.vote_count || 0) >= 15 && (m.vote_count || 0) <= 3000);
        gems.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
        return gems;
    }

    return copy;
  }, [aggregatedMedia, mediaTypeFilter, selectedCategory, titleFilter, minRating, activeTab]);

  const visibleMediaItems = useMemo(() => {
    return filteredAndSortedMedia.slice(0, visibleCount);
  }, [filteredAndSortedMedia, visibleCount]);

  // Escolher Aleatório (Sorteio)
  const handlePickRandom = () => {
    if (filteredAndSortedMedia.length === 0) {
      toast.error('Nenhum título disponível com os filtros atuais para sortear.');
      return;
    }
    setIsRollingDice(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * filteredAndSortedMedia.length);
      setRandomItem(filteredAndSortedMedia[randomIndex]);
      setIsRandomModalOpen(true);
      setIsRollingDice(false);
    }, 200);
  };

  const handleReroll = () => {
    if (filteredAndSortedMedia.length <= 1) {
      toast.info('Só há este título com os filtros atuais.');
      return;
    }
    setIsRollingDice(true);
    setTimeout(() => {
      let nextIndex = Math.floor(Math.random() * filteredAndSortedMedia.length);
      if (randomItem && filteredAndSortedMedia[nextIndex].id === randomItem.id && filteredAndSortedMedia.length > 1) {
        nextIndex = (nextIndex + 1) % filteredAndSortedMedia.length;
      }
      setRandomItem(filteredAndSortedMedia[nextIndex]);
      setIsRollingDice(false);
    }, 250);
  };

  // --- CARREGAMENTO DO MODO EXPLORAR CATÁLOGO ---
  useEffect(() => {
    if (mainView === 'explore') {
      fetchCatalogActors();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [mainView, catalogPage, catalogQuery]);

  const fetchCatalogActors = async () => {
    setCatalogLoading(true);
    try {
      if (catalogQuery) {
        const res = await actorApi.search(catalogQuery, catalogPage);
        setCatalogActors(res.data?.results || []);
        setCatalogTotalPages(res.data?.total_pages || 1);
      } else {
        const res = await actorApi.getPopular(catalogPage);
        setCatalogActors(res.data?.results || []);
        setCatalogTotalPages(res.data?.total_pages || 1);
      }
    } catch (e) {
      console.error('Erro ao buscar catálogo de atores:', e);
    } finally {
      setCatalogLoading(false);
    }
  };

  const handleCatalogSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (catalogSearchInput.trim()) {
      setSearchParams({ q: catalogSearchInput.trim() });
    } else {
      setSearchParams({});
    }
    setCatalogPage(1);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-purple-500/30 pb-20">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* NAVEGAÇÃO DE VOLTA */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigate('/listas')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Minhas Listas
          </button>
        </div>

        {/* CABEÇALHO DA PÁGINA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-2xl">
                <Users className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Listas de Atores & Obras
                </h1>
                <p className="text-sm text-white/50 font-medium mt-0.5">
                  Organize seus atores favoritos, explore filmes e séries e descubra crossovers exclusivos.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Seletor de Modo Principal */}
            <div className="flex items-center bg-[#14141c] p-1 rounded-2xl border border-white/10 text-xs font-semibold">
              <button
                onClick={() => setMainView('my_lists')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  mainView === 'my_lists'
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <FolderHeart className="w-3.5 h-3.5" />
                Minhas Listas
              </button>
              <button
                onClick={() => setMainView('explore')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                  mainView === 'explore'
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Explorar Catálogo
              </button>
            </div>

            {mainView === 'my_lists' && (
              <button
                onClick={() => {
                  setListNameInput('');
                  setListDescInput('');
                  setIsCreateModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl h-10 px-4 text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Nova Lista
              </button>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MODO 1: MINHAS LISTAS DE ATORES & RECOMENDAÇÕES */}
        {/* ========================================================================= */}
        {mainView === 'my_lists' && (
          <div className="mt-6 space-y-6">
            {!isAuthenticated ? (
              <div className="text-center py-20 bg-[#14141c]/40 rounded-3xl border border-dashed border-white/10 space-y-4 max-w-xl mx-auto">
                <Users className="w-12 h-12 text-indigo-400/60 mx-auto" />
                <h3 className="text-xl font-bold text-white">Faça login para gerenciar listas de atores</h3>
                <p className="text-xs text-white/50 leading-relaxed px-6">
                  Crie coleções com seus atores e atrizes favoritos para descobrir produções onde eles atuaram juntos.
                </p>
                <Link
                  to="/login"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl px-6 py-2.5 text-xs shadow-lg shadow-indigo-600/20 inline-block"
                >
                  Fazer Login
                </Link>
              </div>
            ) : isLoadingLists ? (
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 w-32 rounded-xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : actorLists.length === 0 ? (
              <div className="text-center py-20 bg-[#14141c]/40 rounded-3xl border border-dashed border-white/10 space-y-4 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                  <FolderHeart className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">Nenhuma lista de atores criada</h3>
                  <p className="text-xs text-white/50 leading-relaxed px-6">
                    Crie sua primeira lista de atores para desbloquear recomendações personalizadas e encontrar filmes onde atuaram juntos.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setListNameInput('');
                    setListDescInput('');
                    setIsCreateModalOpen(true);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl px-6 h-11 text-xs shadow-lg shadow-indigo-600/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Criar Lista de Atores
                </button>
              </div>
            ) : (
              <>
                {/* BARRA DE SELEÇÃO DE LISTAS (PILL TABS) */}
                <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none horizontal-scroll touch-pan-x max-w-full w-full">
                  <div className="flex items-center gap-2 flex-nowrap min-w-max">
                    <span className="text-xs text-white/40 font-bold uppercase tracking-wider flex items-center gap-1 mr-1">
                      <FolderHeart className="w-3.5 h-3.5 text-indigo-400" /> Minhas Listas:
                    </span>

                    {actorLists.map((list) => {
                      const isSelected = activeList && activeList.id === list.id;
                      const count = list.items?.length || 0;

                      return (
                        <button
                          key={list.id}
                          onClick={() => handleSelectList(list.id)}
                          className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 border cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-md shadow-indigo-950/30 font-bold scale-[1.02]'
                              : 'bg-[#14141c] border-white/10 text-white/60 hover:text-white hover:border-white/20 hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className="truncate max-w-[160px]">{list.name}</span>
                          <span
                            className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold transition-colors ${
                              isSelected ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/50 group-hover:text-white'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}

                    <button
                      onClick={() => {
                        setListNameInput('');
                        setListDescInput('');
                        setIsCreateModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-white/40 hover:text-indigo-400 hover:border-indigo-500/30 border border-dashed border-white/10 transition-colors shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nova Lista</span>
                    </button>
                  </div>
                </div>

                {/* PAINEL DE CONTROLE DA LISTA ATIVA */}
                {activeList && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#14141c] border border-white/10">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white truncate">{activeList.name}</h2>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold shrink-0">
                          {selectedActors.length} {selectedActors.length === 1 ? 'ator/atriz' : 'atores/atrizes'}
                        </span>
                      </div>
                      {activeList.description ? (
                        <p className="text-xs text-white/50 truncate mt-0.5 font-medium">{activeList.description}</p>
                      ) : (
                        <p className="text-xs text-white/30 truncate mt-0.5 font-normal">
                          Adicione atores para receber filmes e séries exclusivos deste grupo.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => {
                          setListNameInput(activeList.name);
                          setListDescInput(activeList.description || '');
                          setIsRenameListModalOpen(true);
                        }}
                        className="text-xs font-semibold text-white/70 hover:text-white hover:bg-white/5 h-8 px-2.5 rounded-xl gap-1.5 border border-white/10 inline-flex items-center cursor-pointer transition-colors"
                        title="Renomear lista ou editar descrição"
                      >
                        <Pencil className="w-3 h-3 text-indigo-400" />
                        Renomear
                      </button>

                      {selectedActors.length > 0 && (
                        <button
                          onClick={handleClearList}
                          className="text-xs font-semibold text-white/60 hover:text-red-400 hover:bg-red-500/10 h-8 px-2.5 rounded-xl gap-1.5 border border-white/10 inline-flex items-center cursor-pointer transition-colors"
                          title="Limpar todos os atores desta lista"
                        >
                          <Trash2 className="w-3 h-3" />
                          Limpar
                        </button>
                      )}

                      <button
                        onClick={() => setIsDeleteListModalOpen(true)}
                        className="text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/15 h-8 px-2.5 rounded-xl gap-1.5 border border-red-500/20 inline-flex items-center cursor-pointer transition-colors"
                        title="Excluir esta lista"
                      >
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </button>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* BARRA DE NAVEGAÇÃO DE MODOS: FILMES & SÉRIES VS ATORES (SIMPLIFICADO) */}
                {/* ========================================================================= */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-[#14141c]/90 border border-white/10 backdrop-blur-xl shadow-xl">
                  {/* Segmented View Mode Tabs */}
                  <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/5 w-full sm:w-auto">
                    <button
                      onClick={() => setDisplayMode('productions')}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        displayMode === 'productions'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Film className="w-4 h-4" />
                      <span>Filmes & Séries</span>
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-black/30 text-white font-bold">
                        {filteredAndSortedMedia.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setDisplayMode('actors_simple')}
                      className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        displayMode === 'actors_simple'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Atores na Lista</span>
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-black/30 text-white font-bold">
                        {selectedActors.length}
                      </span>
                      <span className="text-[10px] text-white/40 hidden md:inline font-normal">
                        • Simplificado
                      </span>
                    </button>
                  </div>

                  {/* Botão Escolher Aleatório (quando no modo produções) */}
                  {displayMode === 'productions' && selectedActors.length > 0 && (
                    <button
                      onClick={handlePickRandom}
                      disabled={filteredAndSortedMedia.length === 0}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      <Dices className={`w-4 h-4 stroke-[2.5] ${isRollingDice ? 'animate-spin' : ''}`} />
                      <span>Escolher Aleatório</span>
                    </button>
                  )}
                </div>

                {/* ========================================================================= */}
                {/* MODO SIMPLIFICADO: GRADE DE ATORES NA LISTA (O que o usuário gostava no /listas/atores) */}
                {/* ========================================================================= */}
                {displayMode === 'actors_simple' && (
                  <div className="space-y-6">
                    {/* Barra de Pesquisa de Atores para Adicionar à Lista */}
                    <div className="relative z-30" ref={searchContainerRef}>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                          {isSearchingActor ? (
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4 text-white/40" />
                          )}
                        </div>

                        <input
                          type="text"
                          value={actorSearchQuery}
                          onChange={(e) => setActorSearchQuery(e.target.value)}
                          onFocus={() => actorSearchQuery.trim() && setIsSearchDropdownOpen(true)}
                          placeholder={`Adicionar ator ou atriz em "${activeList?.name || 'Lista'}" (ex: Bryan Cranston, Zendaya, Wagner Moura)...`}
                          className="w-full pl-11 pr-10 py-3 h-12 bg-[#14141c] border border-white/10 hover:border-white/20 focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/20 rounded-2xl text-white placeholder:text-white/30 text-sm shadow-xl backdrop-blur-xl transition-all focus:outline-none"
                        />

                        {actorSearchQuery && (
                          <button
                            onClick={() => {
                              setActorSearchQuery('');
                              setActorSearchResults([]);
                              setIsSearchDropdownOpen(false);
                            }}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown Autocomplete */}
                      {isSearchDropdownOpen && actorSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#14141c]/98 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden z-50 divide-y divide-white/5 max-h-[340px] overflow-y-auto">
                          {actorSearchResults.map((person) => {
                            const isAlreadySelected = selectedActors.some((a) => a.id === person.id);
                            const avatarUrl = person.profile_path
                              ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=185';

                            return (
                              <div
                                key={person.id}
                                onClick={() => {
                                  if (isAlreadySelected) {
                                    handleRemoveActor(person.id);
                                  } else {
                                    handleSelectActor(person);
                                  }
                                }}
                                className="flex items-center justify-between p-3 transition-colors cursor-pointer hover:bg-white/5"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <img
                                    src={avatarUrl}
                                    alt={person.name}
                                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10 bg-white/5"
                                  />

                                  <div className="flex flex-col text-left min-w-0">
                                    <span className="text-sm font-bold text-white truncate">{person.name}</span>
                                    {person.known_for && person.known_for.length > 0 ? (
                                      <span className="text-xs text-white/40 truncate">
                                        Conhecido por:{' '}
                                        {person.known_for
                                          .map((m: any) => m.title || m.name)
                                          .filter(Boolean)
                                          .slice(0, 2)
                                          .join(', ')}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-white/40">
                                        {person.known_for_department || 'Atuação'}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0 ml-3">
                                  {isAlreadySelected ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveActor(person.id);
                                      }}
                                      className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 font-semibold h-7 px-2.5 rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" /> Remover
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-7 px-2.5 rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Plus className="w-3 h-3" /> Adicionar
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Sugestões Populares para Adicionar */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none horizontal-scroll touch-pan-x max-w-full w-full">
                      <span className="text-xs text-white/30 font-medium shrink-0 flex items-center gap-1 mr-1">
                        <Sparkles className="w-3 h-3 text-indigo-400" /> Sugestões Populares:
                      </span>
                      {POPULAR_SUGGESTIONS.map((actor) => {
                        const isSelected = selectedActors.some((a) => a.id === actor.id);
                        return (
                          <button
                            key={actor.id}
                            onClick={() =>
                              !isSelected
                                ? handleSelectActor(actor as unknown as TmdbPerson)
                                : handleRemoveActor(actor.id)
                            }
                            className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 border transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-semibold'
                                : 'bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.07] border-white/10'
                            }`}
                          >
                            <span>{actor.name}</span>
                            {isSelected ? (
                              <Check className="w-3 h-3 text-indigo-400" />
                            ) : (
                              <Plus className="w-3 h-3 text-white/30" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Métricas de Resumo da Lista */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-[#14141c] border border-white/10 p-3.5 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-white/40 block">Total de Atores</span>
                          <span className="text-lg font-black text-white">{selectedActors.length}</span>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <Users className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="bg-[#14141c] border border-white/10 p-3.5 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-white/40 block">Produções Mapeadas</span>
                          <span className="text-lg font-black text-white">{aggregatedMedia.length}</span>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                          <Film className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="bg-[#14141c] border border-white/10 p-3.5 rounded-2xl flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-white/40 block">Crossovers (Juntos)</span>
                          <span className="text-lg font-black text-amber-400">{crossoverCount}</span>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Barra de Filtro e Busca nos Atores na Lista */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Buscar ator nesta lista..."
                          value={simpleActorSearch}
                          onChange={(e) => setSimpleActorSearch(e.target.value)}
                          className="w-full pl-9 pr-8 py-2 bg-[#14141c] border border-white/10 text-white placeholder:text-white/30 text-xs rounded-xl focus:border-indigo-500 focus:outline-none"
                        />
                        {simpleActorSearch && (
                          <button
                            onClick={() => setSimpleActorSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="text-xs text-white/50 self-end sm:self-auto font-medium">
                        Exibindo <strong className="text-white">{simplifiedActors.length}</strong> de <strong className="text-white">{selectedActors.length}</strong> atores
                      </div>
                    </div>

                    {/* Grade de Atores no Modo Simplificado */}
                    {simplifiedActors.length === 0 ? (
                      <div className="text-center py-16 bg-[#14141c]/40 rounded-3xl border border-dashed border-white/10 space-y-2">
                        <Users className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                        <h4 className="text-base font-bold text-zinc-300">
                          {selectedActors.length === 0 ? 'Esta lista de atores está vazia' : 'Nenhum ator encontrado'}
                        </h4>
                        <p className="text-xs text-zinc-500 max-w-md mx-auto">
                          {selectedActors.length === 0
                            ? 'Adicione atores usando o campo de busca acima ou clicando nas sugestões populares.'
                            : `Nenhum ator correspondente a "${simpleActorSearch}" nesta lista.`}
                        </p>
                        {simpleActorSearch && (
                          <button
                            onClick={() => setSimpleActorSearch('')}
                            className="mt-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 cursor-pointer inline-flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> Limpar busca
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
                        {simplifiedActors.map((actor) => {
                          const avatarUrl = actor.profile_path
                            ? `https://image.tmdb.org/t/p/w300${actor.profile_path}`
                            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';

                          return (
                            <div
                              key={actor.id}
                              className="group relative flex flex-col rounded-2xl overflow-hidden bg-[#14141c] border border-white/10 hover:border-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all"
                            >
                              <Link to={`/atores/${actor.id}`} className="aspect-[2/3] w-full overflow-hidden bg-black/40 relative">
                                <img
                                  src={avatarUrl}
                                  alt={actor.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#14141c] via-transparent to-transparent opacity-60" />
                              </Link>

                              <div className="p-3 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <Link
                                    to={`/atores/${actor.id}`}
                                    className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors truncate block"
                                    title={actor.name}
                                  >
                                    {actor.name}
                                  </Link>
                                  <span className="text-[10px] text-white/40 block truncate">
                                    {actor.known_for_department || 'Atuação'}
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleRemoveActor(actor.id)}
                                  className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
                                  title="Remover ator da lista"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* MODO FILMES & SÉRIES: RECOMENDAÇÕES, FILTROS, CATEGORIAS E OBRAS */}
                {/* ========================================================================= */}
                {displayMode === 'productions' && (
                  <div className="space-y-6">
                    {/* BARRA DE PESQUISA RÁPIDA DE ATORES */}
                    <div className="relative z-30" ref={searchContainerRef}>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40">
                          {isSearchingActor ? (
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                          ) : (
                            <Search className="w-4 h-4 text-white/40" />
                          )}
                        </div>

                        <input
                          type="text"
                          value={actorSearchQuery}
                          onChange={(e) => setActorSearchQuery(e.target.value)}
                          onFocus={() => actorSearchQuery.trim() && setIsSearchDropdownOpen(true)}
                          placeholder={`Adicionar mais atores à lista (ex: Cillian Murphy, Keanu Reeves)...`}
                          className="w-full pl-11 pr-10 py-3 h-12 bg-[#14141c] border border-white/10 hover:border-white/20 focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/20 rounded-2xl text-white placeholder:text-white/30 text-sm shadow-xl backdrop-blur-xl transition-all focus:outline-none"
                        />

                        {actorSearchQuery && (
                          <button
                            onClick={() => {
                              setActorSearchQuery('');
                              setActorSearchResults([]);
                              setIsSearchDropdownOpen(false);
                            }}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Dropdown Autocomplete */}
                      {isSearchDropdownOpen && actorSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#14141c]/98 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl overflow-hidden z-50 divide-y divide-white/5 max-h-[340px] overflow-y-auto">
                          {actorSearchResults.map((person) => {
                            const isAlreadySelected = selectedActors.some((a) => a.id === person.id);
                            const avatarUrl = person.profile_path
                              ? `https://image.tmdb.org/t/p/w185${person.profile_path}`
                              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=185';

                            return (
                              <div
                                key={person.id}
                                onClick={() => {
                                  if (isAlreadySelected) {
                                    handleRemoveActor(person.id);
                                  } else {
                                    handleSelectActor(person);
                                  }
                                }}
                                className="flex items-center justify-between p-3 transition-colors cursor-pointer hover:bg-white/5"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <img
                                    src={avatarUrl}
                                    alt={person.name}
                                    className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10 bg-white/5"
                                  />

                                  <div className="flex flex-col text-left min-w-0">
                                    <span className="text-sm font-bold text-white truncate">{person.name}</span>
                                    {person.known_for && person.known_for.length > 0 ? (
                                      <span className="text-xs text-white/40 truncate">
                                        Conhecido por:{' '}
                                        {person.known_for
                                          .map((m: any) => m.title || m.name)
                                          .filter(Boolean)
                                          .slice(0, 2)
                                          .join(', ')}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-white/40">
                                        {person.known_for_department || 'Atuação'}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0 ml-3">
                                  {isAlreadySelected ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveActor(person.id);
                                      }}
                                      className="bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 font-semibold h-7 px-2.5 rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" /> Remover
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold h-7 px-2.5 rounded-lg text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      <Plus className="w-3 h-3" /> Adicionar
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* CHIPS DOS ATORES DA LISTA ATIVA (STRIP COMPACTO) */}
                    {selectedActors.length > 0 && (
                      <div className="p-4 rounded-2xl bg-[#14141c] border border-white/10 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-white/80 uppercase tracking-wider flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-indigo-400" />
                              Atores na Lista
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                              {selectedActors.length}
                            </span>
                            <span className="text-xs text-white/40 hidden md:inline">•</span>
                            <span className="text-xs text-white/50 hidden md:inline">
                              {aggregatedMedia.length} produções
                              {crossoverCount > 0 && (
                                <span className="text-amber-400 font-semibold ml-1.5">
                                  • {crossoverCount} crossover(s)
                                </span>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
                            {/* Mini busca dentro da lista se houver mais de 5 atores */}
                            {selectedActors.length > 5 && (
                              <div className="relative flex-1 sm:w-44">
                                <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  placeholder="Filtrar ator..."
                                  value={actorSearchInList}
                                  onChange={(e) => setActorSearchInList(e.target.value)}
                                  className="w-full pl-8 pr-7 py-1 bg-black/40 border border-white/10 text-white text-xs rounded-xl focus:border-amber-500/50 focus:outline-none placeholder:text-white/30"
                                />
                                {actorSearchInList && (
                                  <button
                                    onClick={() => setActorSearchInList('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Botão Alternar Densidade */}
                            <button
                              onClick={() => setActorDensityMode((prev) => (prev === 'normal' ? 'compact' : 'normal'))}
                              title={actorDensityMode === 'normal' ? 'Visualização compacta' : 'Visualização normal'}
                              className={`p-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                actorDensityMode === 'compact'
                                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                              }`}
                            >
                              <SlidersHorizontal className="w-3.5 h-3.5" />
                              <span className="text-[11px] hidden sm:inline">
                                {actorDensityMode === 'compact' ? 'Compacto' : 'Normal'}
                              </span>
                            </button>

                            {/* Botão Expandir se houver mais de 8 atores */}
                            {selectedActors.length > 8 && !actorSearchInList.trim() && (
                              <button
                                onClick={() => setIsActorsExpanded((prev) => !prev)}
                                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span>{isActorsExpanded ? 'Recolher' : `Ver todos (${selectedActors.length})`}</span>
                                {isActorsExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                                )}
                              </button>
                            )}

                            <button
                              onClick={() => setDisplayMode('actors_simple')}
                              className="px-2.5 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="Abrir página completa no modo simplificado"
                            >
                              <span>Modo Simplificado</span>
                            </button>
                          </div>
                        </div>

                        {/* Container de Chips */}
                        <div
                          className={`flex flex-wrap gap-2 transition-all ${
                            isActorsExpanded
                              ? 'max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20'
                              : ''
                          }`}
                        >
                          {displayedActors.map((actor) => {
                            const avatarUrl = actor.profile_path
                              ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=185';
                            const isLoading = loadingCreditsMap[actor.id];
                            const isCompact = actorDensityMode === 'compact';

                            return (
                              <div
                                key={actor.id}
                                className={`flex items-center rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group ${
                                  isCompact ? 'gap-1.5 pl-1 pr-2 py-0.5' : 'gap-2 pl-1.5 pr-2.5 py-1.5'
                                }`}
                              >
                                <Link
                                  to={`/atores/${actor.id}`}
                                  className={`rounded-lg overflow-hidden shrink-0 ${
                                    isCompact ? 'w-4 h-4' : 'w-6 h-6'
                                  }`}
                                >
                                  <img src={avatarUrl} alt={actor.name} className="w-full h-full object-cover" />
                                </Link>

                                <Link
                                  to={`/atores/${actor.id}`}
                                  className={`font-semibold text-white/90 hover:text-amber-400 transition-colors truncate max-w-[150px] ${
                                    isCompact ? 'text-[11px]' : 'text-xs'
                                  }`}
                                  title={actor.name}
                                >
                                  {actor.name}
                                </Link>

                                {isLoading ? (
                                  <Loader2 className="w-3 h-3 text-amber-400 animate-spin ml-0.5" />
                                ) : (
                                  <button
                                    onClick={() => handleRemoveActor(actor.id)}
                                    className="text-white/30 hover:text-red-400 p-0.5 rounded transition-colors ml-0.5 cursor-pointer opacity-80 group-hover:opacity-100"
                                    title="Remover ator desta lista"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}

                          {!isActorsExpanded && !actorSearchInList.trim() && selectedActors.length > 8 && (
                            <button
                              onClick={() => setIsActorsExpanded(true)}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                              <span>+{selectedActors.length - 8} outros (Expandir)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* FILTROS E ABAS DE RECOMENDAÇÃO DE OBRAS */}
                    {selectedActors.length > 0 ? (
                      <div className="space-y-4 pt-2">
                        {/* Linha 1 de Filtros: Abas de Ordenação, Tipo de Mídia, Nota TMDB e Busca */}
                        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3">
                          {/* Abas Principais */}
                          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#14141c] border border-white/10 overflow-x-auto max-w-full scrollbar-none horizontal-scroll touch-pan-x w-full xl:w-auto">
                            <button
                              onClick={() => setActiveTab('recommended')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                activeTab === 'recommended'
                                  ? 'bg-purple-600 text-white shadow-md font-bold'
                                  : 'text-white/50 hover:text-white'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Recomendados</span>
                            </button>

                            {selectedActors.length >= 2 && (
                              <button
                                onClick={() => setActiveTab('crossover')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                  activeTab === 'crossover'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                                    : 'text-white/50 hover:text-white'
                                }`}
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Juntos no Elenco</span>
                                {crossoverCount > 0 && (
                                  <span className="px-1.5 py-0.2 text-[10px] bg-black/20 text-current font-bold rounded-full">
                                    {crossoverCount}
                                  </span>
                                )}
                              </button>
                            )}

                            <button
                              onClick={() => setActiveTab('popular')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                activeTab === 'popular'
                                  ? 'bg-white/15 text-white font-bold'
                                  : 'text-white/50 hover:text-white'
                              }`}
                            >
                              <Flame className="w-3.5 h-3.5 text-orange-400" />
                              <span>Populares</span>
                            </button>

                            <button
                              onClick={() => setActiveTab('top_rated')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                activeTab === 'top_rated'
                                  ? 'bg-white/15 text-white font-bold'
                                  : 'text-white/50 hover:text-white'
                              }`}
                            >
                              <Award className="w-3.5 h-3.5 text-yellow-400" />
                              <span>Melhor Avaliados</span>
                            </button>

                            <button
                              onClick={() => setActiveTab('gems')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                activeTab === 'gems'
                                  ? 'bg-white/15 text-white font-bold'
                                  : 'text-white/50 hover:text-white'
                              }`}
                            >
                              <Gem className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Pérolas</span>
                            </button>

                            <button
                              onClick={() => setActiveTab('recent')}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                                activeTab === 'recent'
                                  ? 'bg-white/15 text-white font-bold'
                                  : 'text-white/50 hover:text-white'
                              }`}
                            >
                              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Lançamentos</span>
                            </button>
                          </div>

                          {/* Filtros Auxiliares (Tipo, Nota TMDB e Busca) */}
                          <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto justify-between xl:justify-end">
                            {/* Tipo de Mídia */}
                            <div className="flex items-center p-1 rounded-xl bg-[#14141c] border border-white/10 shrink-0">
                              <button
                                onClick={() => setMediaTypeFilter('all')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  mediaTypeFilter === 'all'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-white/40 hover:text-white'
                                }`}
                              >
                                Todos
                              </button>
                              <button
                                onClick={() => setMediaTypeFilter('movie')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                                  mediaTypeFilter === 'movie'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-white/40 hover:text-white'
                                }`}
                              >
                                <Film className="w-3 h-3" /> Filmes
                              </button>
                              <button
                                onClick={() => setMediaTypeFilter('tv')}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer ${
                                  mediaTypeFilter === 'tv'
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-white/40 hover:text-white'
                                }`}
                              >
                                <Tv className="w-3 h-3" /> Séries
                              </button>
                            </div>

                            {/* Filtro por Nota TMDB */}
                            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#14141c] border border-white/10 shrink-0">
                              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1 pl-1.5 pr-0.5">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Nota:
                              </span>
                              {[
                                { label: 'Todas', value: 0 },
                                { label: '8.0+', value: 8 },
                                { label: '7.0+', value: 7 },
                                { label: '6.0+', value: 6 },
                              ].map((rate) => (
                                <button
                                  key={rate.value}
                                  onClick={() => setMinRating(rate.value)}
                                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                    minRating === rate.value
                                      ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/20'
                                      : 'text-white/50 hover:text-white'
                                  }`}
                                >
                                  {rate.label}
                                </button>
                              ))}
                            </div>

                            {/* Busca dentro dos títulos */}
                            <div className="relative w-full sm:w-44">
                              <Search className="w-3.5 h-3.5 text-white/30 absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Filtrar títulos..."
                                value={titleFilter}
                                onChange={(e) => setTitleFilter(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-[#14141c] border border-white/10 text-white text-xs rounded-xl focus:border-indigo-500 focus:outline-none placeholder:text-white/30"
                              />
                              {titleFilter && (
                                <button
                                  onClick={() => setTitleFilter('')}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Linha 2 de Filtros: Categorias (Gêneros) */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none horizontal-scroll touch-pan-x max-w-full w-full">
                          <span className="text-xs text-white/40 font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 mr-1">
                            <Tag className="w-3.5 h-3.5 text-indigo-400" /> Categorias:
                          </span>

                          {availableCategories.map((cat) => {
                            const isSelected = selectedCategory === cat.id;
                            const count = categoryCounts[cat.id] ?? 0;

                            if (cat.id !== 'all' && count === 0 && !isSelected) {
                              return null;
                            }

                            return (
                              <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer border ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-950/30 scale-[1.02]'
                                    : 'bg-[#14141c] border-white/10 text-white/70 hover:text-white hover:border-white/20 hover:bg-white/5'
                                }`}
                              >
                                <span>{cat.label}</span>
                                <span
                                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
                                    isSelected
                                      ? 'bg-black/25 text-white'
                                      : 'bg-white/10 text-white/50'
                                  }`}
                                >
                                  {count}
                                </span>
                              </button>
                            );
                          })}

                          {selectedCategory !== 'all' && (
                            <button
                              onClick={() => setSelectedCategory('all')}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-white/40 hover:text-amber-400 transition-colors shrink-0 cursor-pointer"
                              title="Limpar filtro de categoria"
                            >
                              <X className="w-3 h-3" />
                              <span>Limpar</span>
                            </button>
                          )}
                        </div>

                        {/* GRID DE FILMES E SÉRIES DOS ATORES */}
                        {visibleMediaItems.length === 0 ? (
                          <div className="text-center py-20 bg-[#14141c]/40 rounded-3xl border border-dashed border-white/10 space-y-2">
                            <Film className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                            <h4 className="text-base font-bold text-zinc-300">Nenhum título encontrado</h4>
                            <p className="text-xs text-zinc-500 max-w-md mx-auto">
                              {minRating > 0
                                ? `Nenhuma produção com nota TMDB ≥ ${minRating.toFixed(1)}.`
                                : selectedCategory !== 'all'
                                ? `Nenhum filme ou série encontrado na categoria "${
                                    MOVIE_CATEGORIES.find((c) => c.id === selectedCategory)?.label || ''
                                  }".`
                                : activeTab === 'crossover'
                                ? 'Nenhum filme ou série com 2 ou mais atores desta lista juntos.'
                                : 'Tente alterar os filtros ou adicione mais atores.'}
                            </p>
                            {(selectedCategory !== 'all' || minRating > 0 || titleFilter) && (
                              <button
                                onClick={() => {
                                  setSelectedCategory('all');
                                  setMinRating(0);
                                  setTitleFilter('');
                                }}
                                className="mt-2 text-xs font-bold text-amber-400 hover:text-amber-300 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 cursor-pointer inline-flex items-center gap-1 transition-colors"
                              >
                                <RotateCcw className="w-3 h-3" /> Redefinir filtros
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                              {visibleMediaItems.map((item) => {
                                const isSerie = item.media_type === 'tv';
                                const title = item.title || item.name || 'Sem título';
                                const date = item.release_date || item.first_air_date;

                                return (
                                  <div key={`${item.media_type}-${item.id}`} className="flex flex-col group relative">
                                    <MediaCard
                                      id={item.id}
                                      title={title}
                                      posterPath={item.poster_path}
                                      voteAverage={item.vote_average || 0}
                                      releaseDate={date}
                                      type={isSerie ? 'serie' : 'movie'}
                                      userRating={
                                        isSerie
                                          ? serieRatings[item.id] || null
                                          : movieRatings[item.id] || null
                                      }
                                    />

                                    {/* Tag com atores da lista que participam do título */}
                                    {item.matchedActors.length > 0 && (
                                      <div className="mt-1.5 px-2 py-1 bg-[#14141c] border border-white/10 rounded-lg text-[10px] text-white/70 line-clamp-1">
                                        {item.matchedActors.length > 1 ? (
                                          <span className="text-amber-400 font-bold flex items-center gap-1">
                                            <Users className="w-3 h-3 shrink-0" />
                                            {item.matchedActors.map((a) => a.name).join(' & ')}
                                          </span>
                                        ) : (
                                          <span>
                                            Com <strong className="text-white">{item.matchedActors[0].name}</strong>
                                            {item.matchedActors[0].character && (
                                              <span className="text-white/40"> ({item.matchedActors[0].character})</span>
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Botão Carregar Mais */}
                            {visibleCount < filteredAndSortedMedia.length && (
                              <div className="flex justify-center mt-10">
                                <button
                                  onClick={() => setVisibleCount((prev) => prev + 24)}
                                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#14141c] border border-white/10 hover:border-amber-400 text-amber-400 text-xs font-bold transition-all shadow-lg hover:bg-white/5 cursor-pointer"
                                >
                                  <ChevronDown className="w-4 h-4" />
                                  Carregar mais títulos ({filteredAndSortedMedia.length - visibleCount} restantes)
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-[#14141c]/40 rounded-3xl border border-dashed border-white/10 max-w-xl mx-auto space-y-3">
                        <Users className="w-10 h-10 text-amber-400/50 mx-auto" />
                        <h3 className="text-base font-bold text-white">Adicione atores para começar</h3>
                        <p className="text-xs text-white/50 px-6">
                          Busque atores acima ou use o modo simplificado para gerenciar sua lista. A filmografia e crossovers serão gerados automaticamente.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODO 2: EXPLORAR CATÁLOGO DE ATORES POPULARES TMDB */}
        {/* ========================================================================= */}
        {mainView === 'explore' && (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {catalogQuery ? `Resultados para "${catalogQuery}"` : 'Atores e Criadores Populares no TMDB'}
                </h2>
                <p className="text-xs text-zinc-400">
                  Explore perfis de atores e descubra produções completas
                </p>
              </div>

              <form onSubmit={handleCatalogSearchSubmit} className="relative min-w-[280px]">
                <input
                  type="text"
                  placeholder="Buscar atores no TMDB..."
                  value={catalogSearchInput}
                  onChange={(e) => setCatalogSearchInput(e.target.value)}
                  className="w-full bg-[#14141c] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-amber-400 cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>

            {catalogLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-[#14141c] rounded-2xl overflow-hidden border border-white/5">
                    <div className="aspect-[2/3] bg-white/5" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : catalogActors.length === 0 ? (
              <div className="text-center py-20 bg-[#14141c]/40 rounded-3xl border border-white/10">
                <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-zinc-300">Nenhum ator encontrado</h3>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                {catalogActors.map((actor) => (
                  <Link
                    key={actor.id}
                    to={`/atores/${actor.id}`}
                    className="group flex flex-col rounded-2xl overflow-hidden bg-[#14141c] border border-white/10 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all"
                  >
                    <div className="aspect-[2/3] w-full overflow-hidden bg-black/40">
                      <img
                        src={
                          actor.profile_path
                            ? `https://image.tmdb.org/t/p/w300${actor.profile_path}`
                            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'
                        }
                        alt={actor.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-xs text-white group-hover:text-amber-400 transition-colors truncate">
                        {actor.name}
                      </h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {actor.known_for_department || 'Atuação'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!catalogLoading && catalogTotalPages > 1 && (
              <Pagination
                currentPage={catalogPage}
                totalPages={catalogTotalPages}
                onPageChange={(p) => setCatalogPage(p)}
              />
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: ESCOLHER ALEATÓRIO (SORTEIO) */}
      {/* ========================================================================= */}
      {isRandomModalOpen && randomItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative bg-[#12121a] border border-amber-500/40 text-white rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl shadow-amber-950/30 flex flex-col">
            {/* Backdrop com Glow */}
            {randomItem.backdrop_path && (
              <div className="absolute inset-x-0 top-0 h-44 overflow-hidden pointer-events-none opacity-25">
                <img
                  src={`https://image.tmdb.org/t/p/w780${randomItem.backdrop_path}`}
                  alt=""
                  className="w-full h-full object-cover blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#12121a]/80 to-[#12121a]" />
              </div>
            )}

            {/* Header do Modal */}
            <div className="relative z-10 flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Dices className={`w-5 h-5 ${isRollingDice ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    LMS Escolheu para Você!
                  </h3>
                  <span className="text-[11px] text-amber-300/80 font-medium">
                    Sorteado entre {filteredAndSortedMedia.length} títulos da sua lista
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsRandomModalOpen(false)}
                className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="relative z-10 p-5 sm:p-6 space-y-4">
              <div className="flex gap-4 items-start">
                {/* Poster */}
                <div className="w-24 sm:w-28 aspect-[2/3] rounded-2xl overflow-hidden shrink-0 bg-black/40 border border-white/10 shadow-lg">
                  <img
                    src={
                      randomItem.poster_path
                        ? `https://image.tmdb.org/t/p/w300${randomItem.poster_path}`
                        : '/placeholder-movie.jpg'
                    }
                    alt={randomItem.title || randomItem.name || ''}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Detalhes */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                      {randomItem.media_type === 'tv' ? 'Série' : 'Filme'}
                    </span>
                    {(randomItem.release_date || randomItem.first_air_date) && (
                      <span className="text-xs text-white/50 font-medium">
                        {new Date(randomItem.release_date || randomItem.first_air_date || '').getFullYear()}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {(randomItem.vote_average || 0).toFixed(1)}
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-white leading-tight">
                    {randomItem.title || randomItem.name}
                  </h4>

                  {/* Atores participantes */}
                  <div className="pt-1">
                    <span className="text-[10px] uppercase font-bold text-white/40 block mb-1">
                      Atores da sua lista no elenco:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {randomItem.matchedActors.map((a) => (
                        <span
                          key={a.id}
                          className="px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold"
                        >
                          {a.name}
                          {a.character && <span className="text-white/40 font-normal"> ({a.character})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sinopse */}
              {randomItem.overview && (
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-3.5 max-h-32 overflow-y-auto">
                  <p className="text-xs text-white/70 leading-relaxed font-normal">
                    {randomItem.overview}
                  </p>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleReroll}
                  disabled={isRollingDice}
                  className="flex-1 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Dices className={`w-4 h-4 text-amber-400 ${isRollingDice ? 'animate-spin' : ''}`} />
                  <span>Sortear Outro</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsRandomModalOpen(false);
                    navigate(randomItem.media_type === 'tv' ? `/series/${randomItem.id}` : `/filmes/${randomItem.id}`);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Film className="w-4 h-4" />
                  <span>Ver Detalhes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR LISTA DE ATORES */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#12121a] border border-white/10 text-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Nova Lista de Atores</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">Nome da Lista *</label>
                <input
                  type="text"
                  placeholder="Ex: Atores de Drama, Meus Favoritos, Mestres do Suspense..."
                  value={listNameInput}
                  onChange={(e) => setListNameInput(e.target.value)}
                  autoFocus
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">Descrição (opcional)</label>
                <textarea
                  placeholder="Breve descrição da lista..."
                  value={listDescInput}
                  onChange={(e) => setListDescInput(e.target.value)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !listNameInput.trim()}
                  className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Criando...' : 'Criar Lista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RENOMEAR LISTA DE ATORES */}
      {isRenameListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#12121a] border border-white/10 text-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Editar Lista de Atores</h3>
              </div>
              <button
                onClick={() => setIsRenameListModalOpen(false)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenameList} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">Nome da Lista *</label>
                <input
                  type="text"
                  value={listNameInput}
                  onChange={(e) => setListNameInput(e.target.value)}
                  autoFocus
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">Descrição</label>
                <textarea
                  value={listDescInput}
                  onChange={(e) => setListDescInput(e.target.value)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenameListModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !listNameInput.trim()}
                  className="flex-1 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EXCLUIR LISTA */}
      {isDeleteListModalOpen && activeList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#12121a] border border-white/10 text-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Excluir Lista</h3>
              <p className="text-xs text-white/60 mt-1">
                Tem certeza de que deseja excluir <strong className="text-white">"{activeList.name}"</strong>? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteListModalOpen(false)}
                className="flex-1 py-2.5 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteList}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-900/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
