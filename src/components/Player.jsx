import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Star, Play } from 'lucide-react';
import {
  getMovieDetails, getTVDetails,
  buildVidSrcUrl, buildVidSrcAlt,
  getTrailerKey, posterUrl, backdropUrl,
} from '../api';

export default function Player({ media, onBack }) {
  const [details, setDetails]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [embedSrc, setEmbedSrc]     = useState('');
  const [projector, setProjector]   = useState(false);
  const [flipped, setFlipped]       = useState(true);
  const [srcIndex, setSrcIndex]     = useState(0);
  const wakeLockRef                 = useRef(null);

  // Projector Mode — request wake lock + fullscreen
  const enterProjector = async () => {
    try {
      if (navigator.wakeLock) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch (e) { /* ignore */ }
    setProjector(true);
  };

  const exitProjector = () => {
    if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; }
    if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    setProjector(false);
  };

  const isTV    = media.media_type === 'tv';
  const isAnime = media.media_type === 'anime';
  const tmdbId  = media.tmdbId;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      let d = null;
      if (tmdbId && !isAnime) {
        d = isTV ? await getTVDetails(tmdbId) : await getMovieDetails(tmdbId);
      }
      setDetails(d);

      // Build primary embed URL — use TMDB ID directly (VidSrc supports it)
      const imdbId = d?.external_ids?.imdb_id || d?.imdb_id;
      const id     = imdbId || tmdbId;
      const type   = isTV || isAnime ? 'tv' : 'movie';
      const s      = media.season   || 1;
      const ep     = media.episode  || 1;

      // Always use TMDB ID — 2embed handles it natively
      setEmbedSrc(buildVidSrcUrl(tmdbId, type, s, ep));
      setSrcIndex(0);

      setLoading(false);
    };
    load();
  }, [tmdbId, isTV, isAnime, media.season, media.episode]);

  // Derived display values
  const title       = media.title || (details?.title || details?.name) || 'Untitled';
  const overview    = details?.overview || media.overview || '';
  const rating      = details?.vote_average ? details.vote_average.toFixed(1) : media.rating;
  const runtime     = details?.runtime || (details?.episode_run_time?.[0]);
  const releaseDate = (details?.release_date || details?.first_air_date || media.year || '').slice(0, 4);
  const genres      = details?.genres?.map(g => g.name) || [];
  const cast        = details?.credits?.cast?.slice(0, 6) || [];
  const trailerKey  = details?.videos ? getTrailerKey(details.videos) : null;
  const backdropSrc = backdropUrl(details?.backdrop_path || media.backdrop_path, 'w1280');
  const posterSrc   = posterUrl(details?.poster_path || media.poster_path, 'w342');
  const tagline     = details?.tagline || '';
  const numSeasons  = details?.number_of_seasons;
  const numEpisodes = details?.number_of_episodes;

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

      {/* ── Projector Mode Overlay ── */}
      {projector && (
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          style={{ transform: flipped ? 'scaleX(-1)' : 'none' }}
        >
          <iframe
            key={embedSrc + '_proj'}
            src={embedSrc}
            className="w-full h-full"
            allowFullScreen
            frameBorder="0"
            scrolling="no"
            title="StreamPrime Projector"
            allow="autoplay; fullscreen"
            style={{ display: 'block' }}
          />
          {/* Exit — not flipped (readable even when image is mirrored) */}
          <div
            style={{ transform: flipped ? 'scaleX(-1)' : 'none' }}
            className="absolute top-4 right-4 flex gap-3 z-10"
          >
            <button
              onClick={() => setFlipped(f => !f)}
              className="bg-black/70 text-pantheon-gold text-xs font-bold px-3 py-2 rounded-lg border border-pantheon-gold/30 backdrop-blur"
            >
              {flipped ? '🔄 Flip: ON' : '🔄 Flip: OFF'}
            </button>
            <button
              onClick={exitProjector}
              className="bg-black/70 text-white text-xs font-bold px-3 py-2 rounded-lg border border-white/20 backdrop-blur"
            >
              ✕ Exit
            </button>
          </div>
        </div>
      )}

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

      {/* Player Controls — outside iframe so they're always tappable */}
      {!loading && embedSrc && (
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => {
              const type = isTV || isAnime ? 'tv' : 'movie';
              const s = media.season || 1;
              const ep = media.episode || 1;
              if (srcIndex === 0) {
                setEmbedSrc(buildVidSrcAlt(tmdbId, type, s, ep));
                setSrcIndex(1);
              } else {
                setEmbedSrc(buildVidSrcUrl(tmdbId, type, s, ep));
                setSrcIndex(0);
              }
            }}
            className="bg-gray-900 text-gray-300 text-xs font-bold px-4 py-2 rounded-lg border border-white/10 hover:border-pantheon-gold/40 hover:text-pantheon-gold transition-all uppercase tracking-widest"
          >
            🔄 Try Another Source {srcIndex === 0 ? '(Alt)' : '(Main)'}
          </button>
          <button
            onClick={enterProjector}
            className="bg-gray-900 text-pantheon-gold text-xs font-black px-4 py-2 rounded-lg border border-pantheon-gold/40 hover:bg-pantheon-gold hover:text-black transition-all uppercase tracking-widest"
          >
            📽 Projector Mode
          </button>
        </div>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
        {/* Poster */}
        {posterSrc && (
          <div className="hidden lg:block w-36 xl:w-44 flex-shrink-0">
            <img
              src={posterSrc}
              alt={title}
              className="rounded-xl border border-pantheon-gold/20 shadow-[0_0_20px_rgba(255,215,0,0.1)] w-full"
            />
          </div>
        )}

        {/* Info */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-black text-pantheon-gold uppercase leading-tight"
              style={{ textShadow: '0 0 20px rgba(255,215,0,0.5)' }}>
            {title}
          </h1>

          {tagline && (
            <p className="text-gray-500 italic text-sm">"{tagline}"</p>
          )}

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
                <span key={g} className="text-xs border border-pantheon-gold/30 text-pantheon-gold/70 px-2 py-1 rounded-full">
                  {g}
                </span>
              ))}
            </div>
          )}

          {overview && (
            <p className="text-gray-400 max-w-3xl leading-relaxed text-sm">{overview}</p>
          )}

          {/* Trailer button */}
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

      {/* Trailer embed */}
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

      {/* Cast */}
      {cast.length > 0 && (
        <div>
          <h2 className="text-pantheon-gold text-xs font-black uppercase tracking-widest mb-3 border-l-4 border-pantheon-gold pl-3">
            Top Cast
          </h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {cast.map(c => (
              <div key={c.id} className="flex-shrink-0 w-20 text-center space-y-1">
                <div className="w-16 h-16 rounded-full mx-auto overflow-hidden bg-gray-900 border border-white/10">
                  {c.profile_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${c.profile_path}`}
                      alt={c.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
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
