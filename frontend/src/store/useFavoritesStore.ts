import { create } from 'zustand';
import { favoriteApi } from '../services/api';

interface FavoritesState {
  favoriteMovieIds: Set<number>;
  favoriteSerieIds: Set<number>;
  isLoaded: boolean;
  isLoading: boolean;
  fetchFavorites: (force?: boolean) => Promise<void>;
  isFavorite: (id: number, type: 'movie' | 'serie') => boolean;
  toggleFavorite: (id: number, type: 'movie' | 'serie') => Promise<boolean>;
  setMovieFavorite: (id: number, isFav: boolean) => void;
  setSerieFavorite: (id: number, isFav: boolean) => void;
  clearFavorites: () => void;
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

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favoriteMovieIds: getStoredIds('lms_fav_movies'),
  favoriteSerieIds: getStoredIds('lms_fav_series'),
  isLoaded: false,
  isLoading: false,

  fetchFavorites: async (force = false) => {
    if (get().isLoading) return;
    if (get().isLoaded && !force) return;

    set({ isLoading: true });
    try {
      const [moviesRes, seriesRes] = await Promise.all([
        favoriteApi.getUserMovies().catch(() => ({ data: [] })),
        favoriteApi.getUserSeries().catch(() => ({ data: [] })),
      ]);

      const movieIds = new Set<number>();
      (moviesRes.data || []).forEach((m: any) => {
        const id = Number(m.movieId || m.id);
        if (id && (m.isFavorite == null || m.isFavorite || m.favorite == null || m.favorite)) {
          movieIds.add(id);
        }
      });

      const serieIds = new Set<number>();
      (seriesRes.data || []).forEach((s: any) => {
        const id = Number(s.serieId || s.id);
        if (id && (s.isFavorite == null || s.isFavorite || s.favorite == null || s.favorite)) {
          serieIds.add(id);
        }
      });

      saveStoredIds('lms_fav_movies', movieIds);
      saveStoredIds('lms_fav_series', serieIds);

      set({
        favoriteMovieIds: movieIds,
        favoriteSerieIds: serieIds,
        isLoaded: true,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  isFavorite: (id: number, type: 'movie' | 'serie') => {
    return type === 'movie'
      ? get().favoriteMovieIds.has(Number(id))
      : get().favoriteSerieIds.has(Number(id));
  },

  toggleFavorite: async (id: number, type: 'movie' | 'serie') => {
    const numId = Number(id);
    const currentlyFav = get().isFavorite(numId, type);
    const nextState = !currentlyFav;

    // Optimistic update
    if (type === 'movie') {
      get().setMovieFavorite(numId, nextState);
    } else {
      get().setSerieFavorite(numId, nextState);
    }

    try {
      if (type === 'movie') {
        const res = await favoriteApi.addMovie(numId, nextState);
        const actualFav = (res.data as any).isFavorite ?? (res.data as any).favorite ?? nextState;
        get().setMovieFavorite(numId, actualFav);
        return actualFav;
      } else {
        const res = await favoriteApi.addSerie(numId, nextState);
        const actualFav = (res.data as any).isFavorite ?? (res.data as any).favorite ?? nextState;
        get().setSerieFavorite(numId, actualFav);
        return actualFav;
      }
    } catch (e) {
      // Revert on error
      if (type === 'movie') {
        get().setMovieFavorite(numId, currentlyFav);
      } else {
        get().setSerieFavorite(numId, currentlyFav);
      }
      throw e;
    }
  },

  setMovieFavorite: (id: number, isFav: boolean) =>
    set((state) => {
      const next = new Set(state.favoriteMovieIds);
      if (isFav) next.add(Number(id));
      else next.delete(Number(id));
      saveStoredIds('lms_fav_movies', next);
      return { favoriteMovieIds: next };
    }),

  setSerieFavorite: (id: number, isFav: boolean) =>
    set((state) => {
      const next = new Set(state.favoriteSerieIds);
      if (isFav) next.add(Number(id));
      else next.delete(Number(id));
      saveStoredIds('lms_fav_series', next);
      return { favoriteSerieIds: next };
    }),

  clearFavorites: () => {
    try {
      localStorage.removeItem('lms_fav_movies');
      localStorage.removeItem('lms_fav_series');
    } catch {}
    set({
      favoriteMovieIds: new Set<number>(),
      favoriteSerieIds: new Set<number>(),
      isLoaded: false,
      isLoading: false,
    });
  },
}));
