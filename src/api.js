import axios from 'axios';

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || 'YOUR_TMDB_KEY';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const tmdb = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: TMDB_API_KEY,
  },
});

export const searchTMDB = async (query, type = 'multi') => {
  if (!query) return [];
  try {
    const res = await tmdb.get(`/search/${type}`, {
      params: { query },
    });
    return res.data.results.filter(item => item.media_type !== 'person');
  } catch (error) {
    console.error('TMDB Search Error:', error);
    return [];
  }
};

export const getTMDBDetails = async (id, type) => {
  try {
    const res = await tmdb.get(`/${type}/${id}`);
    return res.data;
  } catch (error) {
    console.error('TMDB Details Error:', error);
    return null;
  }
};

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
          bannerImage
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

// Mapping AniList to TMDB (best effort via title search or external IDs)
export const mapAnimeToTMDB = async (anime) => {
  const query = anime.title.english || anime.title.romaji;
  const results = await searchTMDB(query, 'tv'); // Anime is usually TV
  return results[0] || null;
};
