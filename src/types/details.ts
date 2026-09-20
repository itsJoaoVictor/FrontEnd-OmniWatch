export interface GenreItem {
  id: number;
  name: string;
}

export interface CastItem {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewItem {
  id: number;
  name: string;
  job: string;
  profile_path: string | null;
}

export interface CreditsResponse {
  cast: CastItem[];
  crew: CrewItem[];
}

export interface VideoItem {
  id: string;
  name: string;
  key: string;
  site: string;
  type: string;
}

export interface EpisodeItem {
  id: number;
  name: string;
  air_date: string | null;
  episode_number: number;
  season_number: number;
  overview?: string;
  still_path?: string | null;
  vote_average?: number;
  runtime?: number;
}

export interface SeasonItem {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
}

export interface SeasonDetailsResponse {
  id: number;
  name: string;
  overview?: string;
  season_number: number;
  poster_path: string | null;
  air_date: string | null;
  episodes: EpisodeItem[];
}

export interface EpisodeDetailsResponse {
  id: number;
  name: string;
  air_date: string | null;
  episode_number: number;
  season_number: number;
  overview: string;
  still_path: string | null;
  vote_average: number;
  runtime: number | null;
}
export interface WatchProviderItem {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface SimilarItem {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
}

export interface ProductionCompanyItem {
  id: number;
  name: string;
  logo_path: string | null;
}

export interface CollectionItem {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface CollectionPartItem {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  vote_average: number;
}

export interface CollectionResponse {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: CollectionPartItem[];
}

export interface MovieDetailsResponse {
  id: number;
  title: string;
  original_title: string;
  original_language: string;
  overview: string;
  tagline: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  status: string;
  runtime: number;
  vote_average: number;
  genres: GenreItem[];
  production_companies: ProductionCompanyItem[];
  belongs_to_collection: CollectionItem | null;
  credits: CreditsResponse;
  videos: VideoItem[];
  watch_providers: WatchProviderItem[];
  similar: SimilarItem[];
}

export interface NetworkItem {
  id: number;
  name: string;
  logo_path: string | null;
}

export interface TvSeriesDetailsResponse {
  id: number;
  title: string;
  overview: string;
  tagline: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  status: string;
  number_of_seasons: number;
  number_of_episodes: number;
  vote_average: number;
  genres: GenreItem[];
  networks: NetworkItem[];
  last_episode_to_air: EpisodeItem | null;
  next_episode_to_air: EpisodeItem | null;
  seasons: SeasonItem[];
  credits: CreditsResponse;
  videos: VideoItem[];
  watch_providers: WatchProviderItem[];
  similar: SimilarItem[];
}
