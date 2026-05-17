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
export const fetchPopular      = async (mediaType = 'movie', page = 1) => {
  const { data } = await tmdb.get(`/${mediaType}/popular`, { params: { page } });
  return tag(data.results, mediaType);
};
export const fetchTopRated     = async (mediaType = 'movie', page = 1) => {
  const { data } = await tmdb.get(`/${mediaType}/top_rated`, { params: { page } });
  return tag(data.results, mediaType);
};
export const fetchNowPlaying   = async (page = 1) => {
  const { data } = await tmdb.get('/movie/now_playing', { params: { page } });
  return tag(data.results, 'movie');
};
export const fetchUpcoming     = async (page = 1) => {
  const { data } = await tmdb.get('/movie/upcoming', { params: { page } });
  return tag(data.results, 'movie');
};

// ─── TV ───────────────────────────────────────────────────────────────────────
export const fetchOnTheAir     = async (page = 1) => {
  const { data } = await tmdb.get('/tv/on_the_air', { params: { page } });
  return tag(data.results, 'tv');
};
export const fetchAiringToday  = async (page = 1) => {
  const { data } = await tmdb.get('/tv/airing_today', { params: { page } });
  return tag(data.results, 'tv');
};

// ─── DISCOVER (the power endpoint — filters everything) ───────────────────────
export const discover = async (mediaType = 'movie', params = {}, page = 1) => {
  try {
    const { data } = await tmdb.get(`/discover/${mediaType}`, {
      params: { sort_by: 'popularity.desc', page, ...params },
    });
    return { results: tag(data.results, mediaType), totalPages: data.total_pages || 1 };
  } catch (e) { return { results: [], totalPages: 1 }; }
};

export const fetchByGenre = async (mediaType = 'movie', genreId, page = 1) =>
  (await discover(mediaType, { with_genres: genreId }, page)).results;

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

// ─── EXTERNAL IDs ────────────────────────────────────────────────────────────
export const getExternalIds = async (tmdbId, mediaType) => {
  try {
    const { data } = await tmdb.get(`/${mediaType}/${tmdbId}/external_ids`);
    return data;
  } catch (e) { return {}; }
};

// ─── PEOPLE ──────────────────────────────────────────────────────────────────
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

// ─── NETWORKS (TV) ────────────────────────────────────────────────────────────
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
export const BROWSE_ROWS = [
  // ── Trending
  { id: 'trending_all_week',   label: '🔥 Trending This Week',          fetch: () => fetchTrending('all',   'week') },
  { id: 'trending_all_day',    label: '⚡ Trending Today',               fetch: () => fetchTrending('all',   'day')  },
  { id: 'trending_movies',     label: '🎬 Trending Movies',              fetch: () => fetchTrending('movie', 'week') },
  { id: 'trending_tv',         label: '📺 Trending Series',             fetch: () => fetchTrending('tv',    'week') },

  // ── Movies
  { id: 'popular_movies',      label: '🌟 Most Popular Movies',         fetch: () => fetchPopular('movie')    },
  { id: 'top_rated_movies',    label: '⭐ All-Time Greatest Films',      fetch: () => fetchTopRated('movie')   },
  { id: 'now_playing',         label: '🎬 Now Playing in Theaters',     fetch: () => fetchNowPlaying()         },
  { id: 'upcoming',            label: '🗓️ Coming Soon',                  fetch: () => fetchUpcoming()           },
  { id: 'high_revenue',        label: '💰 Highest Grossing Films',      fetch: () => fetchHighBudget()         },
  { id: 'highest_rated',       label: '💯 Critically Acclaimed (8.0+)', fetch: () => fetchByVote('movie', 8.0) },

  // ── TV
  { id: 'popular_tv',          label: '📡 Most Popular Series',         fetch: () => fetchPopular('tv')        },
  { id: 'top_rated_tv',        label: '🏆 Highest Rated Series',        fetch: () => fetchTopRated('tv')       },
  { id: 'on_the_air',          label: '🔴 On Air Right Now',            fetch: () => fetchOnTheAir()           },
  { id: 'airing_today',        label: '📅 Airing Today',                fetch: () => fetchAiringToday()        },
  { id: 'best_tv',             label: '🎖️ TV Hall of Fame (8.5+)',      fetch: () => fetchByVote('tv', 8.5)   },

  // ── Movie Genres
  { id: 'g_action',            label: '⚡ Action & Adrenaline',         fetch: () => fetchByGenre('movie', 28)    },
  { id: 'g_adventure',         label: '🗺️ Epic Adventures',             fetch: () => fetchByGenre('movie', 12)    },
  { id: 'g_animation',         label: '🎨 Animation',                   fetch: () => fetchByGenre('movie', 16)    },
  { id: 'g_comedy',            label: '😂 Comedy Films',                fetch: () => fetchByGenre('movie', 35)    },
  { id: 'g_crime',             label: '🕵️ Crime Films',                 fetch: () => fetchByGenre('movie', 80)    },
  { id: 'g_documentary',       label: '🎥 Documentaries',               fetch: () => fetchByGenre('movie', 99)    },
  { id: 'g_drama',             label: '🎭 Drama Films',                 fetch: () => fetchByGenre('movie', 18)    },
  { id: 'g_family',            label: '👨‍👩‍👧 Family Movies',              fetch: () => fetchByGenre('movie', 10751) },
  { id: 'g_fantasy',           label: '🧙 Fantasy Films',               fetch: () => fetchByGenre('movie', 14)    },
  { id: 'g_history',           label: '📜 Historical Epics',            fetch: () => fetchByGenre('movie', 36)    },
  { id: 'g_horror',            label: '👻 Horror & Terror',             fetch: () => fetchByGenre('movie', 27)    },
  { id: 'g_music',             label: '🎵 Music Films',                 fetch: () => fetchByGenre('movie', 10402) },
  { id: 'g_mystery',           label: '🔍 Mystery Films',               fetch: () => fetchByGenre('movie', 9648)  },
  { id: 'g_romance',           label: '💘 Romance Films',               fetch: () => fetchByGenre('movie', 10749) },
  { id: 'g_scifi',             label: '🚀 Sci-Fi Films',                fetch: () => fetchByGenre('movie', 878)   },
  { id: 'g_thriller',          label: '🔪 Thrillers',                   fetch: () => fetchByGenre('movie', 53)    },
  { id: 'g_war',               label: '⚔️ War Films',                   fetch: () => fetchByGenre('movie', 10752) },
  { id: 'g_western',           label: '🤠 Westerns',                    fetch: () => fetchByGenre('movie', 37)    },

  // ── TV Genres
  { id: 'tv_action',           label: '⚡ Action & Adventure Series',   fetch: () => fetchByGenre('tv', 10759) },
  { id: 'tv_animation',        label: '🎨 Animated Series',             fetch: () => fetchByGenre('tv', 16)    },
  { id: 'tv_comedy',           label: '😂 Comedy Series',               fetch: () => fetchByGenre('tv', 35)    },
  { id: 'tv_crime',            label: '🕵️ Crime Series',                fetch: () => fetchByGenre('tv', 80)    },
  { id: 'tv_documentary',      label: '🎥 Documentary Series',          fetch: () => fetchByGenre('tv', 99)    },
  { id: 'tv_drama',            label: '🎭 Drama Series',                fetch: () => fetchByGenre('tv', 18)    },
  { id: 'tv_family',           label: '👨‍👩‍👧 Family Series',              fetch: () => fetchByGenre('tv', 10751) },
  { id: 'tv_kids',             label: '🧒 Kids Shows',                  fetch: () => fetchByGenre('tv', 10762) },
  { id: 'tv_mystery',          label: '🔍 Mystery Series',              fetch: () => fetchByGenre('tv', 9648)  },
  { id: 'tv_reality',          label: '🎤 Reality TV',                  fetch: () => fetchByGenre('tv', 10764) },
  { id: 'tv_scifi',            label: '🚀 Sci-Fi & Fantasy Series',     fetch: () => fetchByGenre('tv', 10765) },
  { id: 'tv_war',              label: '🌍 War & Politics Series',       fetch: () => fetchByGenre('tv', 10768) },
  { id: 'tv_western',          label: '🤠 Western Series',              fetch: () => fetchByGenre('tv', 37)    },

  // ── Networks
  { id: 'net_netflix',         label: '📺 Netflix Originals',           fetch: () => fetchByNetwork(213)   },
  { id: 'net_hbo',             label: '🎭 HBO',                         fetch: () => fetchByNetwork(49)    },
  { id: 'net_amazon',          label: '📦 Amazon Prime Video',          fetch: () => fetchByNetwork(1024)  },
  { id: 'net_apple',           label: '🍎 Apple TV+',                   fetch: () => fetchByNetwork(2739)  },
  { id: 'net_disney',          label: '🏰 Disney+',                     fetch: () => fetchByNetwork(2739)  },
  { id: 'net_amc',             label: '🎬 AMC',                         fetch: () => fetchByNetwork(174)   },
  { id: 'net_fx',              label: '🎪 FX',                          fetch: () => fetchByNetwork(56)    },
  { id: 'net_adultsw',         label: '👽 Adult Swim',                  fetch: () => fetchByNetwork(16)    },

  // ── By Decade
  { id: 'decade_2020s_m',      label: '📅 2020s Movies',               fetch: () => fetchByDecade('movie', 2020, 2029) },
  { id: 'decade_2010s_m',      label: '📅 2010s Movies',               fetch: () => fetchByDecade('movie', 2010, 2019) },
  { id: 'decade_2000s_m',      label: '📅 2000s Movies',               fetch: () => fetchByDecade('movie', 2000, 2009) },
  { id: 'decade_90s_m',        label: '📅 90s Movies',                 fetch: () => fetchByDecade('movie', 1990, 1999) },
  { id: 'decade_80s_m',        label: '📅 80s Movies',                 fetch: () => fetchByDecade('movie', 1980, 1989) },
  { id: 'decade_70s_m',        label: '📅 70s Movies',                 fetch: () => fetchByDecade('movie', 1970, 1979) },
  { id: 'decade_classic_m',    label: '🎞️ Classic Era (pre-1970)',     fetch: () => fetchByDecade('movie', 1900, 1969) },
  { id: 'decade_2020s_tv',     label: '📅 2020s Series',               fetch: () => fetchByDecade('tv', 2020, 2029) },
  { id: 'decade_2010s_tv',     label: '📅 2010s Series',               fetch: () => fetchByDecade('tv', 2010, 2019) },
  { id: 'decade_2000s_tv',     label: '📅 2000s Series',               fetch: () => fetchByDecade('tv', 2000, 2009) },
  { id: 'decade_90s_tv',       label: '📅 90s Series',                 fetch: () => fetchByDecade('tv', 1990, 1999) },

  // ── By Language / Region
  { id: 'lang_japanese',       label: '🇯🇵 Japanese Cinema',            fetch: () => fetchByLanguage('movie', 'ja') },
  { id: 'lang_korean',         label: '🇰🇷 Korean Cinema & K-Dramas',  fetch: () => fetchByLanguage('movie', 'ko') },
  { id: 'lang_spanish',        label: '🇪🇸 Spanish Language Films',     fetch: () => fetchByLanguage('movie', 'es') },
  { id: 'lang_french',         label: '🇫🇷 French Cinema',              fetch: () => fetchByLanguage('movie', 'fr') },
  { id: 'lang_hindi',          label: '🇮🇳 Bollywood',                  fetch: () => fetchByLanguage('movie', 'hi') },
  { id: 'lang_italian',        label: '🇮🇹 Italian Cinema',             fetch: () => fetchByLanguage('movie', 'it') },
  { id: 'lang_german',         label: '🇩🇪 German Films',               fetch: () => fetchByLanguage('movie', 'de') },
  { id: 'lang_portuguese',     label: '🇧🇷 Portuguese Language',        fetch: () => fetchByLanguage('movie', 'pt') },
  { id: 'lang_chinese',        label: '🇨🇳 Chinese Cinema',             fetch: () => fetchByLanguage('movie', 'zh') },
  { id: 'lang_russian',        label: '🇷🇺 Russian Films',              fetch: () => fetchByLanguage('movie', 'ru') },
  { id: 'lang_arabic',         label: '🌙 Arabic Films',                fetch: () => fetchByLanguage('movie', 'ar') },
  { id: 'lang_kdramas',        label: '🇰🇷 K-Dramas',                   fetch: () => fetchByLanguage('tv',    'ko') },
  { id: 'lang_anime_jp',       label: '🇯🇵 Japanese Anime Series',      fetch: () => fetchByLanguage('tv',    'ja') },

  // ── Special / Niche
  { id: 'short_films',         label: '⏱️ Short Films',                 fetch: () => fetchShortFilms()              },
  { id: 'cert_r',              label: '🔞 R-Rated',                     fetch: () => fetchCertified('R')            },
  { id: 'cert_pg13',           label: '🔞 PG-13',                       fetch: () => fetchCertified('PG-13')        },
  { id: 'cert_g',              label: '👶 G-Rated (All Ages)',           fetch: () => fetchCertified('G')            },

  // ── Keywords / Themes
  { id: 'kw_superhero',        label: '🦸 Superhero Films',             fetch: () => fetchByKeyword('movie', 9715)  },
  { id: 'kw_zombie',           label: '🧟 Zombie Films',                fetch: () => fetchByKeyword('movie', 12377) },
  { id: 'kw_heist',            label: '💼 Heist Films',                 fetch: () => fetchByKeyword('movie', 10944) },
  { id: 'kw_survival',         label: '🏕️ Survival Films',              fetch: () => fetchByKeyword('movie', 4565)  },
  { id: 'kw_based_true',       label: '📖 Based on True Events',        fetch: () => fetchByKeyword('movie', 10683) },
  { id: 'kw_space',            label: '🌌 Space Exploration',           fetch: () => fetchByKeyword('movie', 1326)  },
  { id: 'kw_mafia',            label: '🤌 Mafia & Gangsters',           fetch: () => fetchByKeyword('movie', 6270)  },
  { id: 'kw_time_travel',      label: '⏰ Time Travel',                 fetch: () => fetchByKeyword('movie', 4379)  },
  { id: 'kw_dystopia',         label: '🌑 Dystopian Worlds',            fetch: () => fetchByKeyword('movie', 4565)  },
  { id: 'kw_serial_killer',    label: '🔪 Serial Killers',              fetch: () => fetchByKeyword('tv',    1539)  },

  // ── Studios / Companies
  { id: 'studio_marvel',       label: '🕷️ Marvel Studios',              fetch: () => fetchByCompany('movie', 420)   },
  { id: 'studio_dc',           label: '🦇 DC Films',                    fetch: () => fetchByCompany('movie', 9993)  },
  { id: 'studio_pixar',        label: '🎈 Pixar',                       fetch: () => fetchByCompany('movie', 3)     },
  { id: 'studio_disney',       label: '🏰 Walt Disney Pictures',        fetch: () => fetchByCompany('movie', 2)     },
  { id: 'studio_wb',           label: '🎬 Warner Bros',                 fetch: () => fetchByCompany('movie', 174)   },
  { id: 'studio_universal',    label: '🌍 Universal Pictures',          fetch: () => fetchByCompany('movie', 33)    },
  { id: 'studio_sony',         label: '🎥 Sony Pictures',               fetch: () => fetchByCompany('movie', 5)     },
  { id: 'studio_a24',          label: '🎭 A24',                         fetch: () => fetchByCompany('movie', 41077) },
  { id: 'studio_paramount',    label: '⛰️ Paramount',                   fetch: () => fetchByCompany('movie', 4)     },
  { id: 'studio_dreamworks',   label: '🌊 DreamWorks',                  fetch: () => fetchByCompany('movie', 521)   },
  { id: 'studio_blumhouse',    label: '😱 Blumhouse Horror',            fetch: () => fetchByCompany('movie', 3172)  },
];

export const BROWSE_ROW_COUNT = BROWSE_ROWS.length;

export const fetchBrowseRow = async (rowIndex) => {
  const row = BROWSE_ROWS[rowIndex];
  if (!row) return { label: '', items: [] };
  try {
    const items = await row.fetch();
    return { label: row.label, items: (items || []).slice(0, 20) };
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
export const buildVidSrcUrl = (id, mediaType, season = 1, episode = 1) => {
  if (mediaType === 'movie') return `https://vidsrc.to/embed/movie/${id}`;
  return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`;
};

export const buildVidSrcAlt = (id, mediaType, season = 1, episode = 1) => {
  if (mediaType === 'movie') return `https://vidsrc.me/embed/movie?tmdb=${id}`;
  return `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`;
};

export const getTrailerKey = (videos) => {
  if (!videos?.results?.length) return null;
  return (videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')
    || videos.results.find(v => v.site === 'YouTube'))?.key || null;
};
