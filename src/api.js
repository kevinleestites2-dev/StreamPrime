import axios from 'axios';

// ─── TMDB CONFIG ────────────────────────────────────────────────────────────
const TMDB_KEY  = import.meta.env.VITE_TMDB_API_KEY || 'dff0d6b47fb731823004892c79f61eb9';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE  = 'https://image.tmdb.org/t/p';

export const posterUrl   = (path, size = 'w342')  => path ? `${IMG_BASE}/${size}${path}` : null;
export const backdropUrl = (path, size = 'w1280') => path ? `${IMG_BASE}/${size}${path}` : null;
export const profileUrl  = (path, size = 'w185')  => path ? `${IMG_BASE}/${size}${path}` : null;

const tmdb = axios.create({
  baseURL: TMDB_BASE,
  params:  { api_key: TMDB_KEY, language: 'en-US' },
});

// ─── DEDUPLICATION (within a single row only) ───────────────────────────────
// Only removes duplicates within the same row's results — NOT globally.
// Global dedup was causing later rows to show only 2-9 items because all
// popular titles were already "seen" by earlier rows.
const dedupRow = (results) => {
  const seen = new Set();
  return results.filter(r => {
    const key = `${r.media_type || 'x'}-${r.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ─── GENERIC FETCH WITH MEDIA TYPE TAG ──────────────────────────────────────
const tag = (results, media_type) =>
  (results || []).map(r => ({ ...r, media_type: r.media_type || media_type }));

// ─── TRENDING ────────────────────────────────────────────────────────────────
export const fetchTrending = async (mediaType = 'all', timeWindow = 'week', page = 1) => {
  try {
    const { data } = await tmdb.get(`/trending/${mediaType}/${timeWindow}`, { params: { page } });
    return data.results || [];
  } catch (e) { return []; }
};

// ─── MOVIES ──────────────────────────────────────────────────────────────────
export const fetchPopular = async (mediaType = 'movie', page = 1) => {
  const { data } = await tmdb.get(`/${mediaType}/popular`, { params: { page } });
  return tag(data.results, mediaType);
};
export const fetchTopRated = async (mediaType = 'movie', page = 1) => {
  const { data } = await tmdb.get(`/${mediaType}/top_rated`, { params: { page } });
  return tag(data.results, mediaType);
};
export const fetchNowPlaying = async (page = 1) => {
  const { data } = await tmdb.get('/movie/now_playing', { params: { page } });
  return tag(data.results, 'movie');
};
export const fetchUpcoming = async (page = 1) => {
  const { data } = await tmdb.get('/movie/upcoming', { params: { page } });
  return tag(data.results, 'movie');
};

// ─── TV ───────────────────────────────────────────────────────────────────────
export const fetchOnTheAir = async (page = 1) => {
  const { data } = await tmdb.get('/tv/on_the_air', { params: { page } });
  return tag(data.results, 'tv');
};
export const fetchAiringToday = async (page = 1) => {
  const { data } = await tmdb.get('/tv/airing_today', { params: { page } });
  return tag(data.results, 'tv');
};

// ─── DISCOVER ────────────────────────────────────────────────────────────────
export const discover = async (mediaType = 'movie', params = {}, page = 1) => {
  try {
    const { data } = await tmdb.get(`/discover/${mediaType}`, {
      params: { sort_by: 'popularity.desc', page, ...params },
    });
    return { results: tag(data.results, mediaType), totalPages: data.total_pages || 1 };
  } catch (e) { return { results: [], totalPages: 1 }; }
};

export const fetchByGenre = async (mediaType = 'movie', genreId, page = 1, sort = 'popularity.desc') =>
  (await discover(mediaType, { with_genres: genreId, sort_by: sort }, page)).results;

export const fetchByNetwork = async (networkId, page = 1) =>
  (await discover('tv', { with_networks: networkId }, page)).results;

export const fetchByDecade = async (mediaType = 'movie', startYear, endYear, page = 1) => {
  const params = mediaType === 'movie'
    ? { 'primary_release_date.gte': `${startYear}-01-01`, 'primary_release_date.lte': `${endYear}-12-31` }
    : { 'first_air_date.gte': `${startYear}-01-01`, 'first_air_date.lte': `${endYear}-12-31` };
  return (await discover(mediaType, params, page)).results;
};

export const fetchByKeyword = async (mediaType = 'movie', keywordId, page = 1) =>
  (await discover(mediaType, { with_keywords: keywordId }, page)).results;

export const fetchByCompany = async (mediaType = 'movie', companyId, page = 1) =>
  (await discover(mediaType, { with_companies: companyId }, page)).results;

export const fetchByLanguage = async (mediaType = 'movie', lang, page = 1) =>
  (await discover(mediaType, { with_original_language: lang }, page)).results;

export const fetchHighBudget = async (page = 1) =>
  (await discover('movie', { sort_by: 'revenue.desc' }, page)).results;

export const fetchShortFilms = async (page = 1) =>
  (await discover('movie', { 'with_runtime.lte': 40, sort_by: 'popularity.desc' }, page)).results;

export const fetchCertified = async (cert = 'PG-13', page = 1) =>
  (await discover('movie', { certification: cert, certification_country: 'US', sort_by: 'popularity.desc' }, page)).results;

export const fetchByVote = async (mediaType = 'movie', minVote = 8.0, page = 1) =>
  (await discover(mediaType, { 'vote_average.gte': minVote, 'vote_count.gte': 200 }, page)).results;

// Sort by vote_average desc (reveals hidden gems, not just popular)
export const fetchByVoteDesc = async (mediaType = 'movie', minVote = 7.5, minCount = 500, page = 1) =>
  (await discover(mediaType, { sort_by: 'vote_average.desc', 'vote_average.gte': minVote, 'vote_count.gte': minCount }, page)).results;

// Sort by revenue desc (box office kings — totally different from popularity)
export const fetchByRevenue = async (page = 1) =>
  (await discover('movie', { sort_by: 'revenue.desc', 'vote_count.gte': 100 }, page)).results;

// Best-rated within a specific year
export const fetchRecentHighRated = async (mediaType = 'movie', year, page = 1) => {
  const params = mediaType === 'movie'
    ? { primary_release_year: year, sort_by: 'vote_average.desc', 'vote_count.gte': 100 }
    : { first_air_date_year: year, sort_by: 'vote_average.desc', 'vote_count.gte': 50 };
  return (await discover(mediaType, params, page)).results;
};

// ─── SEARCH ──────────────────────────────────────────────────────────────────
export const searchTMDB = async (query, page = 1) => {
  if (!query) return { items: [], totalResults: 0, totalPages: 0 };
  try {
    const { data } = await tmdb.get('/search/multi', { params: { query, page, include_adult: false } });
    const items = (data.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv');
    return { items, totalResults: data.total_results || 0, totalPages: data.total_pages || 0 };
  } catch (e) { return { items: [], totalResults: 0, totalPages: 0 }; }
};

export const searchMovies = async (query, page = 1) => {
  const { data } = await tmdb.get('/search/movie', { params: { query, page } });
  return { items: tag(data.results, 'movie'), totalResults: data.total_results || 0, totalPages: data.total_pages || 0 };
};

export const searchTV = async (query, page = 1) => {
  const { data } = await tmdb.get('/search/tv', { params: { query, page } });
  return { items: tag(data.results, 'tv'), totalResults: data.total_results || 0, totalPages: data.total_pages || 0 };
};

export const searchPerson = async (query, page = 1) => {
  const { data } = await tmdb.get('/search/person', { params: { query, page } });
  return { items: data.results || [], totalResults: data.total_results || 0 };
};

export const searchCollection = async (query, page = 1) => {
  const { data } = await tmdb.get('/search/collection', { params: { query, page } });
  return { items: data.results || [], totalResults: data.total_results || 0 };
};

export const searchKeyword = async (query) => {
  const { data } = await tmdb.get('/search/keyword', { params: { query } });
  return data.results || [];
};

// ─── DETAILS ─────────────────────────────────────────────────────────────────
export const getMovieDetails = async (id) => {
  try {
    const { data } = await tmdb.get(`/movie/${id}`, {
      params: { append_to_response: 'credits,videos,images,external_ids,release_dates,similar,recommendations,keywords,reviews,watch/providers' },
    });
    return { ...data, media_type: 'movie' };
  } catch (e) { return null; }
};

export const getTVDetails = async (id) => {
  try {
    const { data } = await tmdb.get(`/tv/${id}`, {
      params: { append_to_response: 'credits,videos,images,external_ids,content_ratings,similar,recommendations,keywords,reviews,watch/providers' },
    });
    return { ...data, media_type: 'tv' };
  } catch (e) { return null; }
};

export const getTVSeason = async (id, seasonNumber) => {
  try {
    const { data } = await tmdb.get(`/tv/${id}/season/${seasonNumber}`);
    return data;
  } catch (e) { return null; }
};

export const getTVEpisodeDetails = async (tvId, season, episode) => {
  try {
    const { data } = await tmdb.get(`/tv/${tvId}/season/${season}/episode/${episode}`);
    return data;
  } catch (e) { return null; }
};

export const getCollection = async (id) => {
  try {
    const { data } = await tmdb.get(`/collection/${id}`);
    return data;
  } catch (e) { return null; }
};

export const getPersonDetails = async (id) => {
  try {
    const { data } = await tmdb.get(`/person/${id}`, {
      params: { append_to_response: 'movie_credits,tv_credits,images,external_ids' },
    });
    return data;
  } catch (e) { return null; }
};

export const getPersonMovies = async (id) => {
  try {
    const { data } = await tmdb.get(`/person/${id}/movie_credits`);
    return tag(data.cast || [], 'movie');
  } catch (e) { return []; }
};

export const getPersonTV = async (id) => {
  try {
    const { data } = await tmdb.get(`/person/${id}/tv_credits`);
    return tag(data.cast || [], 'tv');
  } catch (e) { return []; }
};

export const getSimilar = async (mediaType, id, page = 1) => {
  try {
    const { data } = await tmdb.get(`/${mediaType}/${id}/similar`, { params: { page } });
    return tag(data.results, mediaType);
  } catch (e) { return []; }
};

export const getRecommendations = async (mediaType, id, page = 1) => {
  try {
    const { data } = await tmdb.get(`/${mediaType}/${id}/recommendations`, { params: { page } });
    return data.results || [];
  } catch (e) { return []; }
};

export const getWatchProviders = async (mediaType, id) => {
  try {
    const { data } = await tmdb.get(`/${mediaType}/${id}/watch/providers`);
    return data.results?.US || null;
  } catch (e) { return null; }
};

export const getExternalIds = async (tmdbId, mediaType) => {
  try {
    const { data } = await tmdb.get(`/${mediaType}/${tmdbId}/external_ids`);
    return data;
  } catch (e) { return {}; }
};

export const fetchPopularPeople = async (page = 1) => {
  try {
    const { data } = await tmdb.get('/person/popular', { params: { page } });
    return data.results || [];
  } catch (e) { return []; }
};

// ─── GENRES ──────────────────────────────────────────────────────────────────
export const MOVIE_GENRES = [
  { id: 28,    name: '⚡ Action'          },
  { id: 12,    name: '🗺️ Adventure'       },
  { id: 16,    name: '🎨 Animation'       },
  { id: 35,    name: '😂 Comedy'          },
  { id: 80,    name: '🕵️ Crime'           },
  { id: 99,    name: '🎥 Documentary'     },
  { id: 18,    name: '🎭 Drama'           },
  { id: 10751, name: '👨‍👩‍👧 Family'         },
  { id: 14,    name: '🧙 Fantasy'         },
  { id: 36,    name: '📜 History'         },
  { id: 27,    name: '👻 Horror'          },
  { id: 10402, name: '🎵 Music'           },
  { id: 9648,  name: '🔍 Mystery'         },
  { id: 10749, name: '💘 Romance'         },
  { id: 878,   name: '🚀 Sci-Fi'          },
  { id: 53,    name: '🔪 Thriller'        },
  { id: 10752, name: '⚔️ War'             },
  { id: 37,    name: '🤠 Western'         },
];

export const TV_GENRES = [
  { id: 10759, name: '⚡ Action & Adventure' },
  { id: 16,    name: '🎨 Animation'           },
  { id: 35,    name: '😂 Comedy'              },
  { id: 80,    name: '🕵️ Crime'               },
  { id: 99,    name: '🎥 Documentary'         },
  { id: 18,    name: '🎭 Drama'               },
  { id: 10751, name: '👨‍👩‍👧 Family'             },
  { id: 10762, name: '🧒 Kids'                },
  { id: 9648,  name: '🔍 Mystery'             },
  { id: 10763, name: '📰 News'                },
  { id: 10764, name: '🎤 Reality'             },
  { id: 10765, name: '🚀 Sci-Fi & Fantasy'   },
  { id: 10766, name: '🧼 Soap'               },
  { id: 10767, name: '💬 Talk'               },
  { id: 10768, name: '🌍 War & Politics'     },
  { id: 37,    name: '🤠 Western'             },
];

export const TV_NETWORKS = [
  { id: 49,   name: '🎭 HBO'         },
  { id: 2552, name: '🎭 HBO Max'     },
  { id: 213,  name: '📺 Netflix'     },
  { id: 1024, name: '📦 Amazon'      },
  { id: 2739, name: '🍎 Apple TV+'   },
  { id: 453,  name: '🏰 Disney+'     },
  { id: 4330, name: '🦚 Peacock'     },
  { id: 2076, name: '👁️ Paramount+'  },
  { id: 174,  name: '🎬 AMC'         },
  { id: 16,   name: '👽 Adult Swim'  },
  { id: 56,   name: '🎪 FX'          },
  { id: 19,   name: '🌐 FOX'         },
  { id: 2,    name: '📡 ABC'         },
  { id: 1,    name: '📻 CBS'         },
  { id: 6,    name: '📺 NBC'         },
];

// ─── BROWSE ROW DEFINITIONS ───────────────────────────────────────────────────
// Each row intentionally uses a DIFFERENT sort_by so the same title
// cannot dominate multiple rows. Global dedup in fetchBrowseRow() catches anything
// that still slips through.
export const BROWSE_ROWS = [
  // ── Trending (time windows differ)
  { id: 'trending_all_week',   label: '🔥 Trending This Week',           fetch: () => fetchTrending('all',   'week') },
  { id: 'trending_all_day',    label: '⚡ Hot Right Now',                fetch: () => fetchTrending('all',   'day').then(r => r.slice(10)) },
  { id: 'trending_movies',     label: '🎬 Trending Movies',              fetch: () => fetchTrending('movie', 'week').then(r => r.slice(5)) },
  { id: 'trending_tv',         label: '📺 Trending Series',              fetch: () => fetchTrending('tv',    'week') },

  // ── In theaters / on air (always fresh, no overlap with ranking lists)
  { id: 'now_playing',         label: '🎬 In Theaters Now',              fetch: () => fetchNowPlaying()    },
  { id: 'upcoming',            label: '🗓️ Coming Soon',                   fetch: () => fetchUpcoming()      },
  { id: 'airing_today',        label: '📅 Airing Today',                 fetch: () => fetchAiringToday()   },
  { id: 'on_the_air',          label: '🔴 On Air This Week',             fetch: () => fetchOnTheAir()      },

  // ── All-time rankings (sorted by vote_average — different titles than popularity)
  { id: 'top_rated_movies',    label: '⭐ All-Time Greatest Films',       fetch: () => fetchByVoteDesc('movie', 8.0, 1000) },
  { id: 'top_rated_tv',        label: '🏆 Highest Rated Series Ever',    fetch: () => fetchByVoteDesc('tv',   8.0, 500)   },
  { id: 'highest_rated_85',    label: '💯 Perfect Score Club (8.5+)',    fetch: () => fetchByVote('movie', 8.5)           },
  { id: 'best_tv_85',          label: '🎖️ TV Hall of Fame (8.5+)',       fetch: () => fetchByVote('tv', 8.5)             },

  // ── Box office (sorted by revenue — completely different from popularity)
  { id: 'high_revenue',        label: '💰 Highest Grossing All Time',    fetch: () => fetchByRevenue()    },
  { id: 'high_revenue_p2',     label: '💵 Box Office Legends',           fetch: () => fetchByRevenue(2)   },

  // ── Popular (page 2 to avoid the top-10 already in trending)
  { id: 'popular_movies',      label: '🌟 Popular Movies',               fetch: () => fetchPopular('movie', 2) },
  { id: 'popular_tv',          label: '📡 Popular Series',               fetch: () => fetchPopular('tv',   2)  },

  // ── Best of each year (sorted by vote_average within year — hidden gems surface)
  { id: 'best_2024_movies',    label: '🏅 Best of 2024',                 fetch: () => fetchRecentHighRated('movie', 2024) },
  { id: 'best_2023_movies',    label: '🏅 Best of 2023',                 fetch: () => fetchRecentHighRated('movie', 2023) },
  { id: 'best_2022_movies',    label: '🏅 Best of 2022',                 fetch: () => fetchRecentHighRated('movie', 2022) },
  { id: 'best_2024_tv',        label: '📺 Best TV of 2024',              fetch: () => fetchRecentHighRated('tv', 2024)    },
  { id: 'best_2023_tv',        label: '📺 Best TV of 2023',              fetch: () => fetchRecentHighRated('tv', 2023)    },

  // ── Movie Genres (each uses a different sort to prevent same title in two rows)
  { id: 'g_action',            label: '⚡ Action & Adrenaline',          fetch: () => fetchByGenre('movie', 28,    1, 'vote_average.desc') },
  { id: 'g_adventure',         label: '🗺️ Epic Adventures',              fetch: () => fetchByGenre('movie', 12,    1, 'revenue.desc')      },
  { id: 'g_animation',         label: '🎨 Animation',                    fetch: () => fetchByGenre('movie', 16,    1, 'vote_average.desc') },
  { id: 'g_comedy',            label: '😂 Comedy Films',                 fetch: () => fetchByGenre('movie', 35,    1, 'popularity.desc')   },
  { id: 'g_crime',             label: '🕵️ Crime Films',                  fetch: () => fetchByGenre('movie', 80,    1, 'vote_average.desc') },
  { id: 'g_documentary',       label: '🎥 Documentaries',                fetch: () => fetchByGenre('movie', 99,    1, 'popularity.desc')   },
  { id: 'g_drama',             label: '🎭 Drama Films',                  fetch: () => fetchByGenre('movie', 18,    1, 'vote_average.desc') },
  { id: 'g_family',            label: '👨‍👩‍👧 Family Movies',               fetch: () => fetchByGenre('movie', 10751, 1, 'revenue.desc')     },
  { id: 'g_fantasy',           label: '🧙 Fantasy Films',                fetch: () => fetchByGenre('movie', 14,    1, 'revenue.desc')      },
  { id: 'g_history',           label: '📜 Historical Epics',             fetch: () => fetchByGenre('movie', 36,    1, 'vote_average.desc') },
  { id: 'g_horror',            label: '👻 Horror & Terror',              fetch: () => fetchByGenre('movie', 27,    1, 'popularity.desc')   },
  { id: 'g_music',             label: '🎵 Music Films',                  fetch: () => fetchByGenre('movie', 10402, 1, 'vote_average.desc') },
  { id: 'g_mystery',           label: '🔍 Mystery Films',                fetch: () => fetchByGenre('movie', 9648,  1, 'vote_average.desc') },
  { id: 'g_romance',           label: '💘 Romance Films',                fetch: () => fetchByGenre('movie', 10749, 1, 'popularity.desc')   },
  { id: 'g_scifi',             label: '🚀 Sci-Fi Films',                 fetch: () => fetchByGenre('movie', 878,   1, 'revenue.desc')      },
  { id: 'g_thriller',          label: '🔪 Thrillers',                    fetch: () => fetchByGenre('movie', 53,    1, 'vote_average.desc') },
  { id: 'g_war',               label: '⚔️ War Films',                    fetch: () => fetchByGenre('movie', 10752, 1, 'vote_average.desc') },
  { id: 'g_western',           label: '🤠 Westerns',                     fetch: () => fetchByGenre('movie', 37,    1, 'vote_average.desc') },

  // ── TV Genres
  { id: 'tv_action',           label: '⚡ Action & Adventure Series',    fetch: () => fetchByGenre('tv', 10759, 1, 'vote_average.desc') },
  { id: 'tv_animation',        label: '🎨 Animated Series',              fetch: () => fetchByGenre('tv', 16,    1, 'popularity.desc')   },
  { id: 'tv_comedy',           label: '😂 Comedy Series',                fetch: () => fetchByGenre('tv', 35,    1, 'vote_average.desc') },
  { id: 'tv_crime',            label: '🕵️ Crime Series',                 fetch: () => fetchByGenre('tv', 80,    1, 'vote_average.desc') },
  { id: 'tv_documentary',      label: '🎥 Documentary Series',           fetch: () => fetchByGenre('tv', 99,    1, 'popularity.desc')   },
  { id: 'tv_drama',            label: '🎭 Drama Series',                 fetch: () => fetchByGenre('tv', 18,    1, 'vote_average.desc') },
  { id: 'tv_family',           label: '👨‍👩‍👧 Family Series',               fetch: () => fetchByGenre('tv', 10751, 1, 'popularity.desc')  },
  { id: 'tv_kids',             label: '🧒 Kids Shows',                   fetch: () => fetchByGenre('tv', 10762, 1, 'popularity.desc')  },
  { id: 'tv_mystery',          label: '🔍 Mystery Series',               fetch: () => fetchByGenre('tv', 9648,  1, 'vote_average.desc') },
  { id: 'tv_reality',          label: '🎤 Reality TV',                   fetch: () => fetchByGenre('tv', 10764, 1, 'popularity.desc')  },
  { id: 'tv_scifi',            label: '🚀 Sci-Fi & Fantasy Series',      fetch: () => fetchByGenre('tv', 10765, 1, 'vote_average.desc') },
  { id: 'tv_war',              label: '🌍 War & Politics Series',        fetch: () => fetchByGenre('tv', 10768, 1, 'vote_average.desc') },
  { id: 'tv_western',          label: '🤠 Western Series',               fetch: () => fetchByGenre('tv', 37,    1, 'vote_average.desc') },

  // ── Networks
  { id: 'net_netflix',         label: '📺 Netflix',                      fetch: () => fetchByNetwork(213)  },
  { id: 'net_hbo',             label: '🎭 HBO',                          fetch: () => fetchByNetwork(49)   },
  { id: 'net_amazon',          label: '📦 Amazon Prime',                 fetch: () => fetchByNetwork(1024) },
  { id: 'net_apple',           label: '🍎 Apple TV+',                    fetch: () => fetchByNetwork(2739) },
  { id: 'net_amc',             label: '🎬 AMC',                          fetch: () => fetchByNetwork(174)  },
  { id: 'net_fx',              label: '🎪 FX',                           fetch: () => fetchByNetwork(56)   },
  { id: 'net_adultsw',         label: '👽 Adult Swim',                   fetch: () => fetchByNetwork(16)   },

  // ── By Decade
  { id: 'decade_2020s_m',      label: '📅 2020s Movies',                fetch: () => fetchByDecade('movie', 2020, 2029),   fetchPage2: () => fetchByDecade('movie', 2020, 2029, 2) },
  { id: 'decade_2010s_m',      label: '📅 2010s Movies',                fetch: () => fetchByDecade('movie', 2010, 2019),   fetchPage2: () => fetchByDecade('movie', 2010, 2019, 2) },
  { id: 'decade_2000s_m',      label: '📅 2000s Movies',                fetch: () => fetchByDecade('movie', 2000, 2009),   fetchPage2: () => fetchByDecade('movie', 2000, 2009, 2) },
  { id: 'decade_90s_m',        label: '📅 90s Movies',                  fetch: () => fetchByDecade('movie', 1990, 1999),   fetchPage2: () => fetchByDecade('movie', 1990, 1999, 2) },
  { id: 'decade_80s_m',        label: '📅 80s Movies',                  fetch: () => fetchByDecade('movie', 1980, 1989),   fetchPage2: () => fetchByDecade('movie', 1980, 1989, 2) },
  { id: 'decade_70s_m',        label: '📅 70s Movies',                  fetch: () => fetchByDecade('movie', 1970, 1979),   fetchPage2: () => fetchByDecade('movie', 1970, 1979, 2) },
  { id: 'decade_classic_m',    label: '🎞️ Classic Era (pre-1970)',      fetch: () => fetchByDecade('movie', 1900, 1969),   fetchPage2: () => fetchByDecade('movie', 1900, 1969, 2) },
  { id: 'decade_2020s_tv',     label: '📅 2020s Series',                fetch: () => fetchByDecade('tv', 2020, 2029),      fetchPage2: () => fetchByDecade('tv', 2020, 2029, 2)    },
  { id: 'decade_2010s_tv',     label: '📅 2010s Series',                fetch: () => fetchByDecade('tv', 2010, 2019),      fetchPage2: () => fetchByDecade('tv', 2010, 2019, 2)    },
  { id: 'decade_2000s_tv',     label: '📅 2000s Series',                fetch: () => fetchByDecade('tv', 2000, 2009),      fetchPage2: () => fetchByDecade('tv', 2000, 2009, 2)    },
  { id: 'decade_90s_tv',       label: '📅 90s Series',                  fetch: () => fetchByDecade('tv', 1990, 1999),      fetchPage2: () => fetchByDecade('tv', 1990, 1999, 2)    },

  // ── By Language / Region
  { id: 'lang_japanese',       label: '🇯🇵 Japanese Cinema',             fetch: () => fetchByLanguage('movie', 'ja'), fetchPage2: () => fetchByLanguage('movie', 'ja', 2) },
  { id: 'lang_korean',         label: '🇰🇷 Korean Cinema',               fetch: () => fetchByLanguage('movie', 'ko'), fetchPage2: () => fetchByLanguage('movie', 'ko', 2) },
  { id: 'lang_kdramas',        label: '🇰🇷 K-Dramas',                    fetch: () => fetchByLanguage('tv',    'ko'), fetchPage2: () => fetchByLanguage('tv',    'ko', 2) },
  { id: 'lang_anime_jp',       label: '🇯🇵 Anime Series',                fetch: () => fetchByLanguage('tv',    'ja'), fetchPage2: () => fetchByLanguage('tv',    'ja', 2) },
  { id: 'lang_spanish',        label: '🇪🇸 Spanish Language Films',      fetch: () => fetchByLanguage('movie', 'es'), fetchPage2: () => fetchByLanguage('movie', 'es', 2) },
  { id: 'lang_french',         label: '🇫🇷 French Cinema',               fetch: () => fetchByLanguage('movie', 'fr'), fetchPage2: () => fetchByLanguage('movie', 'fr', 2) },
  { id: 'lang_hindi',          label: '🇮🇳 Bollywood',                   fetch: () => fetchByLanguage('movie', 'hi'), fetchPage2: () => fetchByLanguage('movie', 'hi', 2) },
  { id: 'lang_italian',        label: '🇮🇹 Italian Cinema',              fetch: () => fetchByLanguage('movie', 'it'), fetchPage2: () => fetchByLanguage('movie', 'it', 2) },
  { id: 'lang_german',         label: '🇩🇪 German Films',                fetch: () => fetchByLanguage('movie', 'de'), fetchPage2: () => fetchByLanguage('movie', 'de', 2) },
  { id: 'lang_portuguese',     label: '🇧🇷 Portuguese Language',         fetch: () => fetchByLanguage('movie', 'pt'), fetchPage2: () => fetchByLanguage('movie', 'pt', 2) },
  { id: 'lang_chinese',        label: '🇨🇳 Chinese Cinema',              fetch: () => fetchByLanguage('movie', 'zh'), fetchPage2: () => fetchByLanguage('movie', 'zh', 2) },
  { id: 'lang_russian',        label: '🇷🇺 Russian Films',               fetch: () => fetchByLanguage('movie', 'ru'), fetchPage2: () => fetchByLanguage('movie', 'ru', 2) },

  // ── Special
  { id: 'cert_r',              label: '🔞 R-Rated',                      fetch: () => fetchCertified('R'),      fetchPage2: () => fetchCertified('R', 2)      },
  { id: 'cert_pg13',           label: '📺 PG-13',                        fetch: () => fetchCertified('PG-13'),  fetchPage2: () => fetchCertified('PG-13', 2)  },
  { id: 'cert_g',              label: '👶 G-Rated (All Ages)',            fetch: () => fetchCertified('G'),      fetchPage2: () => fetchCertified('G', 2)      },
  { id: 'short_films',         label: '⏱️ Short Films',                  fetch: () => fetchShortFilms(),        fetchPage2: () => fetchShortFilms(2)          },

  // ── Keywords / Themes
  { id: 'kw_superhero',        label: '🦸 Superhero Films',              fetch: () => fetchByKeyword('movie', 9715),  fetchPage2: () => fetchByKeyword('movie', 9715,  2) },
  { id: 'kw_zombie',           label: '🧟 Zombie Films',                 fetch: () => fetchByKeyword('movie', 12377), fetchPage2: () => fetchByKeyword('movie', 12377, 2) },
  { id: 'kw_heist',            label: '💼 Heist Films',                  fetch: () => fetchByKeyword('movie', 10944), fetchPage2: () => fetchByKeyword('movie', 10944, 2) },
  { id: 'kw_survival',         label: '🏕️ Survival Films',               fetch: () => fetchByKeyword('movie', 4565),  fetchPage2: () => fetchByKeyword('movie', 4565,  2) },
  { id: 'kw_based_true',       label: '📖 Based on True Events',         fetch: () => fetchByKeyword('movie', 10683), fetchPage2: () => fetchByKeyword('movie', 10683, 2) },
  { id: 'kw_space',            label: '🌌 Space Exploration',            fetch: () => fetchByKeyword('movie', 1326),  fetchPage2: () => fetchByKeyword('movie', 1326,  2) },
  { id: 'kw_mafia',            label: '🤌 Mafia & Gangsters',            fetch: () => fetchByKeyword('movie', 6270),  fetchPage2: () => fetchByKeyword('movie', 6270,  2) },
  { id: 'kw_time_travel',      label: '⏰ Time Travel',                  fetch: () => fetchByKeyword('movie', 4379),  fetchPage2: () => fetchByKeyword('movie', 4379,  2) },
  { id: 'kw_serial_killer',    label: '🔪 Serial Killers',               fetch: () => fetchByKeyword('tv',    1539),  fetchPage2: () => fetchByKeyword('tv',    1539,  2) },

  // ── Studios
  { id: 'studio_marvel',       label: '🕷️ Marvel Studios',               fetch: () => fetchByCompany('movie', 420),   fetchPage2: () => fetchByCompany('movie', 420,   2) },
  { id: 'studio_dc',           label: '🦇 DC Films',                     fetch: () => fetchByCompany('movie', 9993),  fetchPage2: () => fetchByCompany('movie', 9993,  2) },
  { id: 'studio_pixar',        label: '🎈 Pixar',                        fetch: () => fetchByCompany('movie', 3),     fetchPage2: () => fetchByCompany('movie', 3,     2) },
  { id: 'studio_disney',       label: '🏰 Walt Disney Pictures',         fetch: () => fetchByCompany('movie', 2),     fetchPage2: () => fetchByCompany('movie', 2,     2) },
  { id: 'studio_wb',           label: '🎬 Warner Bros',                  fetch: () => fetchByCompany('movie', 174),   fetchPage2: () => fetchByCompany('movie', 174,   2) },
  { id: 'studio_universal',    label: '🌍 Universal Pictures',           fetch: () => fetchByCompany('movie', 33),    fetchPage2: () => fetchByCompany('movie', 33,    2) },
  { id: 'studio_sony',         label: '🎥 Sony Pictures',                fetch: () => fetchByCompany('movie', 5),     fetchPage2: () => fetchByCompany('movie', 5,     2) },
  { id: 'studio_a24',          label: '🎭 A24',                          fetch: () => fetchByCompany('movie', 41077), fetchPage2: () => fetchByCompany('movie', 41077, 2) },
  { id: 'studio_paramount',    label: '⛰️ Paramount',                    fetch: () => fetchByCompany('movie', 4),     fetchPage2: () => fetchByCompany('movie', 4,     2) },
  { id: 'studio_dreamworks',   label: '🌊 DreamWorks',                   fetch: () => fetchByCompany('movie', 521),   fetchPage2: () => fetchByCompany('movie', 521,   2) },
  { id: 'studio_blumhouse',    label: '😱 Blumhouse Horror',             fetch: () => fetchByCompany('movie', 3172),  fetchPage2: () => fetchByCompany('movie', 3172,  2) },
];

export const BROWSE_ROW_COUNT = BROWSE_ROWS.length;

export const fetchBrowseRow = async (rowIndex) => {
  const row = BROWSE_ROWS[rowIndex];
  if (!row) return { label: '', items: [] };
  try {
    // Fetch p1 always; if we still need more, fetch p2 as well
    let raw = await row.fetch();
    raw = dedupRow(raw || []);
    if (raw.length < 20 && row.fetchPage2) {
      const extra = await row.fetchPage2();
      raw = dedupRow([...raw, ...(extra || [])]);
    }
    return { label: row.label, items: raw.slice(0, 20) };
  } catch (e) {
    return { label: row.label, items: [] };
  }
};

// ─── ANILIST ──────────────────────────────────────────────────────────────────
export const searchAniList = async (query) => {
  const gql = `query($s:String){Page(perPage:20){media(search:$s,type:ANIME){id idMal title{romaji english}coverImage{large}description format status episodes averageScore genres seasonYear}}}`;
  try {
    const res = await axios.post('https://graphql.anilist.co', { query: gql, variables: { search: query } });
    return res.data.data.Page.media;
  } catch (e) { return []; }
};

// ─── HERO BANNER ─────────────────────────────────────────────────────────────
export const fetchHeroBanner = async () => {
  try {
    const items = await fetchTrending('movie', 'day');
    return items.find(m => m.backdrop_path) || items[0] || null;
  } catch (e) { return null; }
};

// ─── UTILITY ─────────────────────────────────────────────────────────────────
// Primary: vidsrc.me (clean, TMDB ID native, no redirect popups)
export const buildVidSrcUrl = (id, mediaType, season = 1, episode = 1) => {
  if (mediaType === 'movie') return `https://vidsrc.me/embed/movie?tmdb=${id}`;
  return `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`;
};

// Fallback: superembed (reliable, low ads)
export const buildVidSrcAlt = (id, mediaType, season = 1, episode = 1) => {
  if (mediaType === 'movie') return `https://embed.smashystream.com/playere.php?tmdb=${id}`;
  return `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${season}&episode=${episode}`;
};

export const getTrailerKey = (videos) => {
  if (!videos?.results?.length) return null;
  return (videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')
    || videos.results.find(v => v.site === 'YouTube'))?.key || null;
};
