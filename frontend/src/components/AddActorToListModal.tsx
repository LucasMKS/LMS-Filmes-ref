import React, { useState, useEffect } from 'react';
import { X, Plus, Users, FolderPlus } from 'lucide-react';
import { actorListApi } from '../services/api';
import { ActorList } from '../types';
import { toast } from 'sonner';

interface AddActorToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  actorId: number;
  actorName: string;
  profilePath?: string | null;
  department?: string;
}

export const AddActorToListModal: React.FC<AddActorToListModalProps> = ({
  isOpen,
  onClose,
  actorId,
  actorName,
  profilePath,
  department,
}) => {
  const [lists, setLists] = useState<ActorList[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [addingToListId, setAddingToListId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLists();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const res = await actorListApi.getUserLists();
      setLists(res.data);
    } catch (err) {
      toast.error('Erro ao carregar listas de atores');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setCreating(true);
    try {
      const res = await actorListApi.createList({
        name: newListName.trim(),
        description: newListDesc.trim() || undefined,
        isPublic: true,
      });
      toast.success('Lista de atores criada!');
      setNewListName('');
      setNewListDesc('');
      setLists([res.data, ...lists]);
    } catch (err) {
      toast.error('Erro ao criar lista');
    } finally {
      setCreating(false);
    }
  };

  const handleAddActor = async (listId: number) => {
    setAddingToListId(listId);
    try {
      await actorListApi.addActor(listId, actorId, {
        name: actorName,
        profilePath,
        department,
      });
      toast.success(`"${actorName}" adicionado à lista de atores!`);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ator já está na lista ou erro');
    } finally {
      setAddingToListId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Adicionar Ator à Lista</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <p className="text-xs text-zinc-400">
            Adicionando <span className="font-semibold text-zinc-200">"{actorName}"</span> para:
          </p>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-xs text-zinc-500 text-center py-4">Carregando listas...</p>
            ) : lists.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">Nenhuma lista de atores criada.</p>
            ) : (
              lists.map((list) => (
                <div
                  key={list.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                >
                  <div className="truncate mr-2">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{list.name}</p>
                    <p className="text-[10px] text-zinc-500">{list.items?.length || 0} atores</p>
                  </div>
                  <button
                    onClick={() => handleAddActor(list.id)}
                    disabled={addingToListId === list.id}
                    className="flex items-center gap-1 px-3 py-1 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-xs font-semibold rounded-lg transition-colors border border-indigo-500/30 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar
                  </button>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleCreateList} className="pt-3 border-t border-zinc-900 space-y-2">
            <p className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
              Criar Lista de Atores
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome da lista de atores..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={creating || !newListName.trim()}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer transition-colors"
              >
                {creating ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
