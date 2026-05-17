import axios from 'axios';

// ─── TMDB CONFIG ────────────────────────────────────────────────────────────
const TMDB_KEY   = import.meta.env.VITE_TMDB_API_KEY  || 'dff0d6b47fb731823004892c79f61eb9';
const TMDB_TOKEN = import.meta.env.TMDB_READ_ACCESS_TOKEN || '';
const TMDB_BASE  = 'https://api.themoviedb.org/3';
const IMG_BASE   = 'https://image.tmdb.org/t/p';

// Poster sizes: w92 w154 w185 w342 w500 w780 original
// Backdrop: w300 w780 w1280 original
export const posterUrl  = (path, size = 'w342') => path ? `${IMG_BASE}/${size}${path}` : null;
export const backdropUrl = (path, size = 'w1280') => path ? `${IMG_BASE}/${size}${path}` : null;

const tmdb = axios.create({
  baseURL: TMDB_BASE,
  params:  { api_key: TMDB_KEY, language: 'en-US' },
});

// ─── TRENDING / DISCOVER ────────────────────────────────────────────────────
export const fetchTrending = async (mediaType = 'all', timeWindow = 'week') => {
  try {
    const { data } = await tmdb.get(`/trending/${mediaType}/${timeWindow}`);
    return data.results || [];
  } catch (e) {
    console.error('TMDB trending error', e);
    return [];
  }
};

export const fetchTopRated = async (mediaType = 'movie', page = 1) => {
  try {
    const { data } = await tmdb.get(`/${mediaType}/top_rated`, { params: { page } });
    return data.results || [];
  } catch (e) {
    console.error('TMDB top_rated error', e);
    return [];
  }
};

export const fetchNowPlaying = async () => {
  try {
    const { data } = await tmdb.get('/movie/now_playing');
    return data.results || [];
  } catch (e) {
    console.error('TMDB now_playing error', e);
    return [];
  }
};

export const fetchPopular = async (mediaType = 'movie', page = 1) => {
  try {
    const { data } = await tmdb.get(`/${mediaType}/popular`, { params: { page } });
    return data.results || [];
  } catch (e) {
    console.error('TMDB popular error', e);
    return [];
  }
};

export const fetchByGenre = async (mediaType = 'movie', genreId, page = 1) => {
  try {
    const { data } = await tmdb.get(`/discover/${mediaType}`, {
      params: { with_genres: genreId, sort_by: 'popularity.desc', page },
    });
    return data.results || [];
  } catch (e) {
    console.error('TMDB discover error', e);
    return [];
  }
};

// ─── SEARCH ─────────────────────────────────────────────────────────────────
export const searchTMDB = async (query, page = 1) => {
  if (!query) return { items: [], totalResults: 0, totalPages: 0 };
  try {
    const { data } = await tmdb.get('/search/multi', {
      params: { query, page, include_adult: false },
    });
    const items = (data.results || []).filter(
      r => r.media_type === 'movie' || r.media_type === 'tv'
    );
    return {
      items,
      totalResults: data.total_results || 0,
      totalPages:   data.total_pages   || 0,
    };
  } catch (e) {
    console.error('TMDB search error', e);
    return { items: [], totalResults: 0, totalPages: 0 };
  }
};

export const searchMovies = async (query, page = 1) => {
  try {
    const { data } = await tmdb.get('/search/movie', { params: { query, page } });
    return {
      items:        (data.results || []).map(r => ({ ...r, media_type: 'movie' })),
      totalResults: data.total_results || 0,
      totalPages:   data.total_pages   || 0,
    };
  } catch (e) {
    return { items: [], totalResults: 0, totalPages: 0 };
  }
};

export const searchTV = async (query, page = 1) => {
  try {
    const { data } = await tmdb.get('/search/tv', { params: { query, page } });
    return {
      items:        (data.results || []).map(r => ({ ...r, media_type: 'tv' })),
      totalResults: data.total_results || 0,
      totalPages:   data.total_pages   || 0,
    };
  } catch (e) {
    return { items: [], totalResults: 0, totalPages: 0 };
  }
};

// ─── DETAILS ────────────────────────────────────────────────────────────────
export const getMovieDetails = async (id) => {
  try {
    const { data } = await tmdb.get(`/movie/${id}`, {
      params: { append_to_response: 'credits,videos,images,external_ids,release_dates' },
    });
    return { ...data, media_type: 'movie' };
  } catch (e) {
    console.error('TMDB movie details error', e);
    return null;
  }
};

export const getTVDetails = async (id) => {
  try {
    const { data } = await tmdb.get(`/tv/${id}`, {
      params: { append_to_response: 'credits,videos,images,external_ids,content_ratings' },
    });
    return { ...data, media_type: 'tv' };
  } catch (e) {
    console.error('TMDB TV details error', e);
    return null;
  }
};

export const getTVSeason = async (id, seasonNumber) => {
  try {
    const { data } = await tmdb.get(`/tv/${id}/season/${seasonNumber}`);
    return data;
  } catch (e) {
    console.error('TMDB season error', e);
    return null;
  }
};

// ─── EXTERNAL IDs / IMDB BRIDGE ─────────────────────────────────────────────
// VidSrc works best with IMDb IDs — get them from TMDB external_ids
export const getExternalIds = async (tmdbId, mediaType) => {
  try {
    const { data } = await tmdb.get(`/${mediaType}/${tmdbId}/external_ids`);
    return data; // { imdb_id, tvdb_id, ... }
  } catch (e) {
    return {};
  }
};

// ─── TRAILERS ───────────────────────────────────────────────────────────────
export const getTrailerKey = (videos) => {
  if (!videos?.results?.length) return null;
  const trailer = videos.results.find(
    v => v.type === 'Trailer' && v.site === 'YouTube'
  ) || videos.results.find(
    v => v.site === 'YouTube'
  );
  return trailer?.key || null;
};

// ─── VIDRSC EMBED BUILDER ───────────────────────────────────────────────────
// VidSrc supports both TMDB IDs and IMDb IDs
export const buildVidSrcUrl = (id, mediaType, season = 1, episode = 1, useImdb = false) => {
  const baseId = useImdb ? id : id; // keep flexible
  if (mediaType === 'movie') {
    return `https://vidsrc.to/embed/movie/${baseId}`;
  }
  return `https://vidsrc.to/embed/tv/${baseId}/${season}/${episode}`;
};

// Also try vidsrc.me as fallback
export const buildVidSrcAlt = (id, mediaType, season = 1, episode = 1) => {
  if (mediaType === 'movie') {
    return `https://vidsrc.me/embed/movie?tmdb=${id}`;
  }
  return `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`;
};

// ─── GENRES ─────────────────────────────────────────────────────────────────
export const MOVIE_GENRES = [
  { id: 28,    name: '⚡ Action'     },
  { id: 35,    name: '😂 Comedy'     },
  { id: 18,    name: '🎭 Drama'      },
  { id: 878,   name: '🚀 Sci-Fi'     },
  { id: 27,    name: '👻 Horror'     },
  { id: 10749, name: '💘 Romance'    },
  { id: 53,    name: '🔪 Thriller'   },
  { id: 16,    name: '🎨 Animation'  },
  { id: 12,    name: '🗺️ Adventure'  },
  { id: 80,    name: '🕵️ Crime'      },
  { id: 14,    name: '🧙 Fantasy'    },
  { id: 9648,  name: '🔍 Mystery'    },
];

export const TV_GENRES = [
  { id: 10759, name: '⚡ Action & Adventure' },
  { id: 35,    name: '😂 Comedy'              },
  { id: 18,    name: '🎭 Drama'               },
  { id: 10765, name: '🚀 Sci-Fi & Fantasy'   },
  { id: 10768, name: '🌍 War & Politics'     },
  { id: 80,    name: '🕵️ Crime'               },
  { id: 9648,  name: '🔍 Mystery'             },
  { id: 10764, name: '🎤 Reality'             },
  { id: 16,    name: '🎨 Animation'           },
];

// ─── BROWSE ROW DEFINITIONS ─────────────────────────────────────────────────
// Each row is a function that returns { label, items[] }
export const BROWSE_ROWS = [
  {
    id: 'trending_all',
    label: '🔥 Trending This Week',
    fetch: () => fetchTrending('all', 'week'),
  },
  {
    id: 'now_playing',
    label: '🎬 Now Playing in Theaters',
    fetch: () => fetchNowPlaying().then(r => r.map(m => ({ ...m, media_type: 'movie' }))),
  },
  {
    id: 'trending_tv',
    label: '📺 Hot Series Right Now',
    fetch: () => fetchTrending('tv', 'week').then(r => r.map(m => ({ ...m, media_type: 'tv' }))),
  },
  {
    id: 'top_rated_movies',
    label: '⭐ All-Time Greatest Films',
    fetch: () => fetchTopRated('movie').then(r => r.map(m => ({ ...m, media_type: 'movie' }))),
  },
  {
    id: 'top_rated_tv',
    label: '🏆 Highest Rated Series',
    fetch: () => fetchTopRated('tv').then(r => r.map(m => ({ ...m, media_type: 'tv' }))),
  },
  {
    id: 'genre_action',
    label: '⚡ Action & Adrenaline',
    fetch: () => fetchByGenre('movie', 28).then(r => r.map(m => ({ ...m, media_type: 'movie' }))),
  },
  {
    id: 'genre_scifi',
    label: '🚀 Sci-Fi & Beyond',
    fetch: () => fetchByGenre('movie', 878).then(r => r.map(m => ({ ...m, media_type: 'movie' }))),
  },
  {
    id: 'genre_horror',
    label: '👻 Horror & Suspense',
    fetch: () => fetchByGenre('movie', 27).then(r => r.map(m => ({ ...m, media_type: 'movie' }))),
  },
  {
    id: 'genre_crime_tv',
    label: '🕵️ Crime & Thriller Series',
    fetch: () => fetchByGenre('tv', 80).then(r => r.map(m => ({ ...m, media_type: 'tv' }))),
  },
  {
    id: 'genre_animation',
    label: '🎨 Animation & Anime',
    fetch: () => fetchByGenre('movie', 16).then(r => r.map(m => ({ ...m, media_type: 'movie' }))),
  },
];

export const BROWSE_ROW_COUNT = BROWSE_ROWS.length;

export const fetchBrowseRow = async (rowIndex) => {
  const row = BROWSE_ROWS[rowIndex];
  if (!row) return { label: '', items: [] };
  try {
    const items = await row.fetch();
    return { label: row.label, items: items.slice(0, 20) };
  } catch (e) {
    return { label: row.label, items: [] };
  }
};

// ─── ANILIST (unchanged — free, no key needed) ───────────────────────────────
export const searchAniList = async (query) => {
  const queryGraphQL = `
    query ($search: String) {
      Page(perPage: 20) {
        media(search: $search, type: ANIME) {
          id idMal
          title { romaji english }
          coverImage { large }
          description format status episodes averageScore genres seasonYear
        }
      }
    }
  `;
  try {
    const res = await axios.post('https://graphql.anilist.co', {
      query: queryGraphQL,
      variables: { search: query },
    });
    return res.data.data.Page.media;
  } catch (e) {
    console.error('AniList error', e);
    return [];
  }
};

// ─── HERO BANNER DATA ───────────────────────────────────────────────────────
export const fetchHeroBanner = async () => {
  try {
    const items = await fetchTrending('movie', 'day');
    // Pick one with a backdrop
    const hero = items.find(m => m.backdrop_path) || items[0];
    return hero || null;
  } catch (e) {
    return null;
  }
};
