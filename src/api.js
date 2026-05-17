import axios from 'axios';

const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY || 'd361a3c1';
const OMDB_BASE_URL = 'https://www.omdbapi.com';

// Search movies/TV via OMDb — supports page param
export const searchOMDb = async (query, page = 1) => {
  if (!query) return { items: [], totalResults: 0 };
  try {
    const res = await axios.get(OMDB_BASE_URL, {
      params: { apikey: OMDB_API_KEY, s: query, page },
    });
    if (res.data.Response === 'False') return { items: [], totalResults: 0 };
    return {
      items: res.data.Search || [],
      totalResults: parseInt(res.data.totalResults) || 0,
    };
  } catch (error) {
    console.error('OMDb Search Error:', error);
    return { items: [], totalResults: 0 };
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

// ─── Browse rows — curated IMDb IDs ───────────────────────────────────────────
const BROWSE_ROWS = [
  {
    label: '🔥 Trending Now',
    ids: [
      'tt9114286','tt1517268','tt15398776','tt1745960','tt4154796',
      'tt6791350','tt10366206','tt3778644','tt14208870','tt1630029',
      'tt8502426','tt11138512','tt10872600','tt13833688','tt7286456',
    ],
  },
  {
    label: '🎬 All-Time Top Movies',
    ids: [
      'tt0111161','tt0068646','tt0071562','tt0468569','tt0050083',
      'tt0108052','tt0167260','tt0110912','tt0120737','tt0137523',
      'tt0109830','tt0167261','tt0080684','tt0133093','tt0076759',
    ],
  },
  {
    label: '📺 Must-Watch Series',
    ids: [
      'tt0903747','tt0944947','tt4574334','tt0773262','tt2861424',
      'tt0386676','tt1475582','tt0455275','tt2297757','tt0804503',
      'tt5753856','tt7366338','tt3032476','tt4549694','tt1856010',
    ],
  },
  {
    label: '⚡ Anime Vault',
    ids: [
      'tt0988824','tt14539740','tt2560140','tt0388629','tt11280740',
      'tt0245429','tt0421955','tt0409591','tt0800179','tt10090634',
      'tt0397441','tt1315982','tt0457427','tt0472585','tt0361748',
    ],
  },
  {
    label: '💀 Action & Thrillers',
    ids: [
      'tt0133093','tt1375666','tt0816692','tt0034583','tt0110413',
      'tt2015381','tt4154664','tt0382932','tt0120689','tt0435761',
      'tt1345836','tt1853728','tt0800369','tt3501632','tt4154756',
    ],
  },
  {
    label: '😂 Comedy & Feel-Good',
    ids: [
      'tt0078748','tt0107048','tt0116282','tt0093779','tt0099685',
      'tt0120815','tt0266543','tt0317219','tt0910970','tt0116629',
      'tt0102926','tt0120755','tt0116231','tt0118799','tt0113277',
    ],
  },
  {
    label: '🌌 Sci-Fi & Fantasy',
    ids: [
      'tt0816692','tt0172495','tt0118799','tt0209144','tt0114369',
      'tt0407304','tt1156398','tt1392190','tt6751668','tt0325980',
      'tt4729430','tt0454921','tt1485796','tt0369610','tt2395427',
    ],
  },
  {
    label: '👑 Marvel & DC Universe',
    ids: [
      'tt4154796','tt4154664','tt0848228','tt2395427','tt3501632',
      'tt1843866','tt1300854','tt2015381','tt3498820','tt4154756',
      'tt7286456','tt1600109','tt10872600','tt9114286','tt0468569',
    ],
  },
  {
    label: '🕵️ Crime & Mystery',
    ids: [
      'tt0110912','tt0097165','tt0405159','tt0187078','tt1375666',
      'tt0116282','tt0105236','tt0264464','tt0113277','tt0892769',
      'tt0166924','tt0120735','tt0144084','tt0364569','tt0242653',
    ],
  },
  {
    label: '😱 Horror & Suspense',
    ids: [
      'tt0081505','tt1454468','tt0089881','tt0107290','tt0114979',
      'tt0087800','tt1979320','tt2245084','tt0432348','tt1396484',
      'tt3460252','tt2798920','tt0944947','tt1399102','tt7784604',
    ],
  },
];

// Fetch a full browse row
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
