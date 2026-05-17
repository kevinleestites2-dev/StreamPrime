import axios from 'axios';

const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY || 'd361a3c1';
const OMDB_BASE_URL = 'https://www.omdbapi.com';

// Search movies/TV via OMDb
export const searchOMDb = async (query) => {
  if (!query) return [];
  try {
    const res = await axios.get(OMDB_BASE_URL, {
      params: { apikey: OMDB_API_KEY, s: query },
    });
    if (res.data.Response === 'False') return [];
    return res.data.Search || [];
  } catch (error) {
    console.error('OMDb Search Error:', error);
    return [];
  }
};

// Get full details for a single title by IMDb ID
export const getOMDbDetails = async (imdbID) => {
  try {
    const res = await axios.get(OMDB_BASE_URL, {
      params: { apikey: OMDB_API_KEY, i: imdbID, plot: 'full' },
    });
    return res.data.Response === 'True' ? res.data : null;
  } catch (error) {
    console.error('OMDb Details Error:', error);
    return null;
  }
};

// Map OMDb type to VidSrc type
export const getVidSrcType = (omdbType) => {
  if (omdbType === 'movie') return 'movie';
  if (omdbType === 'series') return 'tv';
  return 'movie';
};

// Build VidSrc embed URL
// For movies: https://vidsrc.to/embed/movie/{imdbID}
// For TV:     https://vidsrc.to/embed/tv/{imdbID}/{season}/{episode}
export const buildVidSrcUrl = (imdbID, type, season = 1, episode = 1) => {
  if (type === 'movie') {
    return `https://vidsrc.to/embed/movie/${imdbID}`;
  }
  return `https://vidsrc.to/embed/tv/${imdbID}/${season}/${episode}`;
};

// AniList search (free, no key)
export const searchAniList = async (query) => {
  const queryGraphQL = `
    query ($search: String) {
      Page(perPage: 20) {
        media(search: $search, type: ANIME) {
          id
          idMal
          title {
            romaji
            english
          }
          coverImage {
            large
          }
          description
          format
          status
          episodes
          averageScore
          genres
          seasonYear
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
  } catch (error) {
    console.error('AniList Search Error:', error);
    return [];
  }
};
