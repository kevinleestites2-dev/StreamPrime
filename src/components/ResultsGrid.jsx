import React, { useState, useEffect } from 'react';
import { searchOMDb, searchAniList } from '../api';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ResultsGrid({ query, mode, onSelect }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [query, mode]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      let results = [];
      let total = 0;

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
        total = results.length;
      } else {
        const { items: raw, totalResults: tr } = await searchOMDb(query, page);
        results = raw.filter(item => {
          if (mode === 'all') return true;
          if (mode === 'movie') return item.Type === 'movie';
          if (mode === 'tv') return item.Type === 'series';
          return true;
        });
        total = tr;
      }

      setItems(results);
      setTotalResults(total);
      setLoading(false);
    };

    if (query) fetchResults();
  }, [query, mode, page]);

  const totalPages = Math.ceil(totalResults / 10);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-pantheon-gold"></div>
      <p className="text-gray-600 text-xs uppercase tracking-widest">Scanning the Vault...</p>
    </div>
  );

  if (!loading && items.length === 0 && query) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-3">
      <span className="text-4xl">🔍</span>
      <p className="uppercase tracking-widest text-sm">Nothing found for "{query}"</p>
      <p className="text-xs text-gray-700">Try a different title or switch mode</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Result count */}
      {totalResults > 0 && (
        <p className="text-xs text-gray-600 uppercase tracking-widest">
          {totalResults.toLocaleString()} titles found — page {page} of {totalPages}
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {items.map((item) => (
          <div
            key={item.imdbID}
            className="group cursor-pointer space-y-2"
            onClick={() => onSelect(item)}
          >
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden border border-white/5 group-hover:border-pantheon-gold/60 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(255,215,0,0.15)]">
              <img
                src={item.Poster && item.Poster !== 'N/A' ? item.Poster : 'https://via.placeholder.com/300x450/0a0a0a/FFD700?text=No+Poster'}
                alt={item.Title}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/300x450/0a0a0a/FFD700?text=No+Poster'; }}
                loading="lazy"
              />
              {/* Rating badge */}
              {item.imdbRating && item.imdbRating !== 'N/A' && (
                <div className="absolute top-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-pantheon-gold flex items-center gap-0.5">
                  <Star size={9} fill="currentColor" />
                  {item.imdbRating}
                </div>
              )}
              {/* Type badge */}
              <div className="absolute top-2 left-2">
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  item.Type === 'series' ? 'bg-blue-500/80 text-white'
                  : item.Type === 'anime' ? 'bg-purple-500/80 text-white'
                  : 'bg-pantheon-gold/80 text-black'
                }`}>
                  {item.Type === 'series' ? 'TV' : item.Type === 'movie' ? 'FILM' : item.Type?.toUpperCase()}
                </span>
              </div>
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <button className="w-full bg-pantheon-gold text-black py-2 rounded-full font-black text-[10px] uppercase tracking-widest">
                  ▶ {item.Type === 'series' || item.Type === 'anime' ? 'Watch Series' : 'Watch Now'}
                </button>
              </div>
            </div>
            <div className="px-0.5">
              <h3 className="font-bold text-xs line-clamp-1 group-hover:text-pantheon-gold transition-colors uppercase tracking-wide">
                {item.Title}
              </h3>
              <p className="text-[10px] text-gray-600">{item.Year}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 text-xs font-bold uppercase tracking-wider disabled:opacity-30 hover:border-pantheon-gold hover:text-pantheon-gold transition-all"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-xs text-gray-600 uppercase tracking-widest">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 text-xs font-bold uppercase tracking-wider disabled:opacity-30 hover:border-pantheon-gold hover:text-pantheon-gold transition-all"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
