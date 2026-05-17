import React, { useState, useEffect } from 'react';
import { searchOMDb, searchAniList } from '../api';
import { Star } from 'lucide-react';

export default function ResultsGrid({ query, mode, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      let results = [];

      if (mode === 'anime') {
        const animeResults = await searchAniList(query);
        results = animeResults.map(a => ({
          imdbID: `anilist-${a.id}`,
          anilistId: a.id,
          Title: a.title.english || a.title.romaji,
          Poster: a.coverImage.large,
          imdbRating: a.averageScore ? (a.averageScore / 10).toFixed(1) : 'N/A',
          Year: a.seasonYear || 'N/A',
          Type: 'anime',
          Plot: a.description?.replace(/<[^>]*>?/gm, '') || '',
        }));
      } else {
        // OMDb search — filter by type if needed
        const raw = await searchOMDb(query);
        results = raw.filter(item => {
          if (mode === 'all') return true;
          if (mode === 'movie') return item.Type === 'movie';
          if (mode === 'tv') return item.Type === 'series';
          return true;
        });
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

  if (!loading && items.length === 0 && query) return (
    <div className="flex justify-center items-center h-64 text-gray-500 uppercase tracking-widest text-sm">
      No results found in the Vault.
    </div>
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {items.map((item) => (
        <div
          key={item.imdbID}
          className="group cursor-pointer space-y-2"
          onClick={() => onSelect(item)}
        >
          <div className="relative aspect-[2/3] rounded-xl overflow-hidden glow-border">
            <img
              src={item.Poster && item.Poster !== 'N/A' ? item.Poster : 'https://via.placeholder.com/500x750/0a0a0a/FFD700?text=No+Poster'}
              alt={item.Title}
              className="w-full h-full object-cover transition-transform group-hover:scale-110"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/500x750/0a0a0a/FFD700?text=No+Poster'; }}
            />
            <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs font-bold text-pantheon-gold flex items-center gap-1">
              <Star size={12} fill="currentColor" />
              {item.imdbRating || 'N/A'}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
              <button className="w-full bg-pantheon-gold text-black py-2 rounded font-bold text-sm">PLAY NOW</button>
            </div>
          </div>
          <div className="px-1">
            <h3 className="font-bold text-sm line-clamp-1 group-hover:text-pantheon-gold transition-colors uppercase">
              {item.Title}
            </h3>
            <p className="text-xs text-gray-500">
              {item.Year} • {item.Type?.toUpperCase()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
