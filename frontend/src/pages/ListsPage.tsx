import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { customListApi, actorListApi } from '../services/api';
import { CustomList, ActorList, CustomListItem, ActorListItem } from '../types';
import {
  FolderHeart,
  Plus,
  Pencil,
  Trash2,
  Film,
  Users,
  Search,
  Sparkles,
  X,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export const ListsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'media' | 'actors'>('media');
  const [mediaLists, setMediaLists] = useState<CustomList[]>([]);
  const [actorLists, setActorLists] = useState<ActorList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modais de Criação e Edição
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState<'media' | 'actors'>('media');
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal de Renomear
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<{ id: number; type: 'media' | 'actors'; name: string; description: string } | null>(null);

  // Modal de Exclusão
  const [deletingList, setDeletingList] = useState<{ id: number; type: 'media' | 'actors'; name: string } | null>(null);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setLoading(true);
    try {
      const [mRes, aRes] = await Promise.all([
        customListApi.getUserLists().catch(() => ({ data: [] })),
        actorListApi.getUserLists().catch(() => ({ data: [] })),
      ]);
      setMediaLists(mRes.data || []);
      setActorLists(aRes.data || []);
    } catch {
      toast.error('Erro ao carregar listas');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = (type: 'media' | 'actors' = activeTab) => {
    setCreateType(type);
    setNameInput('');
    setDescInput('');
    setIsCreateModalOpen(true);
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      toast.error('Por favor, informe o nome da lista.');
      return;
    }

    setSubmitting(true);
    try {
      if (createType === 'media') {
        const res = await customListApi.createList({
          name: nameInput.trim(),
          description: descInput.trim() || undefined,
          isPublic: true,
        });
        setMediaLists([res.data, ...mediaLists]);
        toast.success(`Lista "${res.data.name}" criada com sucesso!`);
      } else {
        const res = await actorListApi.createList({
          name: nameInput.trim(),
          description: descInput.trim() || undefined,
          isPublic: true,
        });
        setActorLists([res.data, ...actorLists]);
        toast.success(`Lista de atores "${res.data.name}" criada com sucesso!`);
      }
      setIsCreateModalOpen(false);
      setNameInput('');
      setDescInput('');
    } catch {
      toast.error('Erro ao criar lista.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenRenameModal = (list: CustomList | ActorList, type: 'media' | 'actors', e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingList({
      id: list.id,
      type,
      name: list.name,
      description: list.description || '',
    });
    setNameInput(list.name);
    setDescInput(list.description || '');
    setIsRenameModalOpen(true);
  };

  const handleUpdateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingList || !nameInput.trim()) return;

    setSubmitting(true);
    try {
      if (editingList.type === 'media') {
        const res = await customListApi.updateList(editingList.id, {
          name: nameInput.trim(),
          description: descInput.trim(),
        });
        setMediaLists((prev) => prev.map((l) => (l.id === editingList.id ? res.data : l)));
        toast.success('Lista atualizada com sucesso!');
      } else {
        const res = await actorListApi.updateList(editingList.id, {
          name: nameInput.trim(),
          description: descInput.trim(),
        });
        setActorLists((prev) => prev.map((l) => (l.id === editingList.id ? res.data : l)));
        toast.success('Lista de atores atualizada com sucesso!');
      }
      setIsRenameModalOpen(false);
      setEditingList(null);
    } catch {
      toast.error('Erro ao atualizar lista.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (list: CustomList | ActorList, type: 'media' | 'actors', e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingList({
      id: list.id,
      type,
      name: list.name,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deletingList) return;

    setSubmitting(true);
    try {
      if (deletingList.type === 'media') {
        await customListApi.deleteList(deletingList.id);
        setMediaLists((prev) => prev.filter((l) => l.id !== deletingList.id));
        toast.success(`Lista "${deletingList.name}" removida.`);
      } else {
        await actorListApi.deleteList(deletingList.id);
        setActorLists((prev) => prev.filter((l) => l.id !== deletingList.id));
        toast.success(`Lista de atores "${deletingList.name}" removida.`);
      }
      setDeletingList(null);
    } catch {
      toast.error('Erro ao excluir lista.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper para URL de poster/backdrop
  const getMediaImageUrl = (item: CustomListItem, preferBackdrop = false) => {
    const path = preferBackdrop ? item.backdropPath || item.posterPath : item.posterPath || item.backdropPath;
    if (!path) return '/placeholder-movie.jpg';
    return path.startsWith('http') ? path : `https://image.tmdb.org/t/p/w500${path}`;
  };

  const getActorImageUrl = (item: ActorListItem) => {
    if (!item.profilePath) return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';
    return item.profilePath.startsWith('http') ? item.profilePath : `https://image.tmdb.org/t/p/w300${item.profilePath}`;
  };

  // Renderizador de capas dinâmicas (idêntico ao LMS-Filmes antigo)
  const renderMediaCover = (list: CustomList) => {
    const items = list.items || [];
    const count = items.length;

    if (count === 0) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-950/20 to-black/40 text-white/20">
          <FolderHeart className="w-8 h-8 mb-1 text-purple-400/40" />
          <span className="text-[11px] font-semibold text-white/40">Lista Vazia</span>
        </div>
      );
    }

    if (count === 1) {
      return (
        <img
          src={getMediaImageUrl(items[0], true)}
          alt={items[0].title || 'Capa'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      );
    }

    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-0.5 w-full h-full">
          {items.slice(0, 2).map((item, idx) => (
            <div key={idx} className="relative w-full h-full bg-white/5 overflow-hidden">
              <img
                src={getMediaImageUrl(item)}
                alt={item.title || 'Capa'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      );
    }

    if (count === 3) {
      return (
        <div className="grid grid-cols-3 gap-0.5 w-full h-full">
          {items.slice(0, 3).map((item, idx) => (
            <div key={idx} className="relative w-full h-full bg-white/5 overflow-hidden">
              <img
                src={getMediaImageUrl(item)}
                alt={item.title || 'Capa'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-0.5 w-full h-full">
        {items.slice(0, 4).map((item, idx) => (
          <div key={idx} className="relative w-full h-full bg-white/5 overflow-hidden">
            <img
              src={getMediaImageUrl(item, true)}
              alt={item.title || 'Capa'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ))}
      </div>
    );
  };

  const renderActorCover = (list: ActorList) => {
    const items = list.items || [];
    const count = items.length;

    if (count === 0) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-950/20 to-black/40 text-white/20">
          <Users className="w-8 h-8 mb-1 text-amber-400/40" />
          <span className="text-[11px] font-semibold text-white/40">Lista Vazia</span>
        </div>
      );
    }

    if (count === 1) {
      return (
        <img
          src={getActorImageUrl(items[0])}
          alt={items[0].name || 'Ator'}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      );
    }

    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-0.5 w-full h-full">
          {items.slice(0, 2).map((item, idx) => (
            <div key={idx} className="relative w-full h-full bg-white/5 overflow-hidden">
              <img
                src={getActorImageUrl(item)}
                alt={item.name || 'Ator'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      );
    }

    if (count === 3) {
      return (
        <div className="grid grid-cols-3 gap-0.5 w-full h-full">
          {items.slice(0, 3).map((item, idx) => (
            <div key={idx} className="relative w-full h-full bg-white/5 overflow-hidden">
              <img
                src={getActorImageUrl(item)}
                alt={item.name || 'Ator'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-0.5 w-full h-full">
        {items.slice(0, 4).map((item, idx) => (
          <div key={idx} className="relative w-full h-full bg-white/5 overflow-hidden">
            <img
              src={getActorImageUrl(item)}
              alt={item.name || 'Ator'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ))}
      </div>
    );
  };

  // Listas filtradas por busca
  const filteredMediaLists = useMemo(() => {
    if (!searchQuery.trim()) return mediaLists;
    const q = searchQuery.toLowerCase();
    return mediaLists.filter((l) => l.name.toLowerCase().includes(q) || (l.description && l.description.toLowerCase().includes(q)));
  }, [mediaLists, searchQuery]);

  const filteredActorLists = useMemo(() => {
    if (!searchQuery.trim()) return actorLists;
    const q = searchQuery.toLowerCase();
    return actorLists.filter((l) => l.name.toLowerCase().includes(q) || (l.description && l.description.toLowerCase().includes(q)));
  }, [actorLists, searchQuery]);

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-purple-500/30 pb-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-purple-500/10 border border-purple-500/20 p-2.5 rounded-2xl">
                <FolderHeart className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Listas Personalizadas
                </h1>
                <p className="text-sm text-white/50 font-medium mt-0.5">
                  Crie, organize e compartilhe suas seleções de filmes, séries e atores.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleOpenCreateModal(activeTab)}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl h-11 px-5 shadow-lg shadow-purple-900/20 flex items-center gap-2 self-start sm:self-auto transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nova Lista
          </button>
        </div>

        {/* Barra de Filtros & Abas */}
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          {/* Tabs */}
          <div className="flex items-center gap-2 bg-[#14141c] p-1.5 rounded-2xl border border-white/[0.06] text-xs">
            <button
              onClick={() => setActiveTab('media')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'media'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Film className="w-4 h-4" />
              Filmes & Séries ({mediaLists.length})
            </button>
            <button
              onClick={() => setActiveTab('actors')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                activeTab === 'actors'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-white/40 hover:text-white/80'
              }`}
            >
              <Users className="w-4 h-4" />
              Atores ({actorLists.length})
            </button>
          </div>

          {/* Busca de Lista */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome da lista..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#14141c] border border-white/10 text-white placeholder:text-white/30 text-xs rounded-2xl focus:border-purple-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Listagem de Cards */}
        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#14141c] border border-white/[0.06] rounded-3xl p-5 space-y-4 animate-pulse"
                >
                  <div className="aspect-[16/9] w-full bg-white/5 rounded-2xl" />
                  <div className="space-y-2">
                    <div className="h-5 bg-white/10 rounded-lg w-3/4" />
                    <div className="h-3.5 bg-white/5 rounded-lg w-1/2" />
                  </div>
                  <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                    <div className="h-3 bg-white/5 rounded w-1/3" />
                    <div className="h-3 bg-white/5 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === 'media' ? (
            filteredMediaLists.length === 0 ? (
              <div className="text-center py-20 bg-[#14141c]/40 rounded-3xl border border-dashed border-white/10 space-y-4 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto">
                  <FolderHeart className="w-8 h-8 text-purple-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">
                    {searchQuery ? 'Nenhuma lista encontrada' : 'Nenhuma lista criada ainda'}
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed px-6">
                    {searchQuery
                      ? `Não encontramos nenhuma lista com o nome "${searchQuery}".`
                      : 'Você pode criar listas personalizadas como "Para Assistir", "Melhores Filmes de Terror" ou "Maratona de Fim de Semana".'}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    onClick={() => handleOpenCreateModal('media')}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl px-6 h-11 shadow-lg shadow-purple-900/20 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Criar minha primeira lista
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMediaLists.map((list) => {
                  const itemsCount = list.items?.length || 0;

                  return (
                    <div
                      key={list.id}
                      onClick={() => navigate(`/listas/${list.id}`)}
                      className="group relative bg-[#14141c] border border-white/[0.08] hover:border-purple-500/40 rounded-3xl p-5 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-950/20 overflow-hidden flex flex-col justify-between"
                    >
                      {/* Efeito Glow Topo */}
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="space-y-4">
                        {/* Colagem de capas dinâmica */}
                        <div className="relative aspect-[16/9] w-full bg-black/40 rounded-2xl overflow-hidden border border-white/5">
                          {renderMediaCover(list)}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#14141c] via-transparent to-transparent opacity-40 pointer-events-none" />
                        </div>

                        {/* Informações da lista */}
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                              {list.name}
                            </h3>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 text-white/60 font-semibold border border-white/10 flex-shrink-0">
                              {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
                            </span>
                          </div>
                          {list.description && (
                            <p className="text-xs text-white/50 line-clamp-2 mt-1.5 font-medium">
                              {list.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Rodapé do Card com Ações */}
                      <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                        <span className="font-medium">
                          Atualizada em{' '}
                          {list.updatedAt
                            ? new Date(list.updatedAt).toLocaleDateString('pt-BR')
                            : new Date(list.createdAt).toLocaleDateString('pt-BR')}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleOpenRenameModal(list, 'media', e)}
                            title="Renomear Lista"
                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenDeleteModal(list, 'media', e)}
                            title="Excluir Lista"
                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            filteredActorLists.length === 0 ? (
              <div className="text-center py-20 bg-[#14141c]/40 rounded-3xl border border-dashed border-white/10 space-y-4 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">
                    {searchQuery ? 'Nenhuma lista de atores encontrada' : 'Nenhuma lista de atores criada'}
                  </h3>
                  <p className="text-xs text-white/50 leading-relaxed px-6">
                    {searchQuery
                      ? `Não encontramos nenhuma lista de atores com o nome "${searchQuery}".`
                      : 'Organize atores favoritos para descobrir crossovers e recomendações exclusivas das produções em que atuaram juntos.'}
                  </p>
                </div>
                {!searchQuery && (
                  <button
                    onClick={() => handleOpenCreateModal('actors')}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl px-6 h-11 shadow-lg shadow-purple-900/20 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Criar lista de atores
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActorLists.map((list) => {
                  const itemsCount = list.items?.length || 0;

                  return (
                    <div
                      key={list.id}
                      onClick={() => navigate(`/listas/atores/${list.id}`)}
                      className="group relative bg-[#14141c] border border-white/[0.08] hover:border-purple-500/40 rounded-3xl p-5 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-950/20 overflow-hidden flex flex-col justify-between"
                    >
                      {/* Efeito Glow Topo */}
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="space-y-4">
                        {/* Colagem de capas dinâmica */}
                        <div className="relative aspect-[16/9] w-full bg-black/40 rounded-2xl overflow-hidden border border-white/5">
                          {renderActorCover(list)}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#14141c] via-transparent to-transparent opacity-40 pointer-events-none" />
                        </div>

                        {/* Informações da lista */}
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                              {list.name}
                            </h3>
                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 text-white/60 font-semibold border border-white/10 flex-shrink-0">
                              {itemsCount} {itemsCount === 1 ? 'ator' : 'atores'}
                            </span>
                          </div>
                          {list.description && (
                            <p className="text-xs text-white/50 line-clamp-2 mt-1.5 font-medium">
                              {list.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Rodapé do Card com Ações */}
                      <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
                        <span className="font-medium">
                          Atualizada em{' '}
                          {list.updatedAt
                            ? new Date(list.updatedAt).toLocaleDateString('pt-BR')
                            : new Date(list.createdAt).toLocaleDateString('pt-BR')}
                        </span>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleOpenRenameModal(list, 'actors', e)}
                            title="Renomear Lista"
                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleOpenDeleteModal(list, 'actors', e)}
                            title="Excluir Lista"
                            className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </main>

      {/* Modal: Criar Nova Lista */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#12121a] border border-white/10 text-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FolderHeart className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Criar Nova Lista</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">Tipo de Lista</label>
                <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setCreateType('media')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      createType === 'media'
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <Film className="w-3.5 h-3.5" /> Filmes & Séries
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateType('actors')}
                    className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      createType === 'actors'
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Atores
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">Nome da Lista *</label>
                <input
                  type="text"
                  placeholder="Ex: Favoritos de Suspense, Maratona 2026..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  autoFocus
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">Descrição (opcional)</label>
                <textarea
                  placeholder="Breve descrição sobre o conteúdo ou objetivo desta lista..."
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none resize-none"
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
                  disabled={submitting || !nameInput.trim()}
                  className="flex-1 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Criando...' : 'Criar Lista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Renomear / Editar Lista */}
      {isRenameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#12121a] border border-white/10 text-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Editar Lista</h3>
              </div>
              <button
                onClick={() => setIsRenameModalOpen(false)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateList} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">Nome da Lista *</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  autoFocus
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/70">Descrição</label>
                <textarea
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder:text-white/30 focus:border-purple-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !nameInput.trim()}
                  className="flex-1 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar Exclusão */}
      {deletingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#12121a] border border-white/10 text-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Excluir Lista</h3>
              <p className="text-xs text-white/60 mt-1">
                Tem certeza de que deseja excluir <strong className="text-white">"{deletingList.name}"</strong>? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingList(null)}
                className="flex-1 py-2.5 rounded-2xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-900/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
