import React, { useState, useEffect } from 'react';
import { searchTMDB, searchAniList } from '../api';
import { Star } from 'lucide-react';

export default function ResultsGrid({ query, mode, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      let results = [];
      
      if (mode === 'anime') {
        results = await searchAniList(query);
        results = results.map(a => ({
          ...a,
          id: a.id,
          title: a.title.english || a.title.romaji,
          poster_path: a.coverImage.large,
          vote_average: a.averageScore / 10,
          release_date: a.seasonYear,
          media_type: 'tv', // Anime usually handled as TV
          type: 'ANIME'
        }));
      } else {
        results = await searchTMDB(query, mode === 'all' ? 'multi' : mode);
      }
      
      setItems(results);
      setLoading(false);
    };

    if (query) fetchResults();
  }, [query, mode]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pantheon-gold"></div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {items.map((item) => (
        <div 
          key={item.id}
          className="group cursor-pointer space-y-2"
          onClick={() => onSelect(item)}
        >
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden glow-border">
            <img 
              src={item.type === 'ANIME' ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`} 
              alt={item.title || item.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
              onError={(e) => e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster'}
            />
            <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-bold text-pantheon-gold flex items-center gap-1">
              <Star size={12} fill="currentColor" />
              {item.vote_average?.toFixed(1) || 'N/A'}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
               <button className="w-full bg-pantheon-gold text-black py-2 rounded font-bold text-sm">PLAY NOW</button>
            </div>
          </div>
          <div className="px-1">
            <h3 className="font-bold text-sm line-clamp-1 group-hover:text-pantheon-gold transition-colors uppercase">
              {item.title || item.name}
            </h3>
            <p className="text-xs text-gray-500">
              {item.release_date || item.first_air_date ? new Date(item.release_date || item.first_air_date).getFullYear() : 'N/A'} • {item.media_type?.toUpperCase()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
