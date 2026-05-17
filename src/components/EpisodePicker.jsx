import React, { useState } from 'react';
import { ArrowLeft, PlayCircle } from 'lucide-react';

// OMDb doesn't provide episode counts — we use a reasonable default of 20
// VidSrc will just show "not found" if the episode doesn't exist
const DEFAULT_EPISODES = 20;
const MAX_SEASONS = 10;

export default function EpisodePicker({ media, onBack, onPlay }) {
  const [selectedSeason, setSelectedSeason] = useState(1);

  const isAnime = media.Type === 'anime';
  const poster = media.Poster && media.Poster !== 'N/A'
    ? media.Poster
    : 'https://via.placeholder.com/500x750/0a0a0a/FFD700?text=No+Poster';

  const episodes = Array.from({ length: DEFAULT_EPISODES }, (_, i) => i + 1);
  const seasons = Array.from({ length: MAX_SEASONS }, (_, i) => i + 1);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <img
            src={poster}
            className="w-full rounded-2xl border border-pantheon-gold/20"
            style={{ boxShadow: '0 0 30px rgba(255,215,0,0.15)' }}
            alt={media.Title}
            onError={(e) => { e.target.src = 'https://via.placeholder.com/500x750/0a0a0a/FFD700?text=No+Poster'; }}
          />
        </div>
        <div className="flex-1 space-y-4">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-pantheon-gold mb-4 uppercase tracking-widest text-sm font-bold">
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-4xl font-black text-white uppercase" style={{ textShadow: '0 0 20px rgba(255,215,0,0.3)' }}>
            {media.Title}
          </h1>
          <div className="flex gap-4 text-sm text-gray-400">
            {media.Year && <span>{media.Year}</span>}
            {media.imdbRating && media.imdbRating !== 'N/A' && (
              <span className="text-pantheon-gold font-bold">★ {media.imdbRating}</span>
            )}
          </div>
          <p className="text-gray-400 leading-relaxed">
            {media.Plot && media.Plot !== 'N/A' ? media.Plot : ''}
          </p>

          <div className="flex flex-wrap gap-3 pt-4">
            {seasons.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSeason(s)}
                className={`px-4 py-2 rounded-full font-bold text-sm border transition-all ${selectedSeason === s
                  ? 'bg-pantheon-gold text-black border-pantheon-gold'
                  : 'border-gray-700 text-gray-500 hover:border-pantheon-gold/50'}`}
              >
                S{s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-pantheon-gold uppercase tracking-widest font-bold text-sm mb-4 border-l-4 border-pantheon-gold pl-4">
          Season {selectedSeason} — Episodes
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {episodes.map(ep => (
            <button
              key={ep}
              onClick={() => onPlay(selectedSeason, ep)}
              className="group flex flex-col items-center gap-2 p-3 bg-black rounded-xl border border-white/5 hover:border-pantheon-gold/50 transition-all"
              style={{ ':hover': { boxShadow: '0 0 15px rgba(255,215,0,0.2)' } }}
            >
              <span className="text-gray-500 group-hover:text-pantheon-gold text-[10px] font-bold uppercase">EP</span>
              <span className="text-xl font-black text-white group-hover:text-pantheon-gold transition-colors">{ep}</span>
              <PlayCircle className="text-pantheon-gold opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
