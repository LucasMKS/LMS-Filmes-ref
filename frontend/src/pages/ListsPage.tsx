import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { customListApi, actorListApi } from '../services/api';
import { CustomList, ActorList } from '../types';
import { ListFilter, Plus, FolderPlus, Trash2, Film, Users, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export const ListsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'media' | 'actors'>('media');
  const [mediaLists, setMediaLists] = useState<CustomList[]>([]);
  const [actorLists, setActorLists] = useState<ActorList[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setLoading(true);
    try {
      const [mRes, aRes] = await Promise.all([
        customListApi.getUserLists(),
        actorListApi.getUserLists(),
      ]);
      setMediaLists(mRes.data);
      setActorLists(aRes.data);
    } catch (err) {
      toast.error('Erro ao carregar listas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      if (activeTab === 'media') {
        const res = await customListApi.createList({
          name: name.trim(),
          description: description.trim() || undefined,
          isPublic: true,
        });
        setMediaLists([res.data, ...mediaLists]);
        toast.success('Lista de mídia criada!');
      } else {
        const res = await actorListApi.createList({
          name: name.trim(),
          description: description.trim() || undefined,
          isPublic: true,
        });
        setActorLists([res.data, ...actorLists]);
        toast.success('Lista de atores criada!');
      }
      setName('');
      setDescription('');
    } catch {
      toast.error('Erro ao criar lista');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMediaList = async (listId: number) => {
    if (!window.confirm('Tem certeza de que deseja excluir esta lista?')) return;
    try {
      await customListApi.deleteList(listId);
      setMediaLists((prev) => prev.filter((l) => l.id !== listId));
      toast.info('Lista removida');
    } catch {
      toast.error('Erro ao remover lista');
    }
  };

  const handleDeleteActorList = async (listId: number) => {
    if (!window.confirm('Tem certeza de que deseja excluir esta lista de atores?')) return;
    try {
      await actorListApi.deleteList(listId);
      setActorLists((prev) => prev.filter((l) => l.id !== listId));
      toast.info('Lista de atores removida');
    } catch {
      toast.error('Erro ao remover lista de atores');
    }
  };

  return (
    <div className="min-h-screen pb-16 pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <ListFilter className="w-6 h-6 text-amber-400" />
              Minhas Listas Personalizadas
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Crie coleções personalizadas para organizar filmes, séries e elencos
            </p>
          </div>

          <div className="flex items-center bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('media')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'media' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" /> Filmes & Séries ({mediaLists.length})
            </button>
            <button
              onClick={() => setActiveTab('actors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeTab === 'actors' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Atores ({actorLists.length})
            </button>
          </div>
        </div>

        {/* Create List Card */}
        <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl mb-8 max-w-2xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <FolderPlus className="w-4 h-4 text-amber-400" />
            Criar Nova {activeTab === 'media' ? 'Lista de Produções' : 'Lista de Atores'}
          </h2>
          <form onSubmit={handleCreateList} className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Título da lista..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Descrição (opcional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-bold rounded-xl disabled:opacity-50 transition-colors shadow-md shadow-amber-400/20"
            >
              {creating ? 'Criando...' : '+ Criar Lista'}
            </button>
          </form>
        </div>

        {/* Lists Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div>
            {activeTab === 'media' && (
              mediaLists.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/20 rounded-2xl border border-zinc-800">
                  <Film className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">Nenhuma lista de produções criada ainda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mediaLists.map((list) => (
                    <div
                      key={list.id}
                      className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-base text-white">{list.name}</h3>
                          <button
                            onClick={() => handleDeleteMediaList(list.id)}
                            className="text-zinc-500 hover:text-red-400 p-1"
                            title="Excluir lista"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {list.description && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{list.description}</p>
                        )}
                        <p className="text-xs text-amber-500 font-semibold mt-3">
                          {list.items?.length || 0} itens salvos
                        </p>
                      </div>

                      <div className="pt-4 mt-2 border-t border-zinc-800/60 flex justify-between items-center">
                        <span className="text-[11px] text-zinc-500">
                          {new Date(list.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        <Link
                          to={`/listas/${list.id}`}
                          className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300"
                        >
                          Abrir Lista <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'actors' && (
              actorLists.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900/20 rounded-2xl border border-zinc-800">
                  <Users className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm text-zinc-400">Nenhuma lista de atores criada ainda.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {actorLists.map((list) => (
                    <div
                      key={list.id}
                      className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 flex flex-col justify-between transition-all"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-base text-white">{list.name}</h3>
                          <button
                            onClick={() => handleDeleteActorList(list.id)}
                            className="text-zinc-500 hover:text-red-400 p-1"
                            title="Excluir lista"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {list.description && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{list.description}</p>
                        )}
                        <p className="text-xs text-amber-500 font-semibold mt-3">
                          {list.items?.length || 0} atores
                        </p>
                      </div>

                      <div className="pt-4 mt-2 border-t border-zinc-800/60 flex justify-between items-center">
                        <span className="text-[11px] text-zinc-500">
                          {new Date(list.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                        <Link
                          to={`/listas/atores/${list.id}`}
                          className="flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300"
                        >
                          Abrir Lista <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
