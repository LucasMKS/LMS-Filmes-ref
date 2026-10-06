import React, { useState, useEffect } from 'react';
import { X, Plus, Check, ListPlus, FolderPlus } from 'lucide-react';
import { customListApi } from '../services/api';
import { CustomList } from '../types';
import { toast } from 'sonner';

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: number;
  mediaType: 'movie' | 'serie';
  mediaTitle: string;
}

export const AddToListModal: React.FC<AddToListModalProps> = ({
  isOpen,
  onClose,
  mediaId,
  mediaType,
  mediaTitle,
}) => {
  const [lists, setLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [addingToListId, setAddingToListId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLists();
    }
  }, [isOpen]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const res = await customListApi.getUserLists();
      setLists(res.data);
    } catch (err) {
      toast.error('Erro ao carregar listas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    setCreating(true);
    try {
      const res = await customListApi.createList({
        name: newListName.trim(),
        description: newListDesc.trim() || undefined,
        isPublic: true,
      });
      toast.success('Lista criada!');
      setNewListName('');
      setNewListDesc('');
      setLists([res.data, ...lists]);
    } catch (err) {
      toast.error('Erro ao criar lista');
    } finally {
      setCreating(false);
    }
  };

  const handleAddMedia = async (listId: number) => {
    setAddingToListId(listId);
    try {
      await customListApi.addItem(listId, {
        mediaId,
        mediaType: mediaType.toUpperCase() as 'MOVIE' | 'SERIE',
      });
      toast.success(`"${mediaTitle}" adicionado à lista!`);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Item já está na lista ou erro ao adicionar');
    } finally {
      setAddingToListId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Adicionar à Lista</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <p className="text-xs text-zinc-400">
            Adicionando <span className="font-semibold text-zinc-200">"{mediaTitle}"</span> para:
          </p>

          {/* User lists */}
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {loading ? (
              <p className="text-xs text-zinc-500 text-center py-4">Carregando listas...</p>
            ) : lists.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">Você ainda não tem listas personalizadas.</p>
            ) : (
              lists.map((list) => (
                <div
                  key={list.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                >
                  <div className="truncate mr-2">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{list.name}</p>
                    <p className="text-[10px] text-zinc-500">{list.items?.length || 0} itens</p>
                  </div>
                  <button
                    onClick={() => handleAddMedia(list.id)}
                    disabled={addingToListId === list.id}
                    className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-semibold rounded-lg transition-colors border border-amber-500/30"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Create new list form */}
          <form onSubmit={handleCreateList} className="pt-3 border-t border-zinc-900 space-y-2">
            <p className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5 text-zinc-400" />
              Criar Nova Lista
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome da lista..."
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={creating || !newListName.trim()}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg disabled:opacity-50"
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
