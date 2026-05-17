import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Star, Play, ChevronRight, RefreshCw } from 'lucide-react';
import {
  getMovieDetails, getTVDetails,
  getTrailerKey, posterUrl, backdropUrl,
} from '../api';

// ─── SOURCE REGISTRY ─────────────────────────────────────────────────────────
// Each source is a function that takes (id, type, season, episode, imdbId)
// and returns an embed URL. id = tmdbId, imdbId may be null.
const SOURCES = [
  {
    label: 'Source 1',
    name: 'VidSrc',
    build: (id, type, s, ep, imdbId) => {
      const pid = imdbId || id;
      return type === 'movie'
        ? `https://vidsrc.to/embed/movie/${pid}`
        : `https://vidsrc.to/embed/tv/${pid}/${s}/${ep}`;
    },
  },
  {
    label: 'Source 2',
    name: 'VidSrc.me',
    build: (id, type, s, ep) =>
      type === 'movie'
        ? `https://vidsrc.me/embed/movie?tmdb=${id}`
        : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${ep}`,
  },
  {
    label: 'Source 3',
    name: 'VidSrc.xyz',
    build: (id, type, s, ep, imdbId) => {
      const pid = imdbId || id;
      return type === 'movie'
        ? `https://vidsrc.xyz/embed/movie/${pid}`
        : `https://vidsrc.xyz/embed/tv/${pid}/${s}/${ep}`;
    },
  },
  {
    label: 'Source 4',
    name: 'SuperEmbed',
    build: (id, type, s, ep) =>
      type === 'movie'
        ? `https://multiembed.mov/?video_id=${id}&tmdb=1`
        : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${ep}`,
  },
  {
    label: 'Source 5',
    name: 'SmashyStream',
    build: (id, type, s, ep) =>
      type === 'movie'
        ? `https://embed.smashystream.com/playere.php?tmdb=${id}`
        : `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${ep}`,
  },
  {
    label: 'Source 6',
    name: 'EmbedSu',
    build: (id, type, s, ep, imdbId) => {
      const pid = imdbId || id;
      return type === 'movie'
        ? `https://embed.su/embed/movie/${pid}`
        : `https://embed.su/embed/tv/${pid}/${s}/${ep}`;
    },
  },
  {
    label: 'Source 7',
    name: 'AutoEmbed',
    build: (id, type, s, ep) =>
      type === 'movie'
        ? `https://autoembed.co/movie/tmdb/${id}`
        : `https://autoembed.co/tv/tmdb/${id}-${s}-${ep}`,
  },
  {
    label: 'Source 8',
    name: 'NontonGo',
    build: (id, type, s, ep) =>
      type === 'movie'
        ? `https://www.NontonGo.net/embed/movie/${id}`
        : `https://www.NontonGo.net/embed/tv/${id}/${s}/${ep}`,
  },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────
export default function Player({ media, onBack }) {
  const [details, setDetails]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [sourceIdx, setSourceIdx] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const [imdbId, setImdbId]       = useState(null);

  const isTV    = media.media_type === 'tv';
  const isAnime = media.media_type === 'anime';
  const tmdbId  = media.tmdbId;
  const type    = isTV || isAnime ? 'tv' : 'movie';
  const season  = media.season  || 1;
  const episode = media.episode || 1;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setSourceIdx(0);
      let d = null;
      if (tmdbId && !isAnime) {
        d = isTV ? await getTVDetails(tmdbId) : await getMovieDetails(tmdbId);
      }
      setDetails(d);
      const iid = d?.external_ids?.imdb_id || d?.imdb_id || null;
      setImdbId(iid);
      setLoading(false);
    };
    load();
  }, [tmdbId, isTV, isAnime, media.season, media.episode]);

  const currentSrc = useCallback(() => {
    if (!tmdbId && !imdbId) return '';
    const src = SOURCES[sourceIdx];
    return src.build(tmdbId, type, season, episode, imdbId);
  }, [sourceIdx, tmdbId, imdbId, type, season, episode]);

  const nextSource = () => setSourceIdx(i => (i + 1) % SOURCES.length);
  const prevSource = () => setSourceIdx(i => (i - 1 + SOURCES.length) % SOURCES.length);

  // Derived display values
  const title       = media.title || details?.title || details?.name || 'Untitled';
  const overview    = details?.overview || media.overview || '';
  const rating      = details?.vote_average ? details.vote_average.toFixed(1) : media.rating;
  const runtime     = details?.runtime || details?.episode_run_time?.[0];
  const releaseDate = (details?.release_date || details?.first_air_date || media.year || '').slice(0, 4);
  const genres      = details?.genres?.map(g => g.name) || [];
  const cast        = details?.credits?.cast?.slice(0, 6) || [];
  const trailerKey  = details?.videos ? getTrailerKey(details.videos) : null;
  const backdropSrc = backdropUrl(details?.backdrop_path || media.backdrop_path, 'w1280');
  const posterSrc   = posterUrl(details?.poster_path || media.poster_path, 'w342');
  const tagline     = details?.tagline || '';
  const numSeasons  = details?.number_of_seasons;
  const numEpisodes = details?.number_of_episodes;
  const embedSrc    = currentSrc();

  return (
    <div className="flex flex-col space-y-6 max-w-7xl mx-auto">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-400 hover:text-pantheon-gold transition-colors w-fit"
      >
        <ArrowLeft size={20} />
        <span className="uppercase tracking-widest text-sm font-bold">Return to Library</span>
      </button>

      {/* Player */}
      <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-pantheon-gold/10 shadow-[0_0_40px_rgba(255,215,0,0.15)]">
        {!loading && embedSrc && (
          <iframe
            key={embedSrc}
            src={embedSrc}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            frameBorder="0"
            scrolling="no"
            title="StreamPrime Player"
            allow="autoplay; fullscreen"
          />
        )}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pantheon-gold" />
            <p className="text-gray-600 text-xs uppercase tracking-widest">Loading signal...</p>
          </div>
        )}
      </div>

      {/* ── SOURCE SWITCHER ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Stream Source:</span>
          <span className="text-xs text-pantheon-gold font-black uppercase tracking-wider">
            {SOURCES[sourceIdx].label} — {SOURCES[sourceIdx].name}
          </span>
          <span className="text-xs text-gray-600 ml-1">({sourceIdx + 1}/{SOURCES.length})</span>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {SOURCES.map((src, i) => (
            <button
              key={i}
              onClick={() => setSourceIdx(i)}
              className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border transition-all ${
                i === sourceIdx
                  ? 'bg-pantheon-gold text-black border-pantheon-gold shadow-[0_0_10px_rgba(255,215,0,0.4)]'
                  : 'border-white/10 text-gray-500 hover:border-pantheon-gold/40 hover:text-pantheon-gold'
              }`}
            >
              {src.label}
            </button>
          ))}
          <button
            onClick={nextSource}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-white/10 text-gray-400 hover:border-pantheon-gold/40 hover:text-pantheon-gold transition-all"
          >
            <RefreshCw size={11} /> Try Next
          </button>
        </div>
        <p className="text-[10px] text-gray-700 italic">
          If video doesn't load or shows an error, switch to the next source.
        </p>
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        {posterSrc && (
          <div className="hidden lg:block w-36 xl:w-44 flex-shrink-0">
            <img
              src={posterSrc}
              alt={title}
              className="rounded-xl border border-pantheon-gold/20 shadow-[0_0_20px_rgba(255,215,0,0.1)] w-full"
            />
          </div>
        )}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-black text-pantheon-gold uppercase leading-tight"
              style={{ textShadow: '0 0 20px rgba(255,215,0,0.5)' }}>
            {title}
          </h1>
          {tagline && <p className="text-gray-500 italic text-sm">"{tagline}"</p>}
          {isTV && media.season && (
            <p className="text-pantheon-gold/60 font-bold tracking-widest text-sm">
              SEASON {media.season} • EPISODE {media.episode}
            </p>
          )}
          <div className="flex flex-wrap gap-3 text-sm text-gray-400 items-center">
            {releaseDate && <span>{releaseDate}</span>}
            {runtime && <span>{runtime} min</span>}
            {numSeasons && <span>{numSeasons} season{numSeasons > 1 ? 's' : ''}</span>}
            {numEpisodes && <span>{numEpisodes} episodes</span>}
            {rating && (
              <span className="flex items-center gap-1 text-pantheon-gold font-bold">
                <Star size={14} fill="currentColor" /> {rating}
              </span>
            )}
          </div>
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {genres.map(g => (
                <span key={g} className="text-xs border border-pantheon-gold/30 text-pantheon-gold/70 px-2 py-1 rounded-full">{g}</span>
              ))}
            </div>
          )}
          {overview && <p className="text-gray-400 max-w-3xl leading-relaxed text-sm">{overview}</p>}
          {trailerKey && (
            <button
              onClick={() => setShowTrailer(v => !v)}
              className="flex items-center gap-2 border border-pantheon-gold/40 text-pantheon-gold px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-pantheon-gold hover:text-black transition-all"
            >
              <Play size={14} fill="currentColor" />
              {showTrailer ? 'Hide Trailer' : 'Watch Trailer'}
            </button>
          )}
        </div>
      </div>

      {showTrailer && trailerKey && (
        <div className="relative aspect-video w-full max-w-3xl rounded-2xl overflow-hidden border border-pantheon-gold/10">
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            frameBorder="0"
            allow="autoplay; fullscreen"
            title="Trailer"
          />
        </div>
      )}

      {cast.length > 0 && (
        <div>
          <h2 className="text-pantheon-gold text-xs font-black uppercase tracking-widest mb-3 border-l-4 border-pantheon-gold pl-3">Top Cast</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {cast.map(c => (
              <div key={c.id} className="flex-shrink-0 w-20 text-center space-y-1">
                <div className="w-16 h-16 rounded-full mx-auto overflow-hidden bg-gray-900 border border-white/10">
                  {c.profile_path ? (
                    <img src={`https://image.tmdb.org/t/p/w185${c.profile_path}`} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                  )}
                </div>
                <p className="text-[10px] font-bold text-gray-300 truncate">{c.name}</p>
                <p className="text-[9px] text-gray-600 truncate">{c.character}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
