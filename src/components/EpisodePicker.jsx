import React, { useState, useEffect } from 'react';
import { ArrowLeft, PlayCircle, Star, Clock, Calendar } from 'lucide-react';
import { getTVDetails, getTVSeason, posterUrl, backdropUrl } from '../api';

export default function EpisodePicker({ media, onBack, onPlay }) {
  const [details, setDetails]         = useState(null);
  const [seasonData, setSeasonData]   = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loadingSeason, setLoadingSeason]   = useState(false);

  const isAnime = media.media_type === 'anime';
  const tmdbId  = media.tmdbId;

  // Load show details (seasons list)
  useEffect(() => {
    const load = async () => {
      if (tmdbId && !isAnime) {
        setLoadingDetails(true);
        const d = await getTVDetails(tmdbId);
        setDetails(d);
        setLoadingDetails(false);
      } else {
        setLoadingDetails(false);
      }
    };
    load();
  }, [tmdbId, isAnime]);

  // Load selected season episodes
  useEffect(() => {
    const load = async () => {
      if (!tmdbId || isAnime) return;
      setLoadingSeason(true);
      const s = await getTVSeason(tmdbId, selectedSeason);
      setSeasonData(s);
      setLoadingSeason(false);
    };
    load();
  }, [tmdbId, selectedSeason, isAnime]);

  const posterSrc  = posterUrl(details?.poster_path || media.poster_path, 'w342');
  const backdropSrc = backdropUrl(details?.backdrop_path || media.backdrop_path, 'w1280');

  const title      = media.title || details?.name || 'Untitled';
  const overview   = details?.overview || media.overview || '';
  const rating     = details?.vote_average ? details.vote_average.toFixed(1) : media.rating;
  const year       = (details?.first_air_date || media.year || '').slice(0, 4);

  // Seasons — filter out specials (season 0) unless that's all there is
  const seasons = (details?.seasons || [])
    .filter(s => s.season_number > 0 || !details.seasons.some(x => x.season_number > 0));

  // Fallback: if no TMDB data, use generic placeholders
  const fallbackSeasons = isAnime
    ? Array.from({ length: 3 }, (_, i) => ({ season_number: i + 1, name: `Season ${i + 1}`, episode_count: 20 }))
    : Array.from({ length: 5 }, (_, i) => ({ season_number: i + 1, name: `Season ${i + 1}`, episode_count: 20 }));

  const displaySeasons = seasons.length > 0 ? seasons : fallbackSeasons;
  const currentSeason  = displaySeasons.find(s => s.season_number === selectedSeason) || displaySeasons[0];
  const episodes       = seasonData?.episodes || Array.from({ length: currentSeason?.episode_count || 20 }, (_, i) => ({ episode_number: i + 1, name: `Episode ${i + 1}` }));

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Backdrop */}
      {backdropSrc && (
        <div className="relative -mx-4 md:-mx-8 h-48 md:h-64 overflow-hidden rounded-2xl">
          <img src={backdropSrc} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Poster */}
        <div className="w-full md:w-1/4 flex-shrink-0">
          {posterSrc ? (
            <img
              src={posterSrc}
              className="w-full max-w-[180px] mx-auto md:max-w-full rounded-2xl border border-pantheon-gold/20 shadow-[0_0_30px_rgba(255,215,0,0.15)]"
              alt={title}
            />
          ) : (
            <div className="aspect-[2/3] bg-gray-900 rounded-2xl flex items-center justify-center text-5xl">
              {isAnime ? '⚔️' : '📺'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-pantheon-gold mb-2 uppercase tracking-widest text-sm font-bold">
            <ArrowLeft size={16} /> Back
          </button>

          <h1 className="text-3xl md:text-4xl font-black text-white uppercase leading-tight"
              style={{ textShadow: '0 0 20px rgba(255,215,0,0.3)' }}>
            {title}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-gray-400 items-center">
            {year && <span className="flex items-center gap-1"><Calendar size={13} />{year}</span>}
            {rating && (
              <span className="flex items-center gap-1 text-pantheon-gold font-bold">
                <Star size={13} fill="currentColor" />{rating}
              </span>
            )}
            {details?.number_of_seasons && (
              <span className="text-gray-500">{details.number_of_seasons} Seasons</span>
            )}
            {details?.number_of_episodes && (
              <span className="text-gray-500">{details.number_of_episodes} Episodes</span>
            )}
          </div>

          {overview && (
            <p className="text-gray-400 leading-relaxed text-sm max-w-2xl">{overview}</p>
          )}

          {/* Genres */}
          {details?.genres?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {details.genres.map(g => (
                <span key={g.id} className="text-xs border border-pantheon-gold/30 text-pantheon-gold/70 px-2 py-1 rounded-full">
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {/* Season selector */}
          <div className="flex flex-wrap gap-2 pt-2">
            {displaySeasons.map(s => (
              <button
                key={s.season_number}
                onClick={() => setSelectedSeason(s.season_number)}
                className={`px-3 py-1.5 rounded-full font-bold text-xs border transition-all ${
                  selectedSeason === s.season_number
                    ? 'bg-pantheon-gold text-black border-pantheon-gold shadow-[0_0_10px_rgba(255,215,0,0.3)]'
                    : 'border-gray-700 text-gray-500 hover:border-pantheon-gold/50 hover:text-gray-300'
                }`}
              >
                S{s.season_number}
                {s.episode_count ? <span className="ml-1 opacity-60 text-[10px]">{s.episode_count}ep</span> : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Episodes grid */}
      <div>
        <h2 className="text-pantheon-gold uppercase tracking-widest font-bold text-xs mb-4 border-l-4 border-pantheon-gold pl-3">
          Season {selectedSeason}
          {currentSeason?.name && currentSeason.name !== `Season ${selectedSeason}` ? ` — ${currentSeason.name}` : ''}
        </h2>

        {loadingSeason ? (
          <div className="flex items-center justify-center h-32 gap-3 text-gray-600">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-pantheon-gold" />
            <span className="text-xs uppercase tracking-widest">Loading episodes...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {episodes.map((ep) => {
              const epNum  = ep.episode_number;
              const epName = ep.name && ep.name !== `Episode ${epNum}` ? ep.name : null;
              const epStill = ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : null;
              const epRating = ep.vote_average ? ep.vote_average.toFixed(1) : null;
              const airDate = ep.air_date ? ep.air_date.slice(0, 10) : null;
              const runtime = ep.runtime;

              return (
                <button
                  key={epNum}
                  onClick={() => onPlay(selectedSeason, epNum)}
                  className="group relative bg-black rounded-xl border border-white/5 hover:border-pantheon-gold/50 transition-all overflow-hidden text-left hover:shadow-[0_0_15px_rgba(255,215,0,0.15)]"
                >
                  {/* Still or placeholder */}
                  <div className="aspect-video bg-gray-900 relative overflow-hidden">
                    {epStill ? (
                      <img src={epStill} alt={epName || `Ep ${epNum}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-700 font-black text-2xl">{epNum}</span>
                      </div>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <PlayCircle className="text-pantheon-gold drop-shadow-lg" size={28} fill="rgba(0,0,0,0.5)" />
                    </div>
                    {/* Ep number badge */}
                    <div className="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[9px] font-black text-pantheon-gold">
                      EP {epNum}
                    </div>
                    {epRating && (
                      <div className="absolute top-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[9px] font-bold text-pantheon-gold flex items-center gap-0.5">
                        <Star size={8} fill="currentColor" />{epRating}
                      </div>
                    )}
                  </div>

                  {/* Episode info */}
                  <div className="p-2 space-y-0.5">
                    {epName && (
                      <p className="text-white text-[10px] font-bold line-clamp-1 group-hover:text-pantheon-gold transition-colors">{epName}</p>
                    )}
                    <div className="flex gap-2 text-gray-600 text-[9px]">
                      {airDate && <span className="flex items-center gap-0.5"><Calendar size={8} />{airDate}</span>}
                      {runtime && <span className="flex items-center gap-0.5"><Clock size={8} />{runtime}m</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
