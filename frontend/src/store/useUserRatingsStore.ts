import { create } from 'zustand';
import { ratingApi } from '../services/api';
import { RatedMovie, RatedSerie } from '../types';

export interface UserRatingItem {
  rating: number;
  comment?: string;
  rewatchCount?: number;
}

interface UserRatingsState {
  movieRatings: Record<number, UserRatingItem>;
  serieRatings: Record<number, UserRatingItem>;
  isLoaded: boolean;
  isLoading: boolean;
  fetchRatings: (force?: boolean) => Promise<void>;
  setMovieRating: (movieId: number, rating: UserRatingItem) => void;
  removeMovieRating: (movieId: number) => void;
  setSerieRating: (serieId: number, rating: UserRatingItem) => void;
  removeSerieRating: (serieId: number) => void;
  clearRatings: () => void;
}

export const useUserRatingsStore = create<UserRatingsState>((set, get) => ({
  movieRatings: {},
  serieRatings: {},
  isLoaded: false,
  isLoading: false,

  fetchRatings: async (force = false) => {
    if (get().isLoading) return;
    if (get().isLoaded && !force) return;

    set({ isLoading: true });
    try {
      const [moviesRes, seriesRes] = await Promise.all([
        ratingApi.getUserMovieRatings().catch(() => ({ data: [] as RatedMovie[] })),
        ratingApi.getUserSerieRatings().catch(() => ({ data: [] as RatedSerie[] })),
      ]);

      const moviesMap: Record<number, UserRatingItem> = {};
      (moviesRes.data || []).forEach((m) => {
        if (m.movieId && m.rating != null) {
          moviesMap[m.movieId] = {
            rating: Number(m.rating),
            comment: m.comment,
            rewatchCount: m.rewatchCount,
          };
        }
      });

      const seriesMap: Record<number, UserRatingItem> = {};
      (seriesRes.data || []).forEach((s) => {
        if (s.serieId && s.rating != null) {
          seriesMap[s.serieId] = {
            rating: Number(s.rating),
            comment: s.comment,
            rewatchCount: s.rewatchCount,
          };
        }
      });

      set({
        movieRatings: moviesMap,
        serieRatings: seriesMap,
        isLoaded: true,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setMovieRating: (movieId: number, rating: UserRatingItem) =>
    set((state) => ({
      movieRatings: { ...state.movieRatings, [movieId]: rating },
    })),

  removeMovieRating: (movieId: number) =>
    set((state) => {
      const next = { ...state.movieRatings };
      delete next[movieId];
      return { movieRatings: next };
    }),

  setSerieRating: (serieId: number, rating: UserRatingItem) =>
    set((state) => ({
      serieRatings: { ...state.serieRatings, [serieId]: rating },
    })),

  removeSerieRating: (serieId: number) =>
    set((state) => {
      const next = { ...state.serieRatings };
      delete next[serieId];
      return { serieRatings: next };
    }),

  clearRatings: () =>
    set({
      movieRatings: {},
      serieRatings: {},
      isLoaded: false,
      isLoading: false,
    }),
}));
