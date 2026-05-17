import React, { useEffect, useState } from 'react';
import { Play, Info, Star } from 'lucide-react';
import { fetchHeroBanner, backdropUrl, posterUrl } from '../api';

export default function HeroBanner({ onSelect }) {
  const [hero, setHero] = useState(null);

  useEffect(() => {
    fetchHeroBanner().then(setHero);
  }, []);

  if (!hero) return (
    <div className="w-full h-64 md:h-96 bg-gray-950 rounded-2xl animate-pulse mb-10" />
  );

  const title    = hero.title || hero.name || '';
  const overview = hero.overview || '';
  const backdrop = backdropUrl(hero.backdrop_path, 'original');
  const rating   = hero.vote_average ? hero.vote_average.toFixed(1) : null;
  const year     = (hero.release_date || hero.first_air_date || '').slice(0, 4);

  const handleWatch = () => {
    onSelect({
      tmdbId:       hero.id,
      media_type:   hero.media_type || 'movie',
      title,
      year,
      rating,
      overview,
      poster_path:   hero.poster_path,
      backdrop_path: hero.backdrop_path,
      genre_ids:     hero.genre_ids,
    });
  };

  return (
    <div className="relative w-full h-64 md:h-[460px] rounded-2xl overflow-hidden mb-10 border border-white/5">
      {/* Backdrop */}
      {backdrop && (
        <img
          src={backdrop}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 max-w-2xl">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black bg-pantheon-gold text-black px-2 py-0.5 rounded uppercase tracking-wider">
              🔥 Trending Today
            </span>
            {rating && (
              <span className="text-[10px] flex items-center gap-1 text-pantheon-gold font-bold">
                <Star size={10} fill="currentColor" />{rating}
              </span>
            )}
            {year && <span className="text-xs text-gray-400">{year}</span>}
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight uppercase"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>
            {title}
          </h1>

          <p className="text-gray-300 text-sm md:text-base line-clamp-2 md:line-clamp-3 max-w-xl">
            {overview}
          </p>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleWatch}
              className="flex items-center gap-2 bg-pantheon-gold text-black font-black px-5 py-2.5 rounded-full text-sm uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(255,215,0,0.4)]"
            >
              <Play size={16} fill="currentColor" />
              Watch Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
