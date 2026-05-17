import React from 'react';
import { ArrowLeft, Share2 } from 'lucide-react';
import { buildVidSrcUrl } from '../api';

export default function Player({ media, onBack }) {
  const isTV = media.Type === 'series' || media.Type === 'anime';

  // VidSrc supports both IMDb IDs and TMDB IDs — IMDb IDs work directly
  const embedUrl = buildVidSrcUrl(media.imdbID, isTV ? 'tv' : 'movie', media.season || 1, media.episode || 1);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-pantheon-gold transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="uppercase tracking-widest text-sm font-bold">Return to Library</span>
        </button>
        <div className="flex gap-4">
          <Share2 size={20} className="text-gray-400 cursor-pointer hover:text-white" />
        </div>
      </div>

      <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden border border-pantheon-gold/10" style={{ boxShadow: '0 0 40px rgba(255,215,0,0.15)' }}>
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          frameBorder="0"
          scrolling="no"
          title="StreamPrime Player"
          allow="autoplay; fullscreen"
        ></iframe>
      </div>

      <div className="space-y-2 py-4">
        <h1 className="text-3xl font-black text-pantheon-gold uppercase" style={{ textShadow: '0 0 20px rgba(255,215,0,0.5)' }}>
          {media.Title}
        </h1>
        {isTV && (
          <p className="text-pantheon-gold/60 font-bold tracking-widest">
            SEASON {media.season} • EPISODE {media.episode}
          </p>
        )}
        <div className="flex gap-4 text-sm text-gray-400">
          {media.Year && <span>{media.Year}</span>}
          {media.Runtime && media.Runtime !== 'N/A' && <span>{media.Runtime}</span>}
          {media.Rated && media.Rated !== 'N/A' && <span className="border border-gray-700 px-2 rounded">{media.Rated}</span>}
          {media.imdbRating && media.imdbRating !== 'N/A' && (
            <span className="text-pantheon-gold font-bold">★ {media.imdbRating}</span>
          )}
        </div>
        {media.Genre && media.Genre !== 'N/A' && (
          <div className="flex flex-wrap gap-2">
            {media.Genre.split(', ').map(g => (
              <span key={g} className="text-xs border border-pantheon-gold/30 text-pantheon-gold/70 px-2 py-1 rounded-full">{g}</span>
            ))}
          </div>
        )}
        <p className="text-gray-400 max-w-3xl leading-relaxed">
          {media.Plot && media.Plot !== 'N/A' ? media.Plot : media.description?.replace(/<[^>]*>?/gm, '') || ''}
        </p>
        {media.Actors && media.Actors !== 'N/A' && (
          <p className="text-xs text-gray-600 uppercase tracking-widest">Cast: {media.Actors}</p>
        )}
      </div>
    </div>
  );
}
