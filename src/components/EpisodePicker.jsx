import React, { useState, useEffect } from 'react';
import { getTMDBDetails } from '../api';
import { ArrowLeft, PlayCircle } from 'lucide-react';

export default function EpisodePicker({ media, onBack, onPlay }) {
  const [details, setDetails] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      const data = await getTMDBDetails(media.id, 'tv');
      setDetails(data);
      if (data && data.seasons.length > 0) {
        // Skip season 0 (specials) usually
        const firstSeason = data.seasons.find(s => s.season_number > 0) || data.seasons[0];
        setSelectedSeason(firstSeason.season_number);
      }
      setLoading(false);
    };
    fetchDetails();
  }, [media.id]);

  useEffect(() => {
    if (details && selectedSeason) {
      // For simplicity, we just generate an array of episode numbers based on the season info
      const season = details.seasons.find(s => s.season_number === selectedSeason);
      if (season) {
        setEpisodes(Array.from({ length: season.episode_count }, (_, i) => i + 1));
      }
    }
  }, [details, selectedSeason]);

  if (loading) return <div>Loading episodes...</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <img 
            src={media.type === 'ANIME' ? media.poster_path : `https://image.tmdb.org/t/p/w500${media.poster_path}`} 
            className="w-full rounded-2xl glow-border shadow-gold-glow"
            alt=""
          />
        </div>
        <div className="flex-1 space-y-4">
           <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-pantheon-gold mb-4">
             <ArrowLeft size={16}/> BACK
           </button>
           <h1 className="text-4xl font-black text-white glow-text uppercase">{media.title || media.name}</h1>
           <p className="text-gray-400 text-lg">{media.overview || media.description?.replace(/<[^>]*>?/gm, '')}</p>
           
           <div className="flex flex-wrap gap-4 pt-4">
             {details?.seasons.filter(s => s.season_number > 0).map(s => (
               <button
                 key={s.id}
                 onClick={() => setSelectedSeason(s.season_number)}
                 className={`px-6 py-2 rounded-full font-bold border transition-all ${selectedSeason === s.season_number ? 'bg-pantheon-gold text-black border-pantheon-gold shadow-gold-glow' : 'border-gray-700 text-gray-500 hover:border-pantheon-gold'}`}
               >
                 SEASON {s.season_number}
               </button>
             ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {episodes.map(ep => (
          <button
            key={ep}
            onClick={() => onPlay(selectedSeason, ep)}
            className="group flex flex-col items-center gap-2 p-4 bg-pantheon-dark rounded-xl border border-white/5 hover:border-pantheon-gold/50 transition-all hover:shadow-gold-glow"
          >
            <span className="text-gray-500 group-hover:text-pantheon-gold text-xs font-bold uppercase">EPISODE</span>
            <span className="text-2xl font-black text-white group-hover:scale-110 transition-transform">{ep}</span>
            <PlayCircle className="text-pantheon-gold opacity-0 group-hover:opacity-100 transition-opacity" size={24}/>
          </button>
        ))}
      </div>
    </div>
  );
}
