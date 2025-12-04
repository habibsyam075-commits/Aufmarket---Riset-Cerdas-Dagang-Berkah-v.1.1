
export interface SearchRequest {
  mode: 'leads' | 'suppliers'; // New field for search mode
  product: string;
  location: string;
  lat?: number;
  lng?: number;
  excludeNames?: string[]; // Names to ignore in the next search
  expandRadius?: boolean; // If true, widens the search scope
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  maps?: {
    uri?: string;
    title?: string;
    placeId?: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        content?: string;
      }[];
    };
  };
}

export interface SearchResponse {
  markdownText: string;
  groundingChunks: GroundingChunk[];
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
