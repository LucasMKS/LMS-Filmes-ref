import { create } from 'zustand';
import { watchlistApi } from '../services/api';

interface WatchlistState {
  watchlistMovieIds: Set<number>;
  watchlistSerieIds: Set<number>;
  isLoaded: boolean;
  isLoading: boolean;
  fetchWatchlist: (force?: boolean) => Promise<void>;
  inWatchlist: (id: number, type: 'movie' | 'serie') => boolean;
  toggleWatchlist: (id: number, type: 'movie' | 'serie') => Promise<boolean>;
  setMovieWatchlist: (id: number, inList: boolean) => void;
  setSerieWatchlist: (id: number, inList: boolean) => void;
  removeMovieWatchlist: (id: number) => void;
  removeSerieWatchlist: (id: number) => void;
  clearWatchlist: () => void;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchlistMovieIds: new Set<number>(),
  watchlistSerieIds: new Set<number>(),
  isLoaded: false,
  isLoading: false,

  fetchWatchlist: async (force = false) => {
    if (get().isLoading) return;
    if (get().isLoaded && !force) return;

    set({ isLoading: true });
    try {
      const [moviesRes, seriesRes] = await Promise.all([
        watchlistApi.getUserMovies().catch(() => ({ data: [] })),
        watchlistApi.getUserSeries().catch(() => ({ data: [] })),
      ]);

      const movieIds = new Set<number>();
      (moviesRes.data || []).forEach((m: any) => {
        const id = Number(m.movieId || m.id);
        if (id) movieIds.add(id);
      });

      const serieIds = new Set<number>();
      (seriesRes.data || []).forEach((s: any) => {
        const id = Number(s.serieId || s.id);
        if (id) serieIds.add(id);
      });

      set({
        watchlistMovieIds: movieIds,
        watchlistSerieIds: serieIds,
        isLoaded: true,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  inWatchlist: (id: number, type: 'movie' | 'serie') => {
    return type === 'movie'
      ? get().watchlistMovieIds.has(Number(id))
      : get().watchlistSerieIds.has(Number(id));
  },

  toggleWatchlist: async (id: number, type: 'movie' | 'serie') => {
    const numId = Number(id);
    const currentlyIn = get().inWatchlist(numId, type);
    const nextState = !currentlyIn;

    // Optimistic update
    if (type === 'movie') {
      get().setMovieWatchlist(numId, nextState);
    } else {
      get().setSerieWatchlist(numId, nextState);
    }

    try {
      if (currentlyIn) {
        if (type === 'movie') {
          await watchlistApi.removeMovie(numId);
        } else {
          await watchlistApi.removeSerie(numId);
        }
        return false;
      } else {
        if (type === 'movie') {
          await watchlistApi.setMovieStatus(numId, 'PLANNING');
        } else {
          await watchlistApi.setSerieStatus(numId, 'PLANNING');
        }
        return true;
      }
    } catch (e) {
      // Revert on error
      if (type === 'movie') {
        get().setMovieWatchlist(numId, currentlyIn);
      } else {
        get().setSerieWatchlist(numId, currentlyIn);
      }
      throw e;
    }
  },

  setMovieWatchlist: (id: number, inList: boolean) =>
    set((state) => {
      const next = new Set(state.watchlistMovieIds);
      if (inList) next.add(Number(id));
      else next.delete(Number(id));
      return { watchlistMovieIds: next };
    }),

  setSerieWatchlist: (id: number, inList: boolean) =>
    set((state) => {
      const next = new Set(state.watchlistSerieIds);
      if (inList) next.add(Number(id));
      else next.delete(Number(id));
      return { watchlistSerieIds: next };
    }),

  removeMovieWatchlist: (id: number) =>
    set((state) => {
      const next = new Set(state.watchlistMovieIds);
      next.delete(Number(id));
      return { watchlistMovieIds: next };
    }),

  removeSerieWatchlist: (id: number) =>
    set((state) => {
      const next = new Set(state.watchlistSerieIds);
      next.delete(Number(id));
      return { watchlistSerieIds: next };
    }),

  clearWatchlist: () =>
    set({
      watchlistMovieIds: new Set<number>(),
      watchlistSerieIds: new Set<number>(),
      isLoaded: false,
      isLoading: false,
    }),
}));
