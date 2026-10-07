import axios from 'axios';
import Cookies from 'js-cookie';
import {
  AuthResponse,
  CustomList,
  ActorList,
  DashboardStats,
  MediaBalance,
  RatedMovie,
  RatedSerie,
  RatedEpisode,
  SimpleApiResponse,
  TmdbMovie,
  TmdbPage,
  TmdbPerson,
  TmdbPersonCredits,
  TmdbSeason,
  TmdbSerie,
  WatchedEpisode,
  WatchlistMovieItem,
  WatchlistSerieItem,
  WatchlistStatusResponse,
  FavoriteStatusResponse,
  FavoriteMovieItem,
  FavoriteSerieItem,
  FavoriteActorItem,
} from '../types';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('auth_token') || localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth_token', { path: '/' });
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/cadastro') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- AUTH API ---
export const authApi = {
  login: async (email: string, password: string): Promise<{ data: AuthResponse }> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return res;
  },
  register: async (name: string, email: string, password: string): Promise<{ data: AuthResponse }> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', { name, email, password });
    return res;
  },
  forgotPassword: async (email: string): Promise<{ data: SimpleApiResponse }> => {
    const res = await apiClient.post<SimpleApiResponse>('/auth/forgot-password', { email });
    return res;
  },
  resetPassword: async (payload: { token: string; newPassword: string }): Promise<{ data: SimpleApiResponse }> => {
    const res = await apiClient.post<SimpleApiResponse>('/auth/reset-password', payload);
    return res;
  },
};

// --- MOVIES API ---
export const movieApi = {
  getPopular: async (page = 1) => apiClient.get<TmdbPage<TmdbMovie>>(`/movies/popular?page=${page}`),
  getNowPlaying: async (page = 1) => apiClient.get<TmdbPage<TmdbMovie>>(`/movies/now-playing?page=${page}`),
  getTopRated: async (page = 1) => apiClient.get<TmdbPage<TmdbMovie>>(`/movies/top-rated?page=${page}`),
  getUpcoming: async (page = 1) => apiClient.get<TmdbPage<TmdbMovie>>(`/movies/upcoming?page=${page}`),
  search: async (query: string, page = 1) =>
    apiClient.get<TmdbPage<TmdbMovie>>(`/movies/search?query=${encodeURIComponent(query)}&page=${page}`),
  getDetails: async (id: number) => apiClient.get<TmdbMovie>(`/movies/${id}`),
  getRecommendations: async (id: number) => apiClient.get<TmdbPage<TmdbMovie>>(`/movies/${id}/recommendations`),
  getBatch: async (ids: (number | string)[]) => {
    if (!ids || ids.length === 0) return { data: {} as Record<string, TmdbMovie> };
    const chunkSize = 40;
    const chunks: (number | string)[][] = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
      chunks.push(ids.slice(i, i + chunkSize));
    }
    const results = await Promise.all(
      chunks.map((chunk) =>
        apiClient
          .get<Record<string, TmdbMovie>>(`/movies/batch?ids=${chunk.join(',')}`)
          .then((res) => res.data || {})
          .catch(() => ({} as Record<string, TmdbMovie>))
      )
    );
    const merged = Object.assign({}, ...results);
    return { data: merged };
  },
};
export const moviesApi = movieApi;

// --- SERIES API ---
export const serieApi = {
  getPopular: async (page = 1) => apiClient.get<TmdbPage<TmdbSerie>>(`/series/popular?page=${page}`),
  getAiringToday: async (page = 1) => apiClient.get<TmdbPage<TmdbSerie>>(`/series/airing-today?page=${page}`),
  getOnTheAir: async (page = 1) => apiClient.get<TmdbPage<TmdbSerie>>(`/series/on-the-air?page=${page}`),
  getTopRated: async (page = 1) => apiClient.get<TmdbPage<TmdbSerie>>(`/series/top-rated?page=${page}`),
  search: async (query: string, page = 1) =>
    apiClient.get<TmdbPage<TmdbSerie>>(`/series/search?query=${encodeURIComponent(query)}&page=${page}`),
  getDetails: async (id: number) => apiClient.get<TmdbSerie>(`/series/${id}`),
  getSeasonDetails: async (id: number, seasonNumber: number) =>
    apiClient.get<TmdbSeason>(`/series/${id}/season/${seasonNumber}`),
  getRecommendations: async (id: number) => apiClient.get<TmdbPage<TmdbSerie>>(`/series/${id}/recommendations`),
  getBatch: async (ids: (number | string)[]) => {
    if (!ids || ids.length === 0) return { data: {} as Record<string, TmdbSerie> };
    const chunkSize = 40;
    const chunks: (number | string)[][] = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
      chunks.push(ids.slice(i, i + chunkSize));
    }
    const results = await Promise.all(
      chunks.map((chunk) =>
        apiClient
          .get<Record<string, TmdbSerie>>(`/series/batch?ids=${chunk.join(',')}`)
          .then((res) => res.data || {})
          .catch(() => ({} as Record<string, TmdbSerie>))
      )
    );
    const merged = Object.assign({}, ...results);
    return { data: merged };
  },
};
export const seriesApi = serieApi;

// --- ACTORS API ---
export const actorApi = {
  getPopular: async (page = 1) => apiClient.get<TmdbPage<TmdbPerson>>(`/movies/person/popular?page=${page}`),
  search: async (query: string, page = 1) =>
    apiClient.get<TmdbPage<TmdbPerson>>(`/movies/person/search?query=${encodeURIComponent(query)}&page=${page}`),
  getDetails: async (id: number) => apiClient.get<TmdbPerson>(`/movies/person/${id}`),
  getCredits: async (id: number) => apiClient.get<TmdbPersonCredits>(`/movies/person/${id}/credits`),
};
export const actorsApi = actorApi;

// --- FAVORITES API ---
export const favoriteApi = {
  getUserMovies: async () => apiClient.get<FavoriteMovieItem[]>('/favorite/movie'),
  addMovie: async (movieId: number, favorite?: boolean) =>
    apiClient.post<FavoriteStatusResponse>('/favorite/movie', { movieId, favorite }),
  removeMovie: async (movieId: number) => apiClient.delete<SimpleApiResponse>(`/favorite/movie/${movieId}`),
  checkMovie: async (movieId: number) => apiClient.get<FavoriteStatusResponse>(`/favorite/movie/check/${movieId}`),

  getUserSeries: async () => apiClient.get<FavoriteSerieItem[]>('/favorite/serie'),
  addSerie: async (serieId: number, favorite?: boolean) =>
    apiClient.post<FavoriteStatusResponse>('/favorite/serie', { serieId, favorite }),
  removeSerie: async (serieId: number) => apiClient.delete<SimpleApiResponse>(`/favorite/serie/${serieId}`),
  checkSerie: async (serieId: number) => apiClient.get<FavoriteStatusResponse>(`/favorite/serie/check/${serieId}`),

  getUserActors: async () => apiClient.get<FavoriteActorItem[]>('/favorite/actor'),
  addActor: async (actorId: number) => apiClient.post<FavoriteActorItem>('/favorite/actor', { actorId }),
  removeActor: async (actorId: number) => apiClient.delete<SimpleApiResponse>(`/favorite/actor/${actorId}`),
  checkActor: async (actorId: number) => apiClient.get<FavoriteStatusResponse>(`/favorite/actor/check/${actorId}`),
};
export const favoritesApi = favoriteApi;

// --- WATCHLIST API ---
export const watchlistApi = {
  getUserMovies: async () => apiClient.get<WatchlistMovieItem[]>('/watchlist/movies'),
  getUserSeries: async () => apiClient.get<WatchlistSerieItem[]>('/watchlist/series'),
  setMovieStatus: async (movieId: number, status: string) =>
    apiClient.post<WatchlistMovieItem>('/watchlist/movie', { movieId, status }),
  removeMovie: async (movieId: number) => apiClient.delete<SimpleApiResponse>(`/watchlist/movie/${movieId}`),
  checkMovie: async (movieId: number) => apiClient.get<WatchlistStatusResponse>(`/watchlist/movie/status/${movieId}`),

  setSerieStatus: async (serieId: number, status: string) =>
    apiClient.post<WatchlistSerieItem>('/watchlist/serie', { serieId, status }),
  removeSerie: async (serieId: number) => apiClient.delete<SimpleApiResponse>(`/watchlist/serie/${serieId}`),
  checkSerie: async (serieId: number) => apiClient.get<WatchlistStatusResponse>(`/watchlist/serie/status/${serieId}`),
};

// --- WATCHED EPISODES API ---
export const watchedEpisodeApi = {
  getWatchedEpisodes: async (serieId: number) =>
    apiClient.get<WatchedEpisode[]>(`/watchlist/watched-episodes/serie/${serieId}`),
  markWatched: async (payload: { serieId: number; seasonNumber: number; episodeNumber: number }) =>
    apiClient.post<WatchedEpisode>('/watchlist/watched-episodes', payload),
  unmarkWatched: async (serieId: number, seasonNumber: number, episodeNumber: number) =>
    apiClient.delete<SimpleApiResponse>(
      `/watchlist/watched-episodes?serieId=${serieId}&seasonNumber=${seasonNumber}&episodeNumber=${episodeNumber}`
    ),
};

// --- RATINGS API ---
export const ratingApi = {
  rateMovie: async (payload: {
    movieId: number;
    rating: number;
    title?: string;
    poster_path?: string | null;
    comment?: string;
    rewatchCount?: number;
  }) => apiClient.post<RatedMovie>('/rate/movie', payload),
  getMovieRating: async (movieId: number) => apiClient.get<RatedMovie>(`/rate/movie/${movieId}`),
  getUserMovieRatings: async () => apiClient.get<RatedMovie[]>('/rate/movie/user'),
  deleteMovieRating: async (movieId: number) => apiClient.delete<SimpleApiResponse>(`/rate/movie/${movieId}`),

  rateSerie: async (payload: {
    serieId: number;
    rating: number;
    title?: string;
    poster_path?: string | null;
    comment?: string;
    rewatchCount?: number;
  }) => apiClient.post<RatedSerie>('/rate/serie', payload),
  getSerieRating: async (serieId: number) => apiClient.get<RatedSerie>(`/rate/serie/${serieId}`),
  getUserSerieRatings: async () => apiClient.get<RatedSerie[]>('/rate/serie/user'),
  deleteSerieRating: async (serieId: number) => apiClient.delete<SimpleApiResponse>(`/rate/serie/${serieId}`),

  rateEpisode: async (payload: {
    serieId: number;
    seasonNumber: number;
    episodeNumber: number;
    rating: number;
    comment?: string;
  }) => apiClient.post<RatedEpisode>('/rate/episode', payload),
  getSeasonEpisodeRatings: async (serieId: number, seasonNumber: number) =>
    apiClient.get<RatedEpisode[]>(`/rate/episode/serie/${serieId}/season/${seasonNumber}`),
};
export const ratingsApi = ratingApi;

// --- CUSTOM LISTS API ---
export const customListApi = {
  getUserLists: async () => apiClient.get<CustomList[]>('/favorite/custom-lists'),
  getList: async (id: number) => apiClient.get<CustomList>(`/favorite/custom-lists/${id}`),
  createList: async (payload: { name: string; description?: string; isPublic?: boolean }) =>
    apiClient.post<CustomList>('/favorite/custom-lists', payload),
  updateList: async (id: number, payload: { name: string; description?: string }) =>
    apiClient.put<CustomList>(`/favorite/custom-lists/${id}`, payload),
  deleteList: async (id: number) => apiClient.delete<SimpleApiResponse>(`/favorite/custom-lists/${id}`),
  addItem: async (listId: number, payload: {
    id: string | number;
    type: 'movie' | 'serie' | 'MOVIE' | 'SERIE';
    title?: string;
    posterPath?: string | null;
    backdropPath?: string | null;
    voteAverage?: number;
    releaseYear?: string;
  }) => {
    const formatted = {
      id: String(payload.id),
      type: payload.type.toLowerCase(),
      title: payload.title,
      posterPath: payload.posterPath,
      backdropPath: payload.backdropPath,
      voteAverage: payload.voteAverage,
      releaseYear: payload.releaseYear,
    };
    return apiClient.post<CustomList>(`/favorite/custom-lists/${listId}/items`, formatted);
  },
  removeItem: async (listId: number, mediaId: number | string, mediaType: 'movie' | 'serie' | 'MOVIE' | 'SERIE') =>
    apiClient.delete<SimpleApiResponse>(`/favorite/custom-lists/${listId}/items?mediaId=${encodeURIComponent(mediaId)}&mediaType=${encodeURIComponent(mediaType.toLowerCase())}`),
};
export const customListsApi = customListApi;

// --- ACTOR LISTS API ---
export const actorListApi = {
  getUserLists: async () => apiClient.get<ActorList[]>('/favorite/actor-lists'),
  getList: async (id: number) => apiClient.get<ActorList>(`/favorite/actor-lists/${id}`),
  createList: async (payload: { name: string; description?: string; isPublic?: boolean }) =>
    apiClient.post<ActorList>('/favorite/actor-lists', payload),
  updateList: async (id: number, payload: { name: string; description?: string }) =>
    apiClient.put<ActorList>(`/favorite/actor-lists/${id}`, payload),
  deleteList: async (id: number) => apiClient.delete<SimpleApiResponse>(`/favorite/actor-lists/${id}`),
  addActor: async (
    listId: number,
    actorId: number,
    details?: { name?: string; profilePath?: string | null; department?: string }
  ) =>
    apiClient.post<ActorList>(`/favorite/actor-lists/${listId}/items`, {
      actorId: String(actorId),
      name: details?.name,
      profilePath: details?.profilePath,
      department: details?.department,
    }),
  removeActor: async (listId: number, actorId: number | string) =>
    apiClient.delete<SimpleApiResponse>(`/favorite/actor-lists/${listId}/items/${actorId}`),
};
export const actorListsApi = actorListApi;

// --- DASHBOARD & STATS API ---
export const dashboardApi = {
  getStats: async () => apiClient.get<DashboardStats>('/rate/dashboard/stats'),
};

export const mediaStatsApi = {
  getBalance: async () => apiClient.get<MediaBalance>('/rate/media-balance'),
};
