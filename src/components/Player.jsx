import React from 'react';
import { ArrowLeft, Maximize, Share2 } from 'lucide-react';

export default function Player({ media, onBack }) {
  const tmdbId = media.id;
  const isTV = media.media_type === 'tv' || media.type === 'ANIME';
  
  const embedUrl = isTV 
    ? `https://vidsrc.to/embed/tv/${tmdbId}/${media.season}/${media.episode}`
    : `https://vidsrc.to/embed/movie/${tmdbId}`;

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
           <Share2 size={20} className="text-gray-400 cursor-pointer hover:text-white"/>
        </div>
      </div>

      <div className="relative aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-gold-glow-lg border border-pantheon-gold/10">
        <iframe 
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          frameBorder="0"
          scrolling="no"
          title="Video Player"
        ></iframe>
      </div>

      <div className="space-y-2 py-4">
        <h1 className="text-3xl font-black text-pantheon-gold glow-text uppercase">
          {media.title || media.name}
        </h1>
        {isTV && (
          <p className="text-pantheon-gold/60 font-bold tracking-widest">
            SEASON {media.season} • EPISODE {media.episode}
          </p>
        )}
        <p className="text-gray-400 max-w-3xl leading-relaxed">
          {media.overview || media.description?.replace(/<[^>]*>?/gm, '')}
        </p>
      </div>
    </div>
  );
}
