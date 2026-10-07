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

const getStoredIds = (key: string): Set<number> => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set<number>();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set<number>(parsed.map(Number).filter(Boolean));
    }
  } catch {}
  return new Set<number>();
};

const saveStoredIds = (key: string, setIds: Set<number>) => {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(setIds)));
  } catch {}
};

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  watchlistMovieIds: getStoredIds('lms_watchlist_movies'),
  watchlistSerieIds: getStoredIds('lms_watchlist_series'),
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

      saveStoredIds('lms_watchlist_movies', movieIds);
      saveStoredIds('lms_watchlist_series', serieIds);

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
      saveStoredIds('lms_watchlist_movies', next);
      return { watchlistMovieIds: next };
    }),

  setSerieWatchlist: (id: number, inList: boolean) =>
    set((state) => {
      const next = new Set(state.watchlistSerieIds);
      if (inList) next.add(Number(id));
      else next.delete(Number(id));
      saveStoredIds('lms_watchlist_series', next);
      return { watchlistSerieIds: next };
    }),

  removeMovieWatchlist: (id: number) => {
    const numId = Number(id);
    watchlistApi.removeMovie(numId).catch(() => {});
    set((state) => {
      const next = new Set(state.watchlistMovieIds);
      next.delete(numId);
      saveStoredIds('lms_watchlist_movies', next);
      return { watchlistMovieIds: next };
    });
  },

  removeSerieWatchlist: (id: number) => {
    const numId = Number(id);
    watchlistApi.removeSerie(numId).catch(() => {});
    set((state) => {
      const next = new Set(state.watchlistSerieIds);
      next.delete(numId);
      saveStoredIds('lms_watchlist_series', next);
      return { watchlistSerieIds: next };
    });
  },

  clearWatchlist: () => {
    try {
      localStorage.removeItem('lms_watchlist_movies');
      localStorage.removeItem('lms_watchlist_series');
    } catch {}
    set({
      watchlistMovieIds: new Set<number>(),
      watchlistSerieIds: new Set<number>(),
      isLoaded: false,
      isLoading: false,
    });
  },
}));
