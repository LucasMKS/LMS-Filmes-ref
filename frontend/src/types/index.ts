export interface User {
  id: number;
  name: string;
  email: string;
  nickname?: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  id: number;
  name: string;
  email: string;
  nickname?: string;
  role?: string;
  message?: string;
}

export interface SimpleApiResponse {
  success: boolean;
  message: string;
}

export interface TmdbPage<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface TmdbCrew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface TmdbProviderRegion {
  link?: string;
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
}

export interface TmdbMovie {
  id: number;
  title: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  runtime?: number;
  vote_average: number;
  vote_count: number;
  tagline?: string;
  genres?: TmdbGenre[];
  genre_ids?: number[];
  credits?: {
    cast: TmdbCast[];
    crew: TmdbCrew[];
  };
  videos?: {
    results: TmdbVideo[];
  };
  'watch/providers'?: {
    results: Record<string, TmdbProviderRegion>;
  };
  recommendations?: TmdbPage<TmdbMovie>;
}

export type TmdbMovieDetail = TmdbMovie;

export interface TmdbSeasonSummary {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date?: string;
  vote_average?: number;
}

export interface TmdbSerie {
  id: number;
  name: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  last_air_date?: string;
  number_of_episodes?: number;
  number_of_seasons?: number;
  vote_average: number;
  vote_count: number;
  tagline?: string;
  status?: string;
  genres?: TmdbGenre[];
  genre_ids?: number[];
  seasons?: TmdbSeasonSummary[];
  credits?: {
    cast: TmdbCast[];
    crew: TmdbCrew[];
  };
  videos?: {
    results: TmdbVideo[];
  };
  'watch/providers'?: {
    results: Record<string, TmdbProviderRegion>;
  };
  recommendations?: TmdbPage<TmdbSerie>;
}

export type TmdbSerieDetail = TmdbSerie;

export interface TmdbEpisode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  season_number: number;
  episode_number: number;
  vote_average: number;
  vote_count: number;
  air_date?: string;
  runtime?: number;
}

export interface TmdbSeason {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episodes: TmdbEpisode[];
  air_date?: string;
  vote_average: number;
}

export type SeasonDetail = TmdbSeason;

export interface TmdbPerson {
  id: number;
  name: string;
  original_name?: string;
  profile_path: string | null;
  known_for_department?: string;
  popularity?: number;
  biography?: string;
  birthday?: string;
  deathday?: string | null;
  place_of_birth?: string;
  gender?: number;
  known_for?: TmdbMovie[];
}

export type TmdbPersonDetail = TmdbPerson;

export interface TmdbCreditItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  media_type: 'movie' | 'tv';
  vote_average: number;
  vote_count: number;
  character?: string;
  overview: string;
}

export interface TmdbPersonCredits {
  id: number;
  cast: TmdbCreditItem[];
  crew: TmdbCreditItem[];
}

export type WatchlistStatus = 'PLANNING' | 'WATCHING' | 'COMPLETED' | 'DROPPED';

export interface WatchlistStatusResponse {
  isWatchlist?: boolean;
  status: string | null;
}

export interface FavoriteStatusResponse {
  isFavorite: boolean;
}

export interface RatedMovie {
  id: number;
  movieId: number;
  userId?: number;
  rating: number;
  comment?: string;
  rewatchCount?: number;
  ratedAt: string;
}

export type RatingMovieResponse = RatedMovie;

export interface RatedSerie {
  id: number;
  serieId: number;
  userId?: number;
  rating: number;
  comment?: string;
  rewatchCount?: number;
  ratedAt: string;
}

export type RatingSerieResponse = RatedSerie;

export interface RatedEpisode {
  id: number;
  serieId: number;
  seasonNumber: number;
  episodeNumber: number;
  rating: number;
  comment?: string;
  ratedAt: string;
}

export type EpisodeRatingResponse = RatedEpisode;

export interface WatchedEpisode {
  id: number;
  userId?: string | number;
  serieId: number;
  seasonNumber: number;
  episodeNumber: number;
  watchedAt?: string;
}

export interface WatchlistMovieItem {
  id: number;
  userId?: number;
  movieId: number;
  status: WatchlistStatus;
  addedAt?: string;
}

export type WatchlistMovie = WatchlistMovieItem;

export interface WatchlistSerieItem {
  id: number;
  userId?: number;
  serieId: number;
  status: WatchlistStatus;
  addedAt?: string;
}

export type WatchlistSerie = WatchlistSerieItem;

export interface FavoriteMovieItem {
  id: number;
  userId?: number;
  movieId: number;
  createdAt?: string;
}

export interface FavoriteSerieItem {
  id: number;
  userId?: number;
  serieId: number;
  createdAt?: string;
}

export interface FavoriteActorItem {
  id: number;
  userId?: number;
  actorId: number;
  createdAt?: string;
}

export interface CustomListItem {
  id: number;
  mediaId: string | number;
  mediaType?: 'movie' | 'serie' | 'MOVIE' | 'SERIE';
  type?: 'movie' | 'serie' | 'MOVIE' | 'SERIE';
  title?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  voteAverage?: number;
  releaseYear?: string;
  addedAt?: string;
}

export interface CustomList {
  id: number;
  userId?: number;
  name: string;
  description?: string;
  isPublic?: boolean;
  createdAt: string;
  updatedAt?: string;
  items: CustomListItem[];
}

export interface ActorListItem {
  id: number;
  actorId: number | string;
  name?: string;
  profilePath?: string | null;
  department?: string;
  addedAt: string;
}

export interface ActorList {
  id: number;
  userId?: number;
  name: string;
  description?: string;
  isPublic?: boolean;
  createdAt: string;
  updatedAt?: string;
  items: ActorListItem[];
}

export interface DashboardStats {
  totalMoviesRated: number;
  totalSeriesRated: number;
  totalEpisodesWatched: number;
  totalTimeWatchedMinutes: number;
  totalTimeWatchedHours: number;
  totalTimeWatchedDays: number;
  averageMovieRating: number;
  averageSerieRating: number;
  ratingDistribution?: Record<number, number>;
}

export interface MediaBalance {
  totalMovies: number;
  totalSeries: number;
  moviePercentage: number;
  seriePercentage: number;
}
