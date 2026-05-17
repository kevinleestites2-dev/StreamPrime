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
export const buildVidSrcUrl = (imdbID, type, season = 1, episode = 1) => {
  if (type === 'movie') {
    return `https://vidsrc.to/embed/movie/${imdbID}`;
  }
  return `https://vidsrc.to/embed/tv/${imdbID}/${season}/${episode}`;
};

// Browse rows — curated IMDb IDs by category
// Each row fetches full OMDb details so we get posters, titles, ratings
const BROWSE_ROWS = [
  {
    label: '🔥 Trending Now',
    ids: ['tt9114286','tt1517268','tt15398776','tt1745960','tt4154796','tt6791350','tt10366206','tt3778644','tt14208870','tt1630029'],
  },
  {
    label: '🎬 Top Movies',
    ids: ['tt0111161','tt0068646','tt0071562','tt0468569','tt0050083','tt0108052','tt0167260','tt0110912','tt0120737','tt0137523'],
  },
  {
    label: '📺 Must-Watch Series',
    ids: ['tt0903747','tt0944947','tt4574334','tt0773262','tt2861424','tt0386676','tt1475582','tt0455275','tt2297757','tt0804503'],
  },
  {
    label: '⚡ Anime Vault',
    ids: ['tt0988824','tt14539740','tt2560140','tt0388629','tt7366338','tt0245429','tt0421955','tt11280740','tt0409591','tt0800179'],
  },
  {
    label: '💀 Action & Thrillers',
    ids: ['tt0133093','tt1375666','tt0816692','tt0034583','tt0110413','tt2015381','tt4154664','tt0382932','tt0120689','tt0435761'],
  },
];

// Fetch a full browse row — returns array of OMDb detail objects
export const fetchBrowseRow = async (rowIndex) => {
  const row = BROWSE_ROWS[rowIndex];
  if (!row) return { label: '', items: [] };
  const results = await Promise.all(
    row.ids.map(id => getOMDbDetails(id))
  );
  return {
    label: row.label,
    items: results.filter(Boolean),
  };
};

export const BROWSE_ROW_COUNT = BROWSE_ROWS.length;

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
