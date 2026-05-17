import React, { useEffect, useState, useRef } from 'react';
import { fetchBrowseRow, posterUrl } from '../api';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

export default function BrowseRow({ rowIndex, onSelect }) {
  const [row, setRow]       = useState({ label: '', items: [] });
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchBrowseRow(rowIndex).then(data => {
      setRow(data);
      setLoading(false);
    });
  }, [rowIndex]);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="mb-10">
        <div className="h-5 w-48 bg-gray-800 rounded animate-pulse mb-4" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-40 h-60 bg-gray-900 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!row.items.length) return null;

  return (
    <div className="mb-10 group/row">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-black tracking-[0.15em] uppercase text-white/90">
          {row.label}
        </h3>
        <div className="flex gap-2 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button
            onClick={() => scroll(-1)}
            className="w-7 h-7 rounded-full bg-black/60 border border-white/10 flex items-center justify-center hover:border-pantheon-gold hover:text-pantheon-gold transition-all"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => scroll(1)}
            className="w-7 h-7 rounded-full bg-black/60 border border-white/10 flex items-center justify-center hover:border-pantheon-gold hover:text-pantheon-gold transition-all"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {row.items.map((item) => (
          <BrowseCard key={`${item.media_type}-${item.id}`} item={item} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function BrowseCard({ item, onSelect }) {
  const [hovered, setHovered] = useState(false);

  const isTV       = item.media_type === 'tv';
  const title      = item.title || item.name || 'Untitled';
  const year       = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating     = item.vote_average ? item.vote_average.toFixed(1) : null;
  const overview   = item.overview || '';
  const imgUrl     = posterUrl(item.poster_path, 'w342');

  const handleClick = () => {
    onSelect({
      tmdbId:     item.id,
      media_type: item.media_type,
      title,
      year,
      rating,
      overview,
      poster_path:   item.poster_path,
      backdrop_path: item.backdrop_path,
      genre_ids:     item.genre_ids,
    });
  };

  return (
    <div
      className="flex-shrink-0 w-36 md:w-44 cursor-pointer group/card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      <div className="relative rounded-xl overflow-hidden aspect-[2/3] bg-gray-900 border border-white/5 group-hover/card:border-pantheon-gold/60 transition-all duration-300 group-hover/card:scale-105 group-hover/card:shadow-[0_0_20px_rgba(255,215,0,0.2)]">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <span className="text-3xl">{isTV ? '📺' : '🎬'}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-3 transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          {rating && (
            <div className="flex items-center gap-1 text-pantheon-gold text-xs font-bold mb-1">
              <Star size={10} className="fill-current" />
              {rating}
            </div>
          )}
          <p className="text-white text-[10px] line-clamp-3 leading-relaxed opacity-80">
            {overview.slice(0, 90)}{overview.length > 90 ? '...' : ''}
          </p>
          <div className="mt-2 bg-pantheon-gold text-black text-[9px] font-black py-1 px-2 rounded-full text-center uppercase tracking-wider">
            ▶ {isTV ? 'Watch Series' : 'Watch Now'}
          </div>
        </div>

        {/* Type badge */}
        <div className="absolute top-2 right-2">
          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${isTV ? 'bg-blue-500/80 text-white' : 'bg-pantheon-gold/80 text-black'}`}>
            {isTV ? 'TV' : 'FILM'}
          </span>
        </div>

        {/* Rating badge top-left */}
        {rating && (
          <div className="absolute top-2 left-2 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-bold text-pantheon-gold flex items-center gap-0.5">
            <Star size={8} fill="currentColor" />
            {rating}
          </div>
        )}
      </div>

      <p className="mt-2 text-[11px] font-bold text-gray-300 group-hover/card:text-pantheon-gold transition-colors truncate px-0.5">
        {title}
      </p>
      <p className="text-[10px] text-gray-600">{year}</p>
    </div>
  );
}
